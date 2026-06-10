"""
Temporary endpoint to import tenants from parsed spreadsheet data.
POST /import/tenants with JSON body.
Also includes cleanup endpoints.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func
from database import get_db
from models import Property, Room, Client, PropertyType, PropertyStatus, ClientStatus, RoomType, Bed, Contract, Document, TransactionIn, TransactionOut
from auth import get_current_user, require_roles
from models import UserRole

router = APIRouter(prefix="/import", tags=["Import"])


def _next_property_code(db):
    last = db.query(Property).filter(Property.code != None).order_by(Property.code.desc()).first()
    if last and last.code and last.code.startswith("PROP-"):
        try:
            num = int(last.code.split("-")[1]) + 1
        except:
            num = 1
    else:
        num = 1
    return f"PROP-{str(num).zfill(3)}"


def _next_client_code(db):
    last = db.query(Client).filter(Client.code != None).order_by(Client.code.desc()).first()
    if last and last.code and last.code.startswith("CLI-"):
        try:
            num = int(last.code.split("-")[1]) + 1
        except:
            num = 1
    else:
        num = 1
    return f"CLI-{str(num).zfill(3)}"


@router.post("/tenants")
def import_tenants(
    payload: dict,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN))
):
    """
    Import tenants from parsed spreadsheet data.
    Expects: { "properties": [ { "name": "...", "rooms": [ { "name": "...", "clients": [ { "name", "phone", "passport", "trn" } ] } ] } ] }
    """
    properties_data = payload.get("properties", [])

    existing_props = {p.name.lower().strip(): p for p in db.query(Property).all()}
    existing_clients = {c.name.lower().strip(): c for c in db.query(Client).all()}

    stats = {"props_created": 0, "rooms_created": 0, "clients_created": 0, "clients_updated": 0, "clients_skipped": 0}

    for prop_data in properties_data:
        prop_name = prop_data["name"]
        prop_key = prop_name.lower().strip()

        if prop_key in existing_props:
            prop = existing_props[prop_key]
        else:
            prop = Property(
                name=prop_name,
                code=_next_property_code(db),
                type=PropertyType.APARTAMENTO,
                status=PropertyStatus.ATIVO,
                monthly_rent=0,
            )
            db.add(prop)
            db.flush()
            existing_props[prop_key] = prop
            stats["props_created"] += 1

        existing_rooms = {r.name.lower().strip(): r for r in db.query(Room).filter(Room.property_id == prop.id).all()}

        for room_data in prop_data.get("rooms", []):
            room_name = room_data["name"]
            room_key = room_name.lower().strip()
            num_clients = len(room_data.get("clients", []))
            room_type = RoomType.COMPARTILHADO if num_clients > 1 else RoomType.INDIVIDUAL

            if room_key in existing_rooms:
                room = existing_rooms[room_key]
            else:
                room = Room(
                    property_id=prop.id,
                    name=room_name,
                    room_type=room_type,
                    num_beds=max(num_clients, 1),
                    monthly_value=0,
                )
                db.add(room)
                db.flush()
                existing_rooms[room_key] = room
                stats["rooms_created"] += 1

            for cl in room_data.get("clients", []):
                cl_name = cl["name"]
                cl_key = cl_name.lower().strip()

                if cl_key in existing_clients:
                    existing_cl = existing_clients[cl_key]
                    if not existing_cl.property_id:
                        existing_cl.property_id = prop.id
                        existing_cl.room_id = room.id
                        stats["clients_updated"] += 1
                    else:
                        stats["clients_skipped"] += 1
                    continue

                trn_str = str(cl.get("trn")) if cl.get("trn") else None
                client = Client(
                    name=cl_name,
                    code=_next_client_code(db),
                    phone=cl.get("phone") or None,
                    document_id=cl.get("passport") or None,
                    referencia=f"TRN-{trn_str}" if trn_str else None,
                    status=ClientStatus.ATIVO,
                    property_id=prop.id,
                    room_id=room.id,
                    monthly_value=0,
                )
                db.add(client)
                db.flush()
                existing_clients[cl_key] = client
                stats["clients_created"] += 1

    db.commit()
    return {"detail": "Import concluído", **stats}


@router.post("/cleanup-duplicates")
def cleanup_duplicates(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN))
):
    """
    Find and remove duplicate properties, keeping the one with the most rooms/clients.
    Re-link orphaned clients to the correct property/room.
    """
    stats = {
        "duplicate_groups": 0,
        "properties_deleted": 0,
        "rooms_migrated": 0,
        "clients_relinked": 0,
        "rooms_deleted": 0,
    }

    # --- Step 1: Find duplicate property names (case-insensitive) ---
    all_props = db.query(Property).all()
    # Group by normalized name
    name_groups = {}
    for p in all_props:
        key = p.name.lower().strip()
        if key not in name_groups:
            name_groups[key] = []
        name_groups[key].append(p)

    for name_key, props in name_groups.items():
        if len(props) < 2:
            continue

        stats["duplicate_groups"] += 1

        # Score each property: prefer the one with more rooms, clients, contracts, etc.
        def score(prop):
            rooms = db.query(Room).filter(Room.property_id == prop.id).count()
            clients = db.query(Client).filter(Client.property_id == prop.id).count()
            contracts = db.query(Contract).filter(Contract.property_id == prop.id).count()
            return rooms + clients * 10 + contracts * 5

        props_scored = sorted(props, key=score, reverse=True)
        keeper = props_scored[0]
        duplicates = props_scored[1:]

        # Build a mapping of room names in the keeper
        keeper_rooms = {r.name.lower().strip(): r for r in db.query(Room).filter(Room.property_id == keeper.id).all()}

        for dup in duplicates:
            # Migrate rooms and clients from duplicate to keeper
            dup_rooms = db.query(Room).filter(Room.property_id == dup.id).all()
            for dup_room in dup_rooms:
                room_key = dup_room.name.lower().strip()
                if room_key in keeper_rooms:
                    target_room = keeper_rooms[room_key]
                    # Move clients from dup_room to keeper's room
                    dup_room_clients = db.query(Client).filter(Client.room_id == dup_room.id).all()
                    for cl in dup_room_clients:
                        cl.property_id = keeper.id
                        cl.room_id = target_room.id
                        stats["clients_relinked"] += 1
                    # Move beds
                    dup_beds = db.query(Bed).filter(Bed.room_id == dup_room.id).all()
                    for bed in dup_beds:
                        bed.room_id = target_room.id
                    # Delete the duplicate room
                    db.delete(dup_room)
                    stats["rooms_deleted"] += 1
                else:
                    # Move the entire room to the keeper property
                    dup_room.property_id = keeper.id
                    # Also update clients in this room
                    room_clients = db.query(Client).filter(Client.room_id == dup_room.id).all()
                    for cl in room_clients:
                        cl.property_id = keeper.id
                    keeper_rooms[room_key] = dup_room
                    stats["rooms_migrated"] += 1

            # Move any remaining clients that reference the dup property directly
            remaining_clients = db.query(Client).filter(Client.property_id == dup.id).all()
            for cl in remaining_clients:
                cl.property_id = keeper.id
                stats["clients_relinked"] += 1

            # Move contracts
            dup_contracts = db.query(Contract).filter(Contract.property_id == dup.id).all()
            for c in dup_contracts:
                c.property_id = keeper.id

            # Move transactions
            for tx in db.query(TransactionIn).filter(TransactionIn.property_id == dup.id).all():
                tx.property_id = keeper.id
            for tx in db.query(TransactionOut).filter(TransactionOut.property_id == dup.id).all():
                tx.property_id = keeper.id

            # Move documents
            for doc in db.query(Document).filter(Document.property_id == dup.id).all():
                doc.property_id = keeper.id

            # Now delete the duplicate property
            db.delete(dup)
            stats["properties_deleted"] += 1

        db.flush()

    # --- Step 2: Fix clients with no property_id/room_id ---
    orphan_clients = db.query(Client).filter(
        (Client.property_id == None) | (Client.room_id == None)
    ).all()

    for cl in orphan_clients:
        # Try to find a matching room by checking import data (referencia has TRN)
        # For now, just count them
        pass

    stats["orphan_clients_remaining"] = len(orphan_clients)

    db.commit()
    return {"detail": "Limpeza concluída", **stats}


@router.get("/check-duplicates")
def check_duplicates(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN))
):
    """
    Check for duplicate properties without making changes.
    """
    all_props = db.query(Property).all()
    name_groups = {}
    for p in all_props:
        key = p.name.lower().strip()
        if key not in name_groups:
            name_groups[key] = []
        name_groups[key].append(p)

    duplicates = []
    for name_key, props in name_groups.items():
        if len(props) < 2:
            continue
        group = []
        for p in props:
            rooms = db.query(Room).filter(Room.property_id == p.id).count()
            clients = db.query(Client).filter(Client.property_id == p.id).count()
            group.append({
                "id": p.id,
                "code": p.code,
                "name": p.name,
                "rooms": rooms,
                "clients": clients,
            })
        duplicates.append({"name": name_key, "properties": group})

    # Also count clients with no property link
    orphan_clients = db.query(Client).filter(Client.property_id == None).count()
    unlinked_room = db.query(Client).filter(Client.room_id == None).count()

    return {
        "duplicate_groups": len(duplicates),
        "duplicates": duplicates,
        "clients_no_property": orphan_clients,
        "clients_no_room": unlinked_room,
        "total_properties": len(all_props),
    }


@router.get("/list-properties")
def list_all_properties(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN))
):
    """List all properties with room and client counts for identifying duplicates."""
    all_props = db.query(Property).order_by(Property.name).all()
    result = []
    for p in all_props:
        rooms = db.query(Room).filter(Room.property_id == p.id).count()
        clients = db.query(Client).filter(Client.property_id == p.id).count()
        result.append({
            "id": p.id,
            "code": p.code,
            "name": p.name,
            "rooms": rooms,
            "clients": clients,
        })
    return {"total": len(result), "properties": result}


@router.post("/delete-properties")
def delete_properties(
    payload: dict,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN))
):
    """
    Delete specific properties by ID list.
    Expects: { "ids": [1, 2, 3], "migrate_to": { "1": 5, "2": 5 } }
    - ids: property IDs to delete
    - migrate_to: optional mapping of old_prop_id -> new_prop_id to migrate clients/rooms before deleting
    """
    ids_to_delete = payload.get("ids", [])
    migrate_map = payload.get("migrate_to", {})
    stats = {"deleted": 0, "clients_migrated": 0, "rooms_migrated": 0, "errors": []}

    for prop_id in ids_to_delete:
        prop = db.query(Property).filter(Property.id == prop_id).first()
        if not prop:
            stats["errors"].append(f"Property {prop_id} not found")
            continue

        target_id = migrate_map.get(str(prop_id))
        if target_id:
            target_prop = db.query(Property).filter(Property.id == target_id).first()
            if not target_prop:
                stats["errors"].append(f"Target property {target_id} not found for migration")
                continue

            # Build room mapping
            target_rooms = {r.name.lower().strip(): r for r in db.query(Room).filter(Room.property_id == target_id).all()}

            # Migrate rooms
            source_rooms = db.query(Room).filter(Room.property_id == prop_id).all()
            for room in source_rooms:
                rkey = room.name.lower().strip()
                if rkey in target_rooms:
                    # Move clients to target room
                    for cl in db.query(Client).filter(Client.room_id == room.id).all():
                        cl.property_id = target_id
                        cl.room_id = target_rooms[rkey].id
                        stats["clients_migrated"] += 1
                    # Move beds
                    for bed in db.query(Bed).filter(Bed.room_id == room.id).all():
                        bed.room_id = target_rooms[rkey].id
                    db.delete(room)
                else:
                    room.property_id = target_id
                    for cl in db.query(Client).filter(Client.room_id == room.id).all():
                        cl.property_id = target_id
                        stats["clients_migrated"] += 1
                    stats["rooms_migrated"] += 1

            # Migrate remaining clients
            for cl in db.query(Client).filter(Client.property_id == prop_id).all():
                cl.property_id = target_id
                stats["clients_migrated"] += 1

            # Migrate contracts, transactions, documents
            for c in db.query(Contract).filter(Contract.property_id == prop_id).all():
                c.property_id = target_id
            for tx in db.query(TransactionIn).filter(TransactionIn.property_id == prop_id).all():
                tx.property_id = target_id
            for tx in db.query(TransactionOut).filter(TransactionOut.property_id == prop_id).all():
                tx.property_id = target_id
            for doc in db.query(Document).filter(Document.property_id == prop_id).all():
                doc.property_id = target_id
        else:
            # No migration - just unlink clients
            for cl in db.query(Client).filter(Client.property_id == prop_id).all():
                cl.property_id = None
                cl.room_id = None
            # Delete rooms (cascade should handle beds)
            for room in db.query(Room).filter(Room.property_id == prop_id).all():
                db.delete(room)
            # Unlink contracts, transactions
            for c in db.query(Contract).filter(Contract.property_id == prop_id).all():
                c.property_id = None
            for tx in db.query(TransactionIn).filter(TransactionIn.property_id == prop_id).all():
                tx.property_id = None
            for tx in db.query(TransactionOut).filter(TransactionOut.property_id == prop_id).all():
                tx.property_id = None

        db.delete(prop)
        db.flush()
        stats["deleted"] += 1

    db.commit()
    return {"detail": "Propriedades deletadas", **stats}


@router.post("/reindex-codes")
def reindex_codes(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN))
):
    """
    Reorganize all property and client codes sequentially.
    Properties: PROP-001, PROP-002, ... ordered by name.
    Clients: CLI-001, CLI-002, ... ordered by name.
    """
    stats = {"properties_reindexed": 0, "clients_reindexed": 0}

    # Step 1: Set all codes to temporary unique values to avoid unique constraint conflicts
    all_props = db.query(Property).order_by(Property.name).all()
    for i, prop in enumerate(all_props, start=1):
        prop.code = f"_TMP_PROP_{i}"
    db.flush()

    all_clients = db.query(Client).order_by(Client.name).all()
    for i, client in enumerate(all_clients, start=1):
        client.code = f"_TMP_CLI_{i}"
    db.flush()

    # Step 2: Assign final sequential codes
    for i, prop in enumerate(all_props, start=1):
        new_code = f"PROP-{str(i).zfill(3)}"
        prop.code = new_code
        stats["properties_reindexed"] += 1

    for i, client in enumerate(all_clients, start=1):
        new_code = f"CLI-{str(i).zfill(3)}"
        client.code = new_code
        stats["clients_reindexed"] += 1

    db.commit()
    return {"detail": "Códigos reorganizados", **stats}


@router.post("/rent-payments")
def import_rent_payments(
    payload: dict,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN))
):
    """
    Import rent payments as TransactionOut records.
    Expects: { "payments": [ { "date", "description", "method", "amount", "category", "property_name" } ] }
    Matches property_name to existing properties (fuzzy by contains).
    """
    from datetime import datetime

    payments_data = payload.get("payments", [])
    all_props = db.query(Property).all()

    # Build lookup: lowercase name -> property
    props_by_name = {}
    for p in all_props:
        props_by_name[p.name.lower().strip()] = p

    stats = {"created": 0, "skipped": 0, "not_found": [], "total_amount": 0}

    for pay in payments_data:
        prop_name = pay.get("property_name", "").strip()
        prop_key = prop_name.lower().strip()

        # Try exact match first
        prop = props_by_name.get(prop_key)

        # If not found, try contains match
        if not prop:
            for db_name, db_prop in props_by_name.items():
                if prop_key in db_name or db_name in prop_key:
                    prop = db_prop
                    break

        # If still not found, try matching by significant words
        if not prop:
            prop_words = [w for w in prop_key.split() if len(w) > 2]
            best_match = None
            best_score = 0
            for db_name, db_prop in props_by_name.items():
                score = sum(1 for w in prop_words if w in db_name)
                if score > best_score:
                    best_score = score
                    best_match = db_prop
            if best_score >= max(1, len(prop_words) // 2):
                prop = best_match

        if not prop:
            if prop_name != "Geral":  # Skip "Geral" (general expense, not a property)
                stats["not_found"].append(prop_name)
            # Still create the transaction without property link for "Geral"
            if prop_name == "Geral":
                date_obj = datetime.strptime(pay["date"], "%Y-%m-%d").date()
                tx = TransactionOut(
                    date=date_obj,
                    description=f"Aluguel - {prop_name}",
                    method=pay.get("method", "credit"),
                    total_paid=pay["amount"],
                    category="House - Rent",
                    property_id=None,
                    competencia_month=date_obj.month,
                    competencia_year=date_obj.year,
                )
                db.add(tx)
                stats["created"] += 1
                stats["total_amount"] += pay["amount"]
            continue

        date_obj = datetime.strptime(pay["date"], "%Y-%m-%d").date()
        tx = TransactionOut(
            date=date_obj,
            description=f"Aluguel - {prop.name}",
            method=pay.get("method", "credit"),
            total_paid=pay["amount"],
            category="House - Rent",
            property_id=prop.id,
            competencia_month=date_obj.month,
            competencia_year=date_obj.year,
        )
        db.add(tx)
        stats["created"] += 1
        stats["total_amount"] += pay["amount"]

    db.commit()
    return {"detail": "Pagamentos importados", **stats}


@router.post("/update-rents")
def update_property_rents(
    payload: dict,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN))
):
    """
    Update monthly_rent on property profiles.
    Expects: { "properties": [ { "property_name": "...", "monthly_rent": 1234.56 } ] }
    Matches property_name to existing properties (fuzzy).
    """
    props_data = payload.get("properties", [])
    all_props = db.query(Property).all()

    props_by_name = {}
    for p in all_props:
        props_by_name[p.name.lower().strip()] = p

    stats = {"updated": 0, "not_found": [], "details": []}

    for item in props_data:
        prop_name = item.get("property_name", "").strip()
        rent = item.get("monthly_rent", 0)
        prop_key = prop_name.lower().strip()

        if prop_key == "geral":
            continue

        # Exact match
        prop = props_by_name.get(prop_key)

        # Contains match
        if not prop:
            for db_name, db_prop in props_by_name.items():
                if prop_key in db_name or db_name in prop_key:
                    prop = db_prop
                    break

        # Word match
        if not prop:
            prop_words = [w for w in prop_key.split() if len(w) > 2]
            best_match = None
            best_score = 0
            for db_name, db_prop in props_by_name.items():
                score = sum(1 for w in prop_words if w in db_name)
                if score > best_score:
                    best_score = score
                    best_match = db_prop
            if best_score >= max(1, len(prop_words) // 2):
                prop = best_match

        if not prop:
            stats["not_found"].append(prop_name)
            continue

        prop.monthly_rent = rent
        stats["updated"] += 1
        stats["details"].append({"name": prop.name, "rent": rent})

    db.commit()
    return {"detail": "Aluguéis atualizados", **stats}


@router.post("/fix-rent-competencia")
def fix_rent_competencia(
    payload: dict,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN))
):
    """
    Fix competencia_month/year on rent TransactionOut records.
    Expects: { "month": 2, "year": 2026 }
    Updates all TransactionOut with category 'House - Rent' that have
    competencia_month in Jan or Feb 2026 (from the recent import).
    """
    month = payload.get("month", 2)
    year = payload.get("year", 2026)

    txs = db.query(TransactionOut).filter(
        TransactionOut.category == "House - Rent",
        TransactionOut.competencia_year == 2026,
        TransactionOut.competencia_month.in_([1, 2])
    ).all()

    count = 0
    for tx in txs:
        if tx.competencia_month != month or tx.competencia_year != year:
            tx.competencia_month = month
            tx.competencia_year = year
            count += 1

    db.commit()
    return {"detail": "Competência corrigida", "updated": count, "total_found": len(txs)}


def _match_property(prop_name, props_by_name):
    """Fuzzy match property name to existing properties."""
    if not prop_name or prop_name.lower().strip() == "geral":
        return None
    prop_key = prop_name.lower().strip()

    # CSV abbreviation aliases → system name patterns
    ALIASES = {
        "gwos": "great william",
        "ggs": "gerald griffin st",
        "dominick st": "dominic street",
        "dominick": "dominic",
        "turners cross": "turners cross",
        "melbourne av": "melbourne",
        "60 dominick": "60 dominic",
        "great william": "great william",
    }

    # Expand abbreviations in the search key
    expanded = prop_key
    for abbr, full in ALIASES.items():
        if abbr in expanded:
            expanded = expanded.replace(abbr, full)

    # Exact match
    prop = props_by_name.get(prop_key)
    if prop:
        return prop

    # Exact match on expanded name
    prop = props_by_name.get(expanded)
    if prop:
        return prop

    # Contains match (both original and expanded)
    for db_name, db_prop in props_by_name.items():
        if prop_key in db_name or db_name in prop_key:
            return db_prop
        if expanded in db_name or db_name in expanded:
            return db_prop

    # Apt format: "Apt1, 68 GGS" → look for "68 gerald griffin st, apt1"
    import re
    apt_match = re.match(r'apt(\d+),?\s*(.+)', prop_key)
    if apt_match:
        apt_num = apt_match.group(1)
        address = apt_match.group(2).strip()
        for abbr, full in ALIASES.items():
            address = address.replace(abbr, full)
        for db_name, db_prop in props_by_name.items():
            if address in db_name and f"apt{apt_num}" in db_name.replace(" ", ""):
                return db_prop

    # Word match
    search_words = [w for w in expanded.split() if len(w) > 2]
    best_match = None
    best_score = 0
    for db_name, db_prop in props_by_name.items():
        score = sum(1 for w in search_words if w in db_name)
        if score > best_score:
            best_score = score
            best_match = db_prop
    if best_score >= max(1, len(search_words) // 2):
        return best_match
    return None


@router.post("/bulk-transactions")
def import_bulk_transactions(
    payload: dict,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN))
):
    """
    Import IN and OUT transactions in bulk.
    Expects: {
        "transactions_in": [ { "date", "description", "method", "amount", "amount_rent", "amount_deposit", "category", "property_name", "competencia_month", "competencia_year" } ],
        "transactions_out": [ { "date", "description", "method", "amount", "category", "property_name", "competencia_month", "competencia_year" } ]
    }
    """
    from datetime import datetime

    all_props = db.query(Property).all()
    props_by_name = {p.name.lower().strip(): p for p in all_props}

    stats = {
        "in_created": 0, "out_created": 0,
        "in_not_found": [], "out_not_found": [],
        "in_total": 0, "out_total": 0,
    }

    # Import IN transactions
    for tx_data in payload.get("transactions_in", []):
        prop = _match_property(tx_data.get("property_name", ""), props_by_name)
        date_obj = datetime.strptime(tx_data["date"], "%Y-%m-%d").date()
        comp_month = tx_data.get("competencia_month", date_obj.month)
        comp_year = tx_data.get("competencia_year", date_obj.year)

        tx = TransactionIn(
            date=date_obj,
            description=tx_data.get("description", ""),
            method=tx_data.get("method", "credit"),
            amount=tx_data.get("amount", 0),
            category=tx_data.get("category", "Rent"),
            property_id=prop.id if prop else None,
            competencia_month=comp_month,
            competencia_year=comp_year,
            invoice=tx_data.get("invoice", ""),
            lodgement=tx_data.get("lodgement", ""),
        )
        db.add(tx)
        stats["in_created"] += 1
        stats["in_total"] += tx_data.get("amount", 0)

        if not prop and tx_data.get("property_name", "").lower().strip() not in ("geral", ""):
            pn = tx_data.get("property_name", "")
            if pn not in stats["in_not_found"]:
                stats["in_not_found"].append(pn)

    # Import OUT transactions
    for tx_data in payload.get("transactions_out", []):
        prop = _match_property(tx_data.get("property_name", ""), props_by_name)
        date_obj = datetime.strptime(tx_data["date"], "%Y-%m-%d").date()
        comp_month = tx_data.get("competencia_month", date_obj.month)
        comp_year = tx_data.get("competencia_year", date_obj.year)

        tx = TransactionOut(
            date=date_obj,
            description=tx_data.get("description", ""),
            method=tx_data.get("method", "credit"),
            total_paid=tx_data.get("amount", 0),
            category=tx_data.get("category", "Others"),
            property_id=prop.id if prop else None,
            competencia_month=comp_month,
            competencia_year=comp_year,
        )
        db.add(tx)
        stats["out_created"] += 1
        stats["out_total"] += tx_data.get("amount", 0)

        if not prop and tx_data.get("property_name", "").lower().strip() not in ("geral", ""):
            pn = tx_data.get("property_name", "")
            if pn not in stats["out_not_found"]:
                stats["out_not_found"].append(pn)

    db.commit()
    return {"detail": "Transações importadas", **stats}


@router.delete("/transactions-2026")
def delete_transactions_2026(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN))
):
    """Delete all 2026 transactions (IN and OUT). Keeps 2025 and earlier."""
    from datetime import date as dt_date

    cutoff = dt_date(2026, 1, 1)

    in_count = db.query(TransactionIn).filter(TransactionIn.date >= cutoff).count()
    out_count = db.query(TransactionOut).filter(TransactionOut.date >= cutoff).count()

    db.query(TransactionIn).filter(TransactionIn.date >= cutoff).delete()
    db.query(TransactionOut).filter(TransactionOut.date >= cutoff).delete()

    db.commit()
    return {
        "detail": "Transações 2026 excluídas",
        "in_deleted": in_count,
        "out_deleted": out_count
    }


@router.post("/csv-import-2026")
def csv_import_2026(
    payload: dict = {},
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN))
):
    """
    Import 2026 transactions from CSV files in backend/data/ directory.
    Reads in_2026.csv and out_2026.csv from disk.
    Optionally accepts: { "delete_existing": true }
    Parses CSV, maps properties with fuzzy matching, and creates transactions.
    """
    import csv
    import io
    from datetime import datetime, date as dt_date

    # Delete existing 2026 data first (default True)
    if payload.get("delete_existing", True):
        cutoff = dt_date(2026, 1, 1)
        del_in = db.query(TransactionIn).filter(TransactionIn.date >= cutoff).count()
        del_out = db.query(TransactionOut).filter(TransactionOut.date >= cutoff).count()
        db.query(TransactionIn).filter(TransactionIn.date >= cutoff).delete()
        db.query(TransactionOut).filter(TransactionOut.date >= cutoff).delete()
        db.flush()
    else:
        del_in = 0
        del_out = 0

    all_props = db.query(Property).all()
    props_by_name = {p.name.lower().strip(): p for p in all_props}

    def parse_amount(val):
        if not val or not val.strip():
            return 0.0
        val = val.strip().replace('"', '').replace(',', '')
        try:
            return float(val)
        except:
            return 0.0

    def parse_date(date_str):
        parts = date_str.strip().split('/')
        if len(parts) == 3:
            return dt_date(int(parts[2]), int(parts[1]), int(parts[0]))
        return None

    def parse_competencia(val):
        val = val.strip().lower()
        month_map = {'jan': 1, 'fev': 2, 'mar': 3, 'abr': 4, 'mai': 5, 'jun': 6,
                     'jul': 7, 'ago': 8, 'set': 9, 'out': 10, 'nov': 11, 'dez': 12}
        if '/' in val:
            parts = val.split('/')
            month_str = parts[0]
            year = 2025 if parts[1] in ('25',) else 2026
            return month_map.get(month_str), year
        try:
            return int(val), 2026
        except:
            return None, 2026

    stats = {
        "in_deleted": del_in, "out_deleted": del_out,
        "in_created": 0, "out_created": 0,
        "in_total": 0.0, "out_total": 0.0,
        "in_not_found": [], "out_not_found": [],
        "in_skipped": 0, "out_skipped": 0,
    }

    # Read CSV files from disk
    import os
    data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
    csv_in_path = os.path.join(data_dir, "in_2026.csv")
    csv_out_path = os.path.join(data_dir, "out_2026.csv")

    # Parse and import IN CSV
    csv_in_text = ""
    if os.path.exists(csv_in_path):
        with open(csv_in_path, 'r', encoding='utf-8') as f:
            csv_in_text = f.read()
    if csv_in_text:
        reader = csv.DictReader(io.StringIO(csv_in_text))
        for row in reader:
            date_str = row.get('Date', '').strip()
            if not date_str:
                continue
            date_obj = parse_date(date_str)
            if not date_obj:
                stats["in_skipped"] += 1
                continue

            amount_bank = parse_amount(row.get('Amount Bank', ''))
            amount = amount_bank
            if amount == 0:
                stats["in_skipped"] += 1
                continue

            comp_raw = row.get('Mês Competência', row.get('M\u00eas Compet\u00eancia', '')).strip()
            if comp_raw:
                comp_month, comp_year = parse_competencia(comp_raw)
            else:
                comp_month, comp_year = date_obj.month, 2026

            prop_name = row.get('Propriedade', '').strip()
            prop = _match_property(prop_name, props_by_name)

            tx = TransactionIn(
                date=date_obj,
                description=row.get('Description', '').strip(),
                method=row.get('Method', '').strip() or "Credit",
                amount=amount,
                category=row.get('Category', '').strip() or "Rent",
                property_id=prop.id if prop else None,
                competencia_month=comp_month,
                competencia_year=comp_year,
                invoice=row.get('Invoice', '').strip(),
                lodgement=row.get('Lodgement', '').strip(),
            )
            db.add(tx)
            stats["in_created"] += 1
            stats["in_total"] += amount

            if not prop and prop_name and prop_name.lower().strip() not in ("geral", ""):
                if prop_name not in stats["in_not_found"]:
                    stats["in_not_found"].append(prop_name)

    # Parse and import OUT CSV
    csv_out_text = ""
    if os.path.exists(csv_out_path):
        with open(csv_out_path, 'r', encoding='utf-8') as f:
            csv_out_text = f.read()
    if csv_out_text:
        reader = csv.DictReader(io.StringIO(csv_out_text))
        for row in reader:
            date_str = row.get('Date', '').strip()
            if not date_str:
                continue
            date_obj = parse_date(date_str)
            if not date_obj:
                stats["out_skipped"] += 1
                continue

            amount = parse_amount(row.get('Total Paid', ''))
            if amount == 0:
                stats["out_skipped"] += 1
                continue

            comp_raw = row.get('Mês Competência', row.get('M\u00eas Compet\u00eancia', '')).strip()
            if comp_raw:
                comp_month, comp_year = parse_competencia(comp_raw)
            else:
                comp_month, comp_year = date_obj.month, 2026

            prop_name = row.get('Propriedade', '').strip()
            prop = _match_property(prop_name, props_by_name)

            tx = TransactionOut(
                date=date_obj,
                description=row.get('Description', '').strip(),
                method=row.get('Method', '').strip() or "Credit",
                total_paid=amount,
                category=row.get('Category', '').strip() or "Others",
                property_id=prop.id if prop else None,
                competencia_month=comp_month,
                competencia_year=comp_year,
            )
            db.add(tx)
            stats["out_created"] += 1
            stats["out_total"] += amount

            if not prop and prop_name and prop_name.lower().strip() not in ("geral", ""):
                if prop_name not in stats["out_not_found"]:
                    stats["out_not_found"].append(prop_name)

    db.commit()
    return {"detail": "Import CSV 2026 concluído", **stats}


@router.post("/reimport-out-2026")
def reimport_out_2026(
    payload: dict,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN))
):
    """Re-import OUT 2026 transactions from CSV text sent in request body.
    Expects: { "csv_data": "base64-encoded CSV text" }
    OR form-encoded: csv_data=base64-encoded-csv
    Deletes existing OUT 2026 and re-imports.
    """
    import csv
    import io
    import base64
    from datetime import date as dt_date

    csv_b64 = payload.get("csv_data", "")
    if not csv_b64:
        return {"error": "csv_data required (base64-encoded CSV)"}

    csv_text = base64.b64decode(csv_b64).decode('utf-8')

    # Delete existing OUT 2026
    cutoff = dt_date(2026, 1, 1)
    del_count = db.query(TransactionOut).filter(TransactionOut.date >= cutoff).count()
    db.query(TransactionOut).filter(TransactionOut.date >= cutoff).delete()
    db.flush()

    all_props = db.query(Property).all()
    props_by_name = {p.name.lower().strip(): p for p in all_props}

    def parse_amount(val):
        if not val or not val.strip():
            return 0.0
        val = val.strip().replace('"', '').replace(',', '')
        try:
            return float(val)
        except:
            return 0.0

    def parse_date(date_str):
        parts = date_str.strip().split('/')
        if len(parts) == 3:
            return dt_date(int(parts[2]), int(parts[1]), int(parts[0]))
        return None

    def parse_competencia(val):
        val = val.strip().lower()
        month_map = {'jan': 1, 'fev': 2, 'mar': 3, 'abr': 4, 'mai': 5, 'jun': 6,
                     'jul': 7, 'ago': 8, 'set': 9, 'out': 10, 'nov': 11, 'dez': 12}
        if '/' in val:
            parts = val.split('/')
            month_str = parts[0]
            year = 2025 if parts[1] in ('25',) else 2026
            return month_map.get(month_str), year
        try:
            return int(val), 2026
        except:
            return None, 2026

    stats = {"deleted": del_count, "created": 0, "total": 0.0, "not_found": [], "skipped": 0}

    reader = csv.DictReader(io.StringIO(csv_text))
    for row in reader:
        date_str = row.get('Date', '').strip()
        if not date_str:
            continue
        date_obj = parse_date(date_str)
        if not date_obj:
            stats["skipped"] += 1
            continue

        amount = parse_amount(row.get('Total Paid', ''))
        if amount == 0:
            stats["skipped"] += 1
            continue

        comp_raw = row.get('Mês Competência', row.get('M\u00eas Compet\u00eancia', '')).strip()
        if comp_raw:
            comp_month, comp_year = parse_competencia(comp_raw)
        else:
            comp_month, comp_year = date_obj.month, 2026

        prop_name = row.get('Propriedade', '').strip()
        prop = _match_property(prop_name, props_by_name)

        tx = TransactionOut(
            date=date_obj,
            description=row.get('Description', '').strip(),
            method=row.get('Method', '').strip() or "Credit",
            total_paid=amount,
            category=row.get('Category', '').strip() or "Others",
            property_id=prop.id if prop else None,
            competencia_month=comp_month,
            competencia_year=comp_year,
        )
        db.add(tx)
        stats["created"] += 1
        stats["total"] += amount

        if not prop and prop_name and prop_name.lower().strip() not in ("geral", ""):
            if prop_name not in stats["not_found"]:
                stats["not_found"].append(prop_name)

    db.commit()
    return {"detail": "Re-import OUT 2026 concluído", **stats}


@router.post("/reimport-in-2026")
def reimport_in_2026(
    payload: dict,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN))
):
    """Re-import IN 2026 transactions from CSV text sent in request body.
    Expects: { "csv_data": "base64-encoded CSV text" }
    Deletes existing IN 2026 and re-imports from current spreadsheet data.
    """
    import csv
    import io
    import base64
    from datetime import date as dt_date

    csv_b64 = payload.get("csv_data", "")
    if not csv_b64:
        return {"error": "csv_data required (base64-encoded CSV)"}

    csv_text = base64.b64decode(csv_b64).decode('utf-8')

    # Delete existing IN 2026
    cutoff = dt_date(2026, 1, 1)
    del_count = db.query(TransactionIn).filter(TransactionIn.date >= cutoff).count()
    db.query(TransactionIn).filter(TransactionIn.date >= cutoff).delete()
    db.flush()

    all_props = db.query(Property).all()
    props_by_name = {p.name.lower().strip(): p for p in all_props}

    def parse_amount(val):
        if not val or not val.strip():
            return 0.0
        val = val.strip().replace('"', '').replace(',', '')
        try:
            return float(val)
        except:
            return 0.0

    def parse_date(date_str):
        parts = date_str.strip().split('/')
        if len(parts) == 3:
            return dt_date(int(parts[2]), int(parts[1]), int(parts[0]))
        return None

    def parse_competencia(val):
        val = val.strip().lower()
        month_map = {'jan': 1, 'fev': 2, 'mar': 3, 'abr': 4, 'mai': 5, 'jun': 6,
                     'jul': 7, 'ago': 8, 'set': 9, 'out': 10, 'nov': 11, 'dez': 12}
        if '/' in val:
            parts = val.split('/')
            month_str = parts[0]
            year = 2025 if parts[1] in ('25',) else 2026
            return month_map.get(month_str), year
        try:
            return int(val), 2026
        except:
            return None, 2026

    stats = {"deleted": del_count, "created": 0, "total": 0.0, "not_found": [], "skipped": 0}

    reader = csv.DictReader(io.StringIO(csv_text))
    for row in reader:
        date_str = row.get('Date', '').strip()
        if not date_str:
            continue
        date_obj = parse_date(date_str)
        if not date_obj:
            stats["skipped"] += 1
            continue

        amount = parse_amount(row.get('Amount Bank', ''))
        if amount == 0:
            stats["skipped"] += 1
            continue

        comp_raw = row.get('Mês Competência', row.get('M\u00eas Compet\u00eancia', '')).strip()
        if comp_raw:
            comp_month, comp_year = parse_competencia(comp_raw)
        else:
            comp_month, comp_year = date_obj.month, 2026

        prop_name = row.get('Propriedade', '').strip()
        prop = _match_property(prop_name, props_by_name)

        tx = TransactionIn(
            date=date_obj,
            description=row.get('Description', '').strip(),
            method=row.get('Method', '').strip() or "Credit",
            amount=amount,
            category=row.get('Category', '').strip() or "Rent",
            property_id=prop.id if prop else None,
            competencia_month=comp_month,
            competencia_year=comp_year,
            invoice=row.get('Invoice', '').strip(),
            lodgement=row.get('Lodgement', '').strip(),
        )
        db.add(tx)
        stats["created"] += 1
        stats["total"] += amount

        if not prop and prop_name and prop_name.lower().strip() not in ("geral", ""):
            if prop_name not in stats["not_found"]:
                stats["not_found"].append(prop_name)

    db.commit()
    return {"detail": "Re-import IN 2026 concluído", **stats}
