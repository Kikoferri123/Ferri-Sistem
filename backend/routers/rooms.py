from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Room, Bed, Client, Property, UserRole
from schemas import RoomCreate, RoomUpdate, RoomOut, BedCreate, BedOut
from auth import get_current_user, require_roles
from typing import List, Optional

router = APIRouter(prefix="/rooms", tags=["Rooms"])


@router.get("", response_model=List[RoomOut])
def list_rooms(
    property_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    q = db.query(Room)
    if property_id:
        q = q.filter(Room.property_id == property_id)
    rooms = q.order_by(Room.property_id, Room.name).all()
    result = []
    for r in rooms:
        out = RoomOut.model_validate(r)
        if r.property:
            out.property_name = r.property.name
        # Build beds with occupant info
        bed_list = []
        for b in r.beds:
            bout = BedOut.model_validate(b)
            # Find active client on this bed
            occupant = db.query(Client).filter(
                Client.bed_id == b.id,
                Client.status == "ativo"
            ).first()
            if occupant:
                bout.occupant_name = occupant.name
                bout.occupant_id = occupant.id
            bed_list.append(bout)
        out.beds = bed_list
        # Occupancy: count active clients in this room
        active_clients = db.query(Client).filter(
            Client.room_id == r.id,
            Client.status == "ativo"
        ).count()
        out.occupancy = active_clients
        # Capacity: num_beds or count of beds
        out.capacity = max(r.num_beds, len(r.beds))
        result.append(out)
    return result


@router.post("", response_model=RoomOut)
def create_room(
    data: RoomCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN, UserRole.OPERACIONAL))
):
    room = Room(
        property_id=data.property_id,
        name=data.name,
        room_type=data.room_type,
        num_beds=data.num_beds,
        monthly_value=data.monthly_value,
        notes=data.notes
    )
    db.add(room)
    db.flush()

    # Create beds if provided explicitly
    if data.beds:
        for bed_data in data.beds:
            bed = Bed(room_id=room.id, name=bed_data.name, monthly_value=bed_data.monthly_value, notes=bed_data.notes)
            db.add(bed)
    elif data.num_beds > 0 and data.auto_create_beds:
        # Auto-create beds with value split
        per_bed_value = round(data.monthly_value / data.num_beds, 2) if data.monthly_value and data.num_beds > 0 else 0
        for i in range(data.num_beds):
            bed = Bed(room_id=room.id, name=f"Cama {i + 1}", monthly_value=per_bed_value)
            db.add(bed)

    db.commit()
    db.refresh(room)
    out = RoomOut.model_validate(room)
    if room.property:
        out.property_name = room.property.name
    out.beds = [BedOut.model_validate(b) for b in room.beds]
    out.capacity = max(room.num_beds, len(room.beds))
    return out


@router.put("/{room_id}", response_model=RoomOut)
def update_room(
    room_id: int,
    data: RoomUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN, UserRole.OPERACIONAL))
):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Quarto nao encontrado")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(room, key, val)
    db.commit()
    db.refresh(room)
    out = RoomOut.model_validate(room)
    if room.property:
        out.property_name = room.property.name
    out.beds = [BedOut.model_validate(b) for b in room.beds]
    return out


@router.delete("/{room_id}")
def delete_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN))
):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Quarto nao encontrado")
    db.delete(room)
    db.commit()
    return {"detail": "Quarto removido"}


# ── Beds ──────────────────────────────────────────────
@router.post("/{room_id}/beds", response_model=BedOut)
def add_bed(
    room_id: int,
    data: BedCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN, UserRole.OPERACIONAL))
):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Quarto nao encontrado")
    bed = Bed(room_id=room_id, name=data.name, monthly_value=data.monthly_value, notes=data.notes)
    db.add(bed)
    db.commit()
    db.refresh(bed)
    return BedOut.model_validate(bed)


@router.delete("/beds/{bed_id}")
def delete_bed(
    bed_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN))
):
    bed = db.query(Bed).filter(Bed.id == bed_id).first()
    if not bed:
        raise HTTPException(status_code=404, detail="Cama nao encontrada")
    db.delete(bed)
    db.commit()
    return {"detail": "Cama removida"}


# ── Availability Map ──────────────────────────────────
@router.get("/availability", response_model=list)
def get_availability(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Returns availability map: properties > rooms > beds with occupancy info."""
    properties = db.query(Property).filter(Property.status == "ativo").order_by(Property.name).all()
    result = []

    for prop in properties:
        rooms_data = []
        prop_total_capacity = 0
        prop_total_occupied = 0

        for room in prop.rooms:
            beds_data = []
            room_occupied = 0

            for bed in room.beds:
                occupant = db.query(Client).filter(
                    Client.bed_id == bed.id,
                    Client.status == "ativo"
                ).first()
                beds_data.append({
                    "id": bed.id,
                    "name": bed.name,
                    "monthly_value": bed.monthly_value,
                    "occupied": occupant is not None,
                    "client_name": occupant.name if occupant else None,
                    "client_id": occupant.id if occupant else None,
                    "check_out": str(occupant.check_out) if occupant and occupant.check_out else None
                })
                if occupant:
                    room_occupied += 1

            # Room-level clients (no bed assigned)
            room_clients = db.query(Client).filter(
                Client.room_id == room.id,
                Client.bed_id == None,
                Client.status == "ativo"
            ).all()

            capacity = max(room.num_beds, len(room.beds))
            occupied = room_occupied + len(room_clients)

            rooms_data.append({
                "id": room.id,
                "name": room.name,
                "room_type": room.room_type.value,
                "monthly_value": room.monthly_value,
                "capacity": capacity,
                "occupied": occupied,
                "available": capacity - occupied,
                "beds": beds_data,
                "room_clients": [{"id": c.id, "name": c.name, "check_out": str(c.check_out) if c.check_out else None} for c in room_clients]
            })
            prop_total_capacity += capacity
            prop_total_occupied += occupied

        # Property-level clients (no room assigned)
        prop_clients = db.query(Client).filter(
            Client.property_id == prop.id,
            Client.room_id == None,
            Client.status == "ativo"
        ).all()

        result.append({
            "id": prop.id,
            "name": prop.name,
            "address": prop.address,
            "type": prop.type.value,
            "total_capacity": prop_total_capacity,
            "total_occupied": prop_total_occupied,
            "total_available": prop_total_capacity - prop_total_occupied,
            "rooms": rooms_data,
            "direct_clients": [{"id": c.id, "name": c.name, "check_out": str(c.check_out) if c.check_out else None} for c in prop_clients]
        })

    return result
