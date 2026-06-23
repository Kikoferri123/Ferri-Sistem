from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import engine, Base, SessionLocal
from models import User, Setting, UserRole, Property, PropertyType, PropertyStatus, Client, Landlord, Employee, Message, News, RewardPoints, RewardTransaction, CheckInOut, Review, FAQ, Referral
from auth import get_password_hash
from sqlalchemy import inspect, text
import os

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Ferri Sistem API", version="2.0.0")

# CORS: restrict to known frontends (auth via JWT Bearer token, not cookies)
_allowed_origins = os.getenv("ALLOWED_ORIGINS", "https://ferri-sistem.vercel.app,http://localhost:5173,http://localhost:5174").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# Security headers middleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request as StarletteRequest

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: StarletteRequest, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

app.add_middleware(SecurityHeadersMiddleware)

from routers.auth_router import router as auth_router
from routers.properties import router as properties_router
from routers.clients import router as clients_router
from routers.transactions import router as transactions_router
from routers.contracts import router as contracts_router
from routers.dashboard import router as dashboard_router
from routers.alerts import router as alerts_router
from routers.settings_router import router as settings_router
from routers.rooms import router as rooms_router
from routers.documents import router as documents_router
from routers.payments import router as payments_router
from routers.contract_pdf import router as contract_pdf_router, public_router as public_contract_router
from routers.client_history import router as client_history_router
from routers.maintenance import router as maintenance_router
from routers.reports import router as reports_router
from routers.notifications import router as notifications_router
from routers.landlords import router as landlords_router
from routers.hr import router as hr_router
from routers.audit import router as audit_router, audit_middleware
from routers.import_data import router as import_router
from routers.mobile import router as mobile_router
from routers.admin_features_router import router as admin_features_router
from routers.branding_router import router as branding_router

app.include_router(auth_router)
app.include_router(properties_router)
app.include_router(clients_router)
app.include_router(transactions_router)
app.include_router(contracts_router)
app.include_router(dashboard_router)
app.include_router(alerts_router)
app.include_router(settings_router)
app.include_router(rooms_router)
app.include_router(documents_router)
app.include_router(payments_router)
app.include_router(contract_pdf_router)
app.include_router(public_contract_router)
app.include_router(client_history_router)
app.include_router(maintenance_router)
app.include_router(reports_router)
app.include_router(notifications_router)
app.include_router(landlords_router)
app.include_router(hr_router)
app.include_router(audit_router)
app.include_router(import_router)
app.include_router(mobile_router)
app.include_router(admin_features_router)
app.include_router(branding_router)

# Audit middleware - logs all POST/PUT/DELETE operations automatically
app.middleware("http")(audit_middleware)

_uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(_uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=_uploads_dir), name="uploads")


def _generate_property_code(db) -> str:
    """Generate next PROP-XXX code."""
    last = db.query(Property).filter(Property.code != None).order_by(Property.code.desc()).first()
    if last and last.code and last.code.startswith("PROP-"):
        try:
            num = int(last.code.split("-")[1]) + 1
        except (ValueError, IndexError):
            num = 1
    else:
        num = 1
    return f"PROP-{str(num).zfill(3)}"


def _generate_client_code(db) -> str:
    """Generate next CLI-XXX code."""
    last = db.query(Client).filter(Client.code != None).order_by(Client.code.desc()).first()
    if last and last.code and last.code.startswith("CLI-"):
        try:
            num = int(last.code.split("-")[1]) + 1
        except (ValueError, IndexError):
            num = 1
    else:
        num = 1
    return f"CLI-{str(num).zfill(3)}"


def _generate_landlord_code(db) -> str:
    """Generate next LL-XXX code."""
    last = db.query(Landlord).filter(Landlord.code != None).order_by(Landlord.code.desc()).first()
    if last and last.code and last.code.startswith("LL-"):
        try:
            num = int(last.code.split("-")[1]) + 1
        except (ValueError, IndexError):
            num = 1
    else:
        num = 1
    return f"LL-{str(num).zfill(3)}"


def _generate_employee_code(db) -> str:
    """Generate next EMP-XXX code."""
    last = db.query(Employee).filter(Employee.code != None).order_by(Employee.code.desc()).first()
    if last and last.code and last.code.startswith("EMP-"):
        try:
            num = int(last.code.split("-")[1]) + 1
        except (ValueError, IndexError):
            num = 1
    else:
        num = 1
    return f"EMP-{str(num).zfill(3)}"


def _safe_add_column(db, table, column_def):
    """Safely add a column to a table, ignoring if it already exists."""
    try:
        db.execute(text(f"ALTER TABLE {table} ADD COLUMN {column_def}"))
        db.commit()
    except Exception:
        db.rollback()


def _migrate_add_codes(db):
    """Add code column if missing and populate existing records."""
    # Add code columns if missing
    _safe_add_column(db, "properties", "code VARCHAR(20) UNIQUE")
    _safe_add_column(db, "clients", "code VARCHAR(20) UNIQUE")
    _safe_add_column(db, "properties", "landlord_id INTEGER REFERENCES landlords(id)")
    _safe_add_column(db, "employees", "vacation_days_year INTEGER DEFAULT 22")
    _safe_add_column(db, "clients", "referencia VARCHAR(200)")

    # Contract signature fields
    _safe_add_column(db, "contracts", "sign_token VARCHAR(64)")
    _safe_add_column(db, "contracts", "signature_licensee TEXT")
    _safe_add_column(db, "contracts", "signature_licensor TEXT")

    # Add CLIENTE value to userrole enum (PostgreSQL requires ALTER TYPE)
    try:
        db.execute(text("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'CLIENTE'"))
        db.commit()
    except Exception:
        db.rollback()

    # Social login fields for User model
    _safe_add_column(db, "users", "social_provider VARCHAR(50)")
    _safe_add_column(db, "users", "social_id VARCHAR(255)")

    # Make password_hash nullable (already done in model, but DB might need update)
    # Note: This is database-specific and may require ALTER TABLE
    try:
        db.execute(text("ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) NULL"))
    except Exception:
        pass  # Ignore if already nullable or not supported

    # Populate any properties without codes
    try:
        props_no_code = db.query(Property).filter(
            (Property.code == None) | (Property.code == "")
        ).order_by(Property.id).all()
        for p in props_no_code:
            p.code = _generate_property_code(db)
            db.flush()
        if props_no_code:
            db.commit()
    except Exception:
        db.rollback()

    # Populate any clients without codes
    try:
        clients_no_code = db.query(Client).filter(
            (Client.code == None) | (Client.code == "")
        ).order_by(Client.id).all()
        for c in clients_no_code:
            c.code = _generate_client_code(db)
            db.flush()
        if clients_no_code:
            db.commit()
    except Exception:
        db.rollback()

    # Populate landlords without codes
    try:
        lls_no_code = db.query(Landlord).filter(
            (Landlord.code == None) | (Landlord.code == "")
        ).order_by(Landlord.id).all()
        for ll in lls_no_code:
            ll.code = _generate_landlord_code(db)
            db.flush()
        if lls_no_code:
            db.commit()
    except Exception:
        db.rollback()


@app.on_event("startup")
def startup():
    db = SessionLocal()
    try:
        # Migrations FIRST (before any ORM queries that reference new columns)
        try:
            _migrate_add_codes(db)
        except Exception as e:
            print(f"Migration warning: {e}")
            db.rollback()

        try:
            _migrate_create_indexes(db)
        except Exception as e:
            print(f"Index migration warning: {e}")
            db.rollback()

        # Now safe to query User (which includes social_provider, social_id)
        admin = db.query(User).filter(User.email == "admin@ferrisystem.com").first()
        if not admin:
            admin = User(
                name="Admin",
                email="admin@ferrisystem.com",
                password_hash=get_password_hash("admin123"),
                role=UserRole.ADMIN,
                active=True
            )
            db.add(admin)
            _seed_settings(db)
            db.commit()

        # Seed client users for the client portal
        _seed_client_users(db)

        # Seed properties and landlords (one-time)
        _seed_properties(db)
    finally:
        db.close()


def _seed_client_users(db):
    """Create demo CLIENTE users for the client portal."""
    client_users = [
        ("Lucas Silva", "lucas@email.com", "lucas123"),
        ("Ana Costa", "ana.costa@email.com", "ana123"),
        ("Pedro Martins", "pedro@email.com", "pedro123"),
    ]
    for name, email, pwd in client_users:
        existing = db.query(User).filter(User.email == email).first()
        if not existing:
            u = User(
                name=name,
                email=email,
                password_hash=get_password_hash(pwd),
                role=UserRole.CLIENTE,
                active=True
            )
            db.add(u)
    db.commit()


def _migrate_create_indexes(db):
    """Create indexes on frequently queried columns for performance."""
    indexes = [
        ("idx_ti_date", "transactions_in", "date"),
        ("idx_ti_category", "transactions_in", "category"),
        ("idx_ti_property_id", "transactions_in", "property_id"),
        ("idx_ti_client_id", "transactions_in", "client_id"),
        ("idx_ti_comp_year", "transactions_in", "competencia_year"),
        ("idx_ti_comp_month", "transactions_in", "competencia_month"),
        ("idx_to_date", "transactions_out", "date"),
        ("idx_to_category", "transactions_out", "category"),
        ("idx_to_property_id", "transactions_out", "property_id"),
        ("idx_to_comp_year", "transactions_out", "competencia_year"),
        ("idx_to_comp_month", "transactions_out", "competencia_month"),
        ("idx_clients_status", "clients", "status"),
        ("idx_clients_property_id", "clients", "property_id"),
        ("idx_clients_room_id", "clients", "room_id"),
        ("idx_clients_bed_id", "clients", "bed_id"),
        ("idx_contracts_client_id", "contracts", "client_id"),
        ("idx_contracts_property_id", "contracts", "property_id"),
        ("idx_contracts_status", "contracts", "status"),
        ("idx_properties_status", "properties", "status"),
        ("idx_rooms_property_id", "rooms", "property_id"),
        ("idx_beds_room_id", "beds", "room_id"),
        ("idx_docs_property_id", "documents", "property_id"),
        ("idx_docs_client_id", "documents", "client_id"),
        ("idx_client_remarks_client_id", "client_remarks", "client_id"),
        ("idx_property_remarks_property_id", "property_remarks", "property_id"),
        ("idx_maintenance_property_id", "maintenance_requests", "property_id"),
        ("idx_messages_client_id", "messages", "client_id"),
        ("idx_messages_created_at", "messages", "created_at"),
        ("idx_news_published", "news", "published"),
        ("idx_news_created_at", "news", "created_at"),
        ("idx_reward_points_client_id", "reward_points", "client_id"),
        ("idx_reward_txns_client_id", "reward_transactions", "client_id"),
        ("idx_checkinouts_client_id", "checkinouts", "client_id"),
        ("idx_reviews_client_id", "reviews", "client_id"),
        ("idx_reviews_property_id", "reviews", "property_id"),
        ("idx_referrals_referrer_id", "referrals", "referrer_client_id"),
    ]
    for idx_name, table, column in indexes:
        try:
            db.execute(text(f"CREATE INDEX IF NOT EXISTS {idx_name} ON {table} ({column})"))
        except Exception:
            pass
    db.commit()


def _seed_settings(db):
    categories_in = ["Revenue", "Rent", "Deposit", "Investment", "Reimbursement", "Other Income"]
    categories_out = [
        "Bills", "Electricity", "Gas", "Water", "Internet", "Council Tax",
        "House Rent", "Marketing", "Repairs", "Maintenance", "Cleaning",
        "Insurance", "Furniture", "Supplies", "License", "Accounting",
        "Legal", "Transport", "Commission", "Pro-Labore", "CAPEX",
        "Tax", "Bank Fees", "Software", "Other Expense", "Deposit Return"
    ]
    payment_methods = ["Credit Card", "Debit Card", "Bank Transfer", "Cash", "Deposit", "PIX", "Revolut"]
    for cat in categories_in:
        db.add(Setting(key=f"cat_in_{cat.lower().replace(' ', '_')}", value=cat, category="categories_in"))
    for cat in categories_out:
        db.add(Setting(key=f"cat_out_{cat.lower().replace(' ', '_')}", value=cat, category="categories_out"))
    for pm in payment_methods:
        db.add(Setting(key=f"pm_{pm.lower().replace(' ', '_')}", value=pm, category="payment_methods"))


@app.get("/")
def root():
    return {"message": "Ferri Sistem API v2.0", "docs": "/docs"}

def _seed_properties(db):
    """Seed Francisco's properties and landlords (one-time)."""
    # Check if already seeded
    if db.query(Property).count() > 0:
        return

    print("[SEED] Seeding properties and landlords...")

    # Create landlords (companies)
    landlords_data = {
        "FFP": Landlord(code="LD001", name="FFP", notes="Francisco's company"),
        "VFFP": Landlord(code="LD002", name="VFFP", notes="Francisco's company"),
        "Fenota": Landlord(code="LD003", name="Fenota", notes="Francisco's company"),
        "Dream": Landlord(code="LD004", name="Dream", notes="Francisco's company"),
        "Yendrys": Landlord(code="LD005", name="Yendrys", notes="Francisco's company"),
        "College Green": Landlord(code="LD006", name="College Green", notes="Francisco's company"),
    }
    for ll in landlords_data.values():
        db.add(ll)
    db.flush()

    # Status mapping
    status_map = {
        "Purchased": PropertyStatus.ATIVO,
        "Sale agreed": PropertyStatus.EM_NEGOCIACAO,
        "Sale agreed / cancelled": PropertyStatus.INATIVO,
        "Bidding": PropertyStatus.EM_NEGOCIACAO,
        "Lost": PropertyStatus.INATIVO,
    }

    properties = [
        {"code": "PR001", "name": "11 Cruise Park Avenue", "address": "11 Cruise Park Avenue", "monthly_rent": 3100, "type": PropertyType.CASA, "status": "Purchased", "company": "FFP",
         "notes": "Price: €550,000 | Deposit: €165,000 | Mortgage: €385,000 | APRC: 5.45 | Term: 35y | Mortgage/mo: €2,054.92 | ROI/mo: €1,045.08 (7.60%)"},
        {"code": "PR002", "name": "608 Collins Av", "address": "608 Collins Avenue", "monthly_rent": 6000, "type": PropertyType.CASA, "status": "Sale agreed", "company": "VFFP",
         "notes": "Price: €560,000 | Deposit: €168,000 | Mortgage: €392,000 | APRC: 5.45 | Term: 35y | Mortgage/mo: €2,092.28 | ROI/mo: €3,907.72 (27.91%)"},
        {"code": "PR003", "name": "62 College View", "address": "62 College View", "monthly_rent": 2450, "type": PropertyType.APARTAMENTO, "status": "Sale agreed / cancelled", "company": "VFFP",
         "notes": "Price: €255,000 | Service Charge: €1,700 | Deposit: €80,000 | Mortgage: €175,000 | APRC: 5.45 | Term: 35y | Mortgage/mo: €934.05 | ROI/mo: €1,515.95 (20.61%)"},
        {"code": "PR004", "name": "1 Singland - Limerick", "address": "1 Singland, Limerick", "monthly_rent": 4100, "type": PropertyType.CASA, "status": "Sale agreed", "company": "VFFP",
         "notes": "Price: €290,000 | Deposit: €87,000 | Mortgage: €203,000 | APRC: 5.45 | Term: 35y | Mortgage/mo: €1,083.50 | ROI/mo: €3,016.50 (41.61%)"},
        {"code": "PR005", "name": "25 Turnpike", "address": "25 Turnpike", "monthly_rent": 3500, "type": PropertyType.CASA, "status": "Bidding", "company": "VFFP",
         "notes": "Price: €257,500 | Service Charge: €3,400 | Deposit: €257,500 | Mortgage: €0 | APRC: 5.45 | Term: 35y | Mortgage/mo: €0 | ROI/mo: €3,500.00 (14.99%)"},
        {"code": "PR006", "name": "28 Linnbhla", "address": "28 Linnbhla", "monthly_rent": 3200, "type": PropertyType.CASA, "status": "Lost", "company": "FFP",
         "notes": "Price: €255,000 | Deposit: €255,000 | Mortgage: €0 | APRC: 5.45 | Term: 35y | Mortgage/mo: €0 | ROI/mo: €3,200.00 (15.06%)"},
        {"code": "PR007", "name": "6 O'Donoghue Av - Limerick", "address": "6 O'Donoghue Avenue, Limerick", "monthly_rent": 4400, "type": PropertyType.CASA, "status": "Sale agreed", "company": "Fenota",
         "notes": "Price: €275,000 | Deposit: €82,500 | Mortgage: €192,500 | APRC: 5.45 | Term: 35y | Mortgage/mo: €1,027.46 | ROI/mo: €3,372.54 (49.06%)"},
        {"code": "PR008", "name": "6 Crosses Court - Cork", "address": "6 Crosses Court, Cork", "monthly_rent": 5200, "type": PropertyType.CASA, "status": "Sale agreed", "company": "Dream",
         "notes": "Price: €370,000 | Deposit: €111,000 | Mortgage: €259,000 | APRC: 5.45 | Term: 35y | Mortgage/mo: €1,382.40 | ROI/mo: €3,817.60 (41.27%)"},
        {"code": "PR009", "name": "113 Saint Michaels Road - Cork", "address": "113 Saint Michaels Road, Cork", "monthly_rent": 3450, "type": PropertyType.CASA, "status": "Sale agreed", "company": "Yendrys",
         "notes": "Price: €285,000 | Deposit: €85,500 | Mortgage: €199,500 | APRC: 5.45 | Term: 35y | Mortgage/mo: €1,064.82 | ROI/mo: €2,385.18 (33.48%)"},
        {"code": "PR010", "name": "32 - Linda", "address": "32 Linda", "monthly_rent": 4600, "type": PropertyType.CASA, "status": "Sale agreed", "company": "College Green",
         "notes": "Price: €440,000 | Deposit: €132,000 | Mortgage: €308,000 | APRC: 4.75 | Term: 30y | Mortgage/mo: €1,606.67 | ROI/mo: €2,993.33 (27.21%)"},
        {"code": "PR011", "name": "10 Angleasea - Cork", "address": "10 Angleasea, Cork", "monthly_rent": 5300, "type": PropertyType.CASA, "status": "Sale agreed", "company": "College Green",
         "notes": "Price: €415,000 | Deposit: €124,500 | Mortgage: €290,500 | APRC: 4.75 | Term: 30y | Mortgage/mo: €1,515.39 | ROI/mo: €3,784.61 (36.48%)"},
        {"code": "PR012", "name": "52-52 Carrer Querol - Mas del Plata", "address": "52-52 Carrer Querol, Mas del Plata", "monthly_rent": 0, "type": PropertyType.CASA, "status": "Purchased", "company": "FFP",
         "notes": "Price: €1,100,000"},
        {"code": "PR013", "name": "Salão Americana - Av Doosan 265", "address": "Av Doosan 265, Americana", "monthly_rent": 4200, "type": PropertyType.OUTRO, "status": "Purchased", "company": "VFFP",
         "notes": "Price: R$1,500,000"},
        {"code": "PR014", "name": "Rua Anair Aparecida Viel 189", "address": "Rua Anair Aparecida Viel 189", "monthly_rent": 0, "type": PropertyType.CASA, "status": "Purchased", "company": "FFP",
         "notes": "Price: R$460,000"},
        {"code": "PR015", "name": "Casa Tatui Pai", "address": "Tatuí", "monthly_rent": 0, "type": PropertyType.CASA, "status": "Purchased", "company": "FFP",
         "notes": "Price: R$1,500,000"},
        {"code": "PR016", "name": "Casa Portugal Mãe", "address": "Portugal", "monthly_rent": 0, "type": PropertyType.CASA, "status": "Purchased", "company": "FFP",
         "notes": "Price: €380,000"},
        {"code": "PR017", "name": "Terreno Shangrylla 2 - 50% (Marcio)", "address": "Quadra 60 Lote 33, Shangrylla 2", "monthly_rent": 0, "type": PropertyType.OUTRO, "status": "Purchased", "company": "FFP",
         "notes": "Price: R$5,500 | 50% ownership with Marcio"},
        {"code": "PR018", "name": "Terreno Fazenda Medeiros - 50% (Plinio)", "address": "Fazenda Medeiros", "monthly_rent": 0, "type": PropertyType.OUTRO, "status": "Purchased", "company": "FFP",
         "notes": "Price: R$1,000,000 | 50% ownership with Plinio"},
        {"code": "PR019", "name": "Terreno Jalapão - 33%", "address": "Jalapão", "monthly_rent": 0, "type": PropertyType.OUTRO, "status": "Purchased", "company": "FFP",
         "notes": "Price: R$20,000 | 33% ownership | Nome da mãe"},
        {"code": "PR020", "name": "Fazenda Cerro do Bau - Herval", "address": "Cerro do Bau, Herval, Mat 5465", "monthly_rent": 0, "type": PropertyType.OUTRO, "status": "Purchased", "company": "FFP",
         "notes": "Price: R$50,000 | Nome da mãe"},
    ]

    for p in properties:
        ll = landlords_data.get(p["company"])
        prop = Property(
            code=p["code"],
            name=p["name"],
            address=p.get("address", ""),
            monthly_rent=p.get("monthly_rent", 0),
            type=p.get("type", PropertyType.CASA),
            status=status_map.get(p.get("status", ""), PropertyStatus.ATIVO),
            owner_name=p["company"],
            landlord_id=ll.id if ll else None,
            notes=p.get("notes", ""),
        )
        db.add(prop)

    db.commit()
    print(f"[SEED] Created {len(landlords_data)} landlords and {len(properties)} properties.")


@app.get("/health")
def health():
    return {"status": "ok"}

frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/app", StaticFiles(directory=frontend_dist, html=True), name="frontend")
