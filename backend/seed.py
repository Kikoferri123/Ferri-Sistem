"""Seed script to populate database with mock data for Ferri Sistem."""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from database import engine, Base, SessionLocal
from models import *
from auth import get_password_hash
from datetime import date, timedelta
import random

Base.metadata.create_all(bind=engine)
db = SessionLocal()

print("Seeding Ferri Sistem database...")

# ── Users ──────────────────────────────────────────────
users_data = [
    ("Admin Ferri Sistem", "admin@ferrisystem.com", "admin123", UserRole.ADMIN),
    ("Maria Financeiro", "maria@ferrisystem.com", "maria123", UserRole.FINANCEIRO),
    ("Joao Operacional", "joao@ferrisystem.com", "joao123", UserRole.OPERACIONAL),
    ("Ana Viewer", "ana@ferrisystem.com", "ana123", UserRole.VISUALIZADOR),
]
users = []
for name, email, pwd, role in users_data:
    u = db.query(User).filter(User.email == email).first()
    if not u:
        u = User(name=name, email=email, password_hash=get_password_hash(pwd), role=role)
        db.add(u)
        db.flush()
    users.append(u)

# ── Properties ─────────────────────────────────────────
props_data = [
    ("14 Dyke Parade", "14 Dyke Parade, Cork", 1200, PropertyType.CASA, "John Murphy", "+353 86 123 4567"),
    ("21 Anglesea St", "21 Anglesea Street, Cork", 1500, PropertyType.APARTAMENTO, "Sarah O'Brien", "+353 87 234 5678"),
    ("5 Washington St", "5 Washington Street, Cork", 900, PropertyType.QUARTO, "Mike Collins", "+353 85 345 6789"),
    ("8 Patrick St", "8 Patrick Street, Cork", 1800, PropertyType.APARTAMENTO, "Emma Walsh", "+353 86 456 7890"),
    ("32 Grand Parade", "32 Grand Parade, Cork", 1100, PropertyType.ESTUDIO, "Tom Ryan", "+353 87 567 8901"),
    ("15 Oliver Plunkett St", "15 Oliver Plunkett Street, Cork", 2000, PropertyType.CASA, "Lisa Kelly", "+353 85 678 9012"),
    ("9 MacCurtain St", "9 MacCurtain Street, Cork", 750, PropertyType.QUARTO, "David Byrne", "+353 86 789 0123"),
    ("44 South Mall", "44 South Mall, Cork", 1600, PropertyType.APARTAMENTO, "Claire Doyle", "+353 87 890 1234"),
]
properties = []
for name, addr, rent, ptype, owner, contact in props_data:
    p = db.query(Property).filter(Property.name == name).first()
    if not p:
        p = Property(
            name=name, address=addr, monthly_rent=rent, type=ptype,
            owner_name=owner, owner_contact=contact, status=PropertyStatus.ATIVO,
            contract_start=date(2025, 1, 1), contract_end=date(2026, 12, 31)
        )
        db.add(p)
        db.flush()
    properties.append(p)

# ── Clients ────────────────────────────────────────────
clients_data = [
    ("Lucas Silva", "lucas@email.com", "+55 11 9999-1111", "Brasileiro", date(1995, 3, 15), ClientStatus.ATIVO, 0, date(2025, 9, 1), date(2026, 6, 30), 800),
    ("Ana Costa", "ana.costa@email.com", "+55 21 9999-2222", "Brasileiro", date(1998, 7, 22), ClientStatus.ATIVO, 1, date(2025, 10, 1), date(2026, 5, 31), 950),
    ("Pedro Martins", "pedro@email.com", "+351 91 123 4567", "Portugues", date(1993, 11, 5), ClientStatus.ATIVO, 2, date(2026, 1, 15), date(2026, 7, 15), 600),
    ("Maria Oliveira", "maria.o@email.com", "+55 31 9999-3333", "Brasileiro", date(2000, 1, 10), ClientStatus.ATIVO, 3, date(2025, 8, 1), date(2026, 4, 30), 1200),
    ("Carlos Ferreira", "carlos@email.com", "+55 41 9999-4444", "Brasileiro", date(1997, 5, 28), ClientStatus.ATIVO, 4, date(2026, 2, 1), date(2026, 8, 31), 700),
    ("Julia Santos", "julia@email.com", "+55 51 9999-5555", "Brasileiro", date(1996, 9, 18), ClientStatus.ATIVO, 5, date(2025, 11, 1), date(2026, 10, 31), 1300),
    ("Thiago Almeida", "thiago@email.com", "+55 61 9999-6666", "Brasileiro", date(1994, 12, 3), ClientStatus.INATIVO, 6, date(2025, 3, 1), date(2025, 12, 31), 500),
    ("Camila Rocha", "camila@email.com", "+55 71 9999-7777", "Brasileiro", date(1999, 4, 25), ClientStatus.PROSPECTO, None, None, None, 0),
    ("Rafael Lima", "rafael@email.com", "+34 612 345 678", "Espanhol", date(1992, 8, 14), ClientStatus.ATIVO, 7, date(2026, 1, 1), date(2026, 12, 31), 1000),
    ("Isabella Nunes", "isabella@email.com", "+55 81 9999-8888", "Brasileiro", date(2001, 2, 7), ClientStatus.ATIVO, 0, date(2026, 1, 1), date(2026, 6, 30), 800),
]
clients = []
for name, email, phone, nat, bdate, status, prop_idx, ci, co, val in clients_data:
    c = db.query(Client).filter(Client.email == email).first()
    if not c:
        c = Client(
            name=name, email=email, phone=phone, nationality=nat,
            birth_date=bdate, status=status,
            property_id=properties[prop_idx].id if prop_idx is not None else None,
            check_in=ci, check_out=co, monthly_value=val,
            payment_method=random.choice(["Bank Transfer", "Cash", "Revolut"])
        )
        db.add(c)
        db.flush()
    clients.append(c)

# ── Transactions In (Receitas) ─────────────────────────
in_categories = ["Revenue", "Rent", "Deposit"]
months_2025 = list(range(1, 13))
months_2026 = list(range(1, 4))  # Jan-Mar 2026

for prop in properties:
    # 2025 data
    for m in months_2025:
        rent_val = prop.monthly_rent * random.uniform(0.8, 1.2)
        bank_val = rent_val * random.uniform(0.9, 1.0)
        db.add(TransactionIn(
            date=date(2025, m, random.randint(1, 28)),
            description=f"Rent {prop.name} - {m}/2025",
            method="Bank Transfer", amount_bank=round(bank_val, 2),
            amount_rent=round(rent_val, 2), amount_deposit=0,
            category="Rent", property_id=prop.id,
            competencia_month=m, competencia_year=2025
        ))
        # Random deposits
        if random.random() > 0.7:
            dep = random.uniform(300, 800)
            db.add(TransactionIn(
                date=date(2025, m, random.randint(1, 28)),
                description=f"Deposit - {prop.name}",
                method="Bank Transfer", amount_bank=0,
                amount_rent=0, amount_deposit=round(dep, 2),
                category="Deposit", property_id=prop.id,
                competencia_month=m, competencia_year=2025
            ))

    # 2026 data
    for m in months_2026:
        rent_val = prop.monthly_rent * random.uniform(0.85, 1.15)
        bank_val = rent_val * random.uniform(0.9, 1.0)
        db.add(TransactionIn(
            date=date(2026, m, random.randint(1, 28)),
            description=f"Rent {prop.name} - {m}/2026",
            method="Bank Transfer", amount_bank=round(bank_val, 2),
            amount_rent=round(rent_val, 2), amount_deposit=0,
            category="Rent", property_id=prop.id,
            competencia_month=m, competencia_year=2026
        ))

# ── Transactions Out (Despesas) ────────────────────────
out_categories = [
    ("Bills", 50, 200), ("Electricity", 80, 250), ("Gas", 30, 100),
    ("Water", 20, 60), ("Internet", 40, 60), ("House Rent", 500, 1200),
    ("Cleaning", 50, 150), ("Repairs", 100, 500), ("Insurance", 50, 200),
    ("Marketing", 100, 400), ("Maintenance", 50, 300)
]

for prop in properties:
    for m in months_2025:
        # 3-5 random expense categories per month per property
        selected = random.sample(out_categories, random.randint(3, 5))
        for cat, min_val, max_val in selected:
            val = round(random.uniform(min_val, max_val), 2)
            db.add(TransactionOut(
                date=date(2025, m, random.randint(1, 28)),
                description=f"{cat} - {prop.name} - {m}/2025",
                method=random.choice(["Credit Card", "Bank Transfer", "Debit Card"]),
                total_paid=val, category=cat, property_id=prop.id,
                competencia_month=m, competencia_year=2025
            ))

    for m in months_2026:
        selected = random.sample(out_categories, random.randint(3, 5))
        for cat, min_val, max_val in selected:
            val = round(random.uniform(min_val, max_val), 2)
            db.add(TransactionOut(
                date=date(2026, m, random.randint(1, 28)),
                description=f"{cat} - {prop.name} - {m}/2026",
                method=random.choice(["Credit Card", "Bank Transfer", "Debit Card"]),
                total_paid=val, category=cat, property_id=prop.id,
                competencia_month=m, competencia_year=2026
            ))

# Pro-Labore (monthly)
for m in months_2025:
    db.add(TransactionOut(
        date=date(2025, m, 28), description=f"Pro-Labore {m}/2025",
        method="Bank Transfer", total_paid=3000, category="Pro-Labore",
        competencia_month=m, competencia_year=2025
    ))
for m in months_2026:
    db.add(TransactionOut(
        date=date(2026, m, 28), description=f"Pro-Labore {m}/2026",
        method="Bank Transfer", total_paid=3000, category="Pro-Labore",
        competencia_month=m, competencia_year=2026
    ))

# ── Contracts ──────────────────────────────────────────
for i, cl in enumerate(clients[:7]):
    prop = properties[i] if i < len(properties) else properties[0]
    db.add(Contract(
        type=ContractType.HOSPEDAGEM,
        client_id=cl.id, property_id=prop.id,
        start_date=cl.check_in or date(2025, 6, 1),
        end_date=cl.check_out or date(2026, 6, 1),
        value=cl.monthly_value,
        status=ContractStatus.VIGENTE if cl.status == ClientStatus.ATIVO else ContractStatus.EXPIRADO,
        signed=True
    ))

# Owner contracts
for prop in properties:
    db.add(Contract(
        type=ContractType.ALUGUEL,
        property_id=prop.id,
        start_date=prop.contract_start, end_date=prop.contract_end,
        value=prop.monthly_rent,
        status=ContractStatus.VIGENTE, signed=True,
        notes=f"Contrato de aluguel com {prop.owner_name}"
    ))

# ── Settings ───────────────────────────────────────────
existing = db.query(Setting).count()
if existing == 0:
    for cat in ["Revenue", "Rent", "Deposit", "Investment", "Reimbursement", "Other Income"]:
        db.add(Setting(key=f"cat_in_{cat.lower().replace(' ', '_')}", value=cat, category="categories_in"))
    for cat in ["Bills", "Electricity", "Gas", "Water", "Internet", "Council Tax",
                 "House Rent", "Marketing", "Repairs", "Maintenance", "Cleaning",
                 "Insurance", "Furniture", "Supplies", "License", "Accounting",
                 "Legal", "Transport", "Commission", "Pro-Labore", "CAPEX",
                 "Tax", "Bank Fees", "Software", "Other Expense"]:
        db.add(Setting(key=f"cat_out_{cat.lower().replace(' ', '_')}", value=cat, category="categories_out"))
    for pm in ["Credit Card", "Debit Card", "Bank Transfer", "Cash", "Deposit", "PIX", "Revolut"]:
        db.add(Setting(key=f"pm_{pm.lower().replace(' ', '_')}", value=pm, category="payment_methods"))

db.commit()
db.close()
print("Database seeded successfully!")
print("\nLogin credentials:")
print("  Admin: admin@ferrisystem.com / admin123")
print("  Financeiro: maria@ferrisystem.com / maria123")
print("  Operacional: joao@ferrisystem.com / joao123")
print("  Visualizador: ana@ferrisystem.com / ana123")
