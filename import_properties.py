#!/usr/bin/env python3
"""Importa propriedades para o banco PostgreSQL do Railway"""
import psycopg2
from datetime import datetime

DB_URL = "postgresql://postgres:zYHlfOUOfAMSCjIlxmnAmSZbHoGhajjP@switchback.proxy.rlwy.net:28961/railway"

properties = [
    "1 Glen View",
    "1 Panorama Terrace",
    "1 Salvador House",
    "1 Woodland View",
    "10A Vicars St",
    "12 The Mall",
    "120 Lower Glanmire",
    "128 Barrack St",
    "130 Deerpark",
    "14 Dyke Parade",
    "15 Wolfe Tone St",
    "19 Pine Street",
    "2 Eldred Terrace",
    "2 Eldred Terrace Top Floor",
    "2 Green St",
    "2 Rossan",
    "209 Lower Pouladuff Rd",
    "21 Anglesea St",
    "22 Turners Cross",
    "23 Nicholas St",
    "23 24 Watercourse Rd",
    "3 Hardwick St",
    "30 Melbourne Av",
    "36 Barrack St (top floor)",
    "37 Clarkes Rd",
    "44 GWOS",
    "51 Evergreen Rd",
    "6 Devonshire (ground)",
    "60 Great William",
    "6A Devonshire",
    "7 Devonshire St",
    "8 Devonshire St",
    "9 Copley Place",
    "97 Douglas St",
    "A6 Crawford Hall",
    "Apt1, 43 Popes Quay",
    "Apt1, 60 Dominick St",
    "Apt1, 68 GGS",
    "Apt2, 4 Lancaster Quay",
    "Apt2, 43 Popes Quay",
    "Apt2, 68 GGS",
    "Apt3 120 Lower",
    "Apt3, 68 GGS",
    "Geral",
    "Apt 64 North Quay Place",
    "135 Evergreen Rd",
    "56 Popes Hill",
    "34 Mount Carmel Rd",
    "11BC Friars Walk",
]

print(f"Conectando ao banco...")
conn = psycopg2.connect(DB_URL)
cur = conn.cursor()

now = datetime.now().isoformat()
count = 0

for name in properties:
    # Verificar se já existe
    cur.execute("SELECT id FROM properties WHERE name = %s", (name,))
    if cur.fetchone():
        print(f"  [SKIP] {name} (já existe)")
        continue

    cur.execute("""
        INSERT INTO properties (name, address, monthly_rent, type, status, notes, created_at, updated_at)
        VALUES (%s, %s, 0, 'APARTAMENTO', 'ATIVO', '', %s, %s)
    """, (name, f"{name}, Cork, Ireland", now, now))
    count += 1
    print(f"  [OK] {name}")

conn.commit()
cur.close()
conn.close()
print(f"\n{count} propriedades importadas com sucesso!")
