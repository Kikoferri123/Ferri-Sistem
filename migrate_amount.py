#!/usr/bin/env python3
"""
Migra TransactionIn de 3 campos (amount_bank, amount_rent, amount_deposit) para 1 campo (amount).
Atualiza backend + frontend + banco de dados.
"""
import os, re

ROOT = os.path.dirname(os.path.abspath(__file__))

def replace_in_file(filepath, replacements):
    """Faz múltiplas substituições em um arquivo"""
    with open(filepath, 'r') as f:
        content = f.read()
    original = content
    for old, new in replacements:
        content = content.replace(old, new)
    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"  [OK] {os.path.relpath(filepath, ROOT)}")
    else:
        print(f"  [SKIP] {os.path.relpath(filepath, ROOT)} (sem alterações)")

print("=" * 60)
print("  MIGRAÇÃO: 3 amounts → 1 amount")
print("=" * 60)

# ============================================================
# 1. backend/models.py
# ============================================================
print("\n[1/11] models.py")
replace_in_file(os.path.join(ROOT, "backend", "models.py"), [
    ("    amount_bank = Column(Float, default=0)\n    amount_rent = Column(Float, default=0)\n    amount_deposit = Column(Float, default=0)",
     "    amount = Column(Float, default=0)"),
])

# ============================================================
# 2. backend/schemas.py
# ============================================================
print("\n[2/11] schemas.py")
replace_in_file(os.path.join(ROOT, "backend", "schemas.py"), [
    ("    amount_bank: float = 0\n    amount_rent: float = 0\n    amount_deposit: float = 0",
     "    amount: float = 0"),
    ("    amount_bank: Optional[float] = None\n    amount_rent: Optional[float] = None\n    amount_deposit: Optional[float] = None",
     "    amount: Optional[float] = None"),
    ("    amount_bank: float\n    amount_rent: float\n    amount_deposit: float",
     "    amount: float"),
])

# ============================================================
# 3. backend/routers/dashboard.py
# ============================================================
print("\n[3/11] routers/dashboard.py")
replace_in_file(os.path.join(ROOT, "backend", "routers", "dashboard.py"), [
    ('sum(t.amount_bank + t.amount_rent for t in all_in)', 'sum(t.amount for t in all_in)'),
    ('months_data[key]["receita_bank"] += t.amount_bank', 'months_data[key]["receita"] += t.amount'),
    ('months_data[key]["receita_rent"] += t.amount_rent', ''),
    ('months_data[key]["revenue_deposit"] += t.amount_deposit', ''),
    ('"receita_bank": 0, "receita_rent": 0, "revenue_deposit": 0,', '"receita": 0,'),
])

# ============================================================
# 4. backend/routers/reports.py
# ============================================================
print("\n[4/11] routers/reports.py")
replace_in_file(os.path.join(ROOT, "backend", "routers", "reports.py"), [
    ('receita = sum(t.amount_bank + t.amount_rent for t in all_in)', 'receita = sum(t.amount for t in all_in)'),
    ('deposits = sum(t.amount_deposit for t in all_in)', 'deposits = 0'),
    ('sum(t.amount_bank + t.amount_rent for t in all_in if t.property_id == p.id)', 'sum(t.amount for t in all_in if t.property_id == p.id)'),
    ('t.amount_bank, t.amount_rent, t.amount_deposit, t.category or "",', 't.amount, t.category or "",'),
])

# ============================================================
# 5. backend/routers/notifications.py
# ============================================================
print("\n[5/11] routers/notifications.py")
replace_in_file(os.path.join(ROOT, "backend", "routers", "notifications.py"), [
    ('sum(t.amount_bank + t.amount_rent for t in db.query(TransactionIn).filter(', 'sum(t.amount for t in db.query(TransactionIn).filter('),
])

# ============================================================
# 6. backend/routers/clients.py
# ============================================================
print("\n[6/11] routers/clients.py")
replace_in_file(os.path.join(ROOT, "backend", "routers", "clients.py"), [
    ('rev = (t.amount_bank or 0) + (t.amount_rent or 0) + (t.amount_deposit or 0)', 'rev = t.amount or 0'),
    ('monthly_data[key]["revenue_bank"] += t.amount_bank or 0\n            monthly_data[key]["revenue_rent"] += t.amount_rent or 0\n            monthly_data[key]["revenue_deposit"] += t.amount_deposit or 0',
     'monthly_data[key]["revenue"] += t.amount or 0'),
    ('"amount_bank": t.amount_bank or 0,\n                "amount_rent": t.amount_rent or 0,\n                "amount_deposit": t.amount_deposit or 0,',
     '"amount": t.amount or 0,'),
])

# ============================================================
# 7. backend/routers/client_history.py
# ============================================================
print("\n[7/11] routers/client_history.py")
replace_in_file(os.path.join(ROOT, "backend", "routers", "client_history.py"), [
    ('total = p.amount_bank + p.amount_rent', 'total = p.amount'),
])

# ============================================================
# 8. backend/routers/properties.py
# ============================================================
print("\n[8/11] routers/properties.py")
replace_in_file(os.path.join(ROOT, "backend", "routers", "properties.py"), [
    ('receita_bank = sum(t.amount_bank for t in transactions_in)\n        receita_rent = sum(t.amount_rent for t in transactions_in)',
     'receita_total = sum(t.amount for t in transactions_in)'),
    ('total_bank = sum(t.amount_bank for t in transactions_in)\n        total_rent = sum(t.amount_rent for t in transactions_in)\n        total_deposits = sum(t.amount_deposit for t in transactions_in)',
     'total_receita = sum(t.amount for t in transactions_in)'),
    ('rev_by_month[key]["bank"] += t.amount_bank\n            rev_by_month[key]["rent"] += t.amount_rent\n            rev_by_month[key]["deposit"] += t.amount_deposit',
     'rev_by_month[key]["receita"] += t.amount'),
])

# ============================================================
# 9. backend/routers/payments.py
# ============================================================
print("\n[9/11] routers/payments.py")
replace_in_file(os.path.join(ROOT, "backend", "routers", "payments.py"), [
    ('sum(t.amount_bank + t.amount_rent for t in payments)', 'sum(t.amount for t in payments)'),
])

# ============================================================
# 10. backend/routers/alerts.py
# ============================================================
print("\n[10/11] routers/alerts.py")
replace_in_file(os.path.join(ROOT, "backend", "routers", "alerts.py"), [
    ('sum(t.amount_bank + t.amount_rent for t in payments)', 'sum(t.amount for t in payments)'),
])

# ============================================================
# 11. Frontend files
# ============================================================
print("\n[11/11] Frontend files")

# types.ts
for types_file in ["frontend/src/types.ts", "frontend/src/types/index.ts"]:
    fp = os.path.join(ROOT, types_file)
    if os.path.exists(fp):
        replace_in_file(fp, [
            ('amount_bank: number; amount_rent: number; amount_deposit: number;', 'amount: number;'),
        ])

# TransactionsIn.tsx
fp = os.path.join(ROOT, "frontend", "src", "pages", "TransactionsIn.tsx")
if os.path.exists(fp):
    replace_in_file(fp, [
        ("amount_bank: 0, amount_rent: 0, amount_deposit: 0,", "amount: 0,"),
        ("const totalBank = filteredItems.reduce((s, t) => s + t.amount_bank, 0);\n  const totalRent = filteredItems.reduce((s, t) => s + t.amount_rent, 0);\n  const totalDeposit = filteredItems.reduce((s, t) => s + t.amount_deposit, 0);",
         "const totalAmount = filteredItems.reduce((s, t) => s + t.amount, 0);"),
        ('<td className="table-cell text-right font-medium">{fmt(t.amount_bank)}</td>\n                  <td className="table-cell text-right font-medium">{fmt(t.amount_rent)}</td>\n                  <td className="table-cell text-right font-medium">{fmt(t.amount_deposit)}</td>',
         '<td className="table-cell text-right font-medium">{fmt(t.amount)}</td>'),
        ('<th className="table-header text-right">Bank</th>\n                  <th className="table-header text-right">Rent</th>\n                  <th className="table-header text-right">Deposit</th>',
         '<th className="table-header text-right">Amount</th>'),
        ('<div><label className="label">Amount Bank</label><input type="number" step="0.01" value={form.amount_bank} onChange={e => setForm({...form, amount_bank: Number(e.target.value)})} className="input-field" /></div>\n              <div><label className="label">Amount Rent</label><input type="number" step="0.01" value={form.amount_rent} onChange={e => setForm({...form, amount_rent: Number(e.target.value)})} className="input-field" /></div>\n              <div><label className="label">Amount Deposit</label><input type="number" step="0.01" value={form.amount_deposit} onChange={e => setForm({...form, amount_deposit: Number(e.target.value)})} className="input-field" /></div>',
         '<div><label className="label">Amount</label><input type="number" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: Number(e.target.value)})} className="input-field" /></div>'),
    ])

# ClientProfile.tsx
fp = os.path.join(ROOT, "frontend", "src", "pages", "ClientProfile.tsx")
if os.path.exists(fp):
    replace_in_file(fp, [
        ('<td className="table-cell text-right">{fmt(p.amount_bank)}</td>\n                          <td className="table-cell text-right">{fmt(p.amount_rent)}</td>\n                          <td className="table-cell text-right">{fmt(p.amount_deposit)}</td>',
         '<td className="table-cell text-right">{fmt(p.amount)}</td>'),
    ])

# ============================================================
# 12. Migração do banco de dados
# ============================================================
print("\n" + "=" * 60)
print("  MIGRAÇÃO DO BANCO (Railway PostgreSQL)")
print("=" * 60)

try:
    import psycopg2
    DB_URL = "postgresql://postgres:zYHlfOUOfAMSCjIlxmnAmSZbHoGhajjP@switchback.proxy.rlwy.net:28961/railway"
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    # Verificar se coluna amount já existe
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='transactions_in' AND column_name='amount'")
    if cur.fetchone():
        print("  [SKIP] Coluna 'amount' já existe")
    else:
        # Adicionar coluna amount
        cur.execute("ALTER TABLE transactions_in ADD COLUMN amount FLOAT DEFAULT 0")
        print("  [OK] Coluna 'amount' adicionada")

        # Migrar dados: amount = amount_bank + amount_rent + amount_deposit
        cur.execute("UPDATE transactions_in SET amount = COALESCE(amount_bank, 0) + COALESCE(amount_rent, 0) + COALESCE(amount_deposit, 0)")
        count = cur.rowcount
        print(f"  [OK] {count} registros migrados (amount = bank + rent + deposit)")

        conn.commit()

    cur.close()
    conn.close()
    print("  [OK] Banco atualizado!")
except ImportError:
    print("  [AVISO] psycopg2 não instalado. Rode manualmente:")
    print("  pip3 install psycopg2-binary && python3 migrate_amount.py")
except Exception as e:
    print(f"  [ERRO] {e}")

print("\n" + "=" * 60)
print("  MIGRAÇÃO CONCLUÍDA!")
print("=" * 60)
print("\nPróximos passos:")
print("  cd ~/Desktop/dream-abroad")
print("  git add -A && git commit -m 'Simplify amount fields' && git push")
