#!/usr/bin/env python3
"""
Migra dados do SQLite local para Supabase PostgreSQL.
Uso: DATABASE_URL="postgresql://..." python3 migrate_to_supabase.py
"""
import sqlite3
import os
import sys

try:
    import psycopg2
except ImportError:
    print("Instale: pip3 install psycopg2-binary")
    sys.exit(1)

DB_URL = os.getenv("DATABASE_URL", "")
if not DB_URL:
    print("Defina DATABASE_URL primeiro!")
    print('Exemplo: export DATABASE_URL="postgresql://postgres.[ref]:[pass]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"')
    sys.exit(1)

SQLITE_PATH = os.path.join(os.path.dirname(__file__), "backend", "dream_abroad.db")
if not os.path.exists(SQLITE_PATH):
    print(f"SQLite não encontrado: {SQLITE_PATH}")
    sys.exit(1)

print(f"Conectando SQLite: {SQLITE_PATH}")
sqlite_conn = sqlite3.connect(SQLITE_PATH)
sqlite_conn.row_factory = sqlite3.Row

print(f"Conectando PostgreSQL...")
pg_conn = psycopg2.connect(DB_URL)
pg_cur = pg_conn.cursor()

# Tabelas na ordem correta (respeitar foreign keys)
TABLES = [
    "users", "settings", "properties", "rooms", "beds", "clients",
    "transactions_in", "transactions_out", "contracts", "documents",
    "alerts", "client_remarks", "property_remarks", "maintenance_requests"
]

for table in TABLES:
    try:
        rows = sqlite_conn.execute(f"SELECT * FROM {table}").fetchall()
        if not rows:
            print(f"  [{table}] vazia, pulando...")
            continue

        cols = [desc[0] for desc in sqlite_conn.execute(f"SELECT * FROM {table} LIMIT 1").description]
        placeholders = ", ".join(["%s"] * len(cols))
        col_names = ", ".join([f'"{c}"' for c in cols])

        # Limpar tabela destino
        pg_cur.execute(f"DELETE FROM {table}")

        count = 0
        for row in rows:
            values = [row[c] for c in cols]
            try:
                pg_cur.execute(f"INSERT INTO {table} ({col_names}) VALUES ({placeholders})", values)
                count += 1
            except Exception as e:
                print(f"    Erro em {table} row: {e}")
                pg_conn.rollback()
                continue

        # Reset sequence
        if "id" in cols:
            pg_cur.execute(f"SELECT MAX(id) FROM {table}")
            max_id = pg_cur.fetchone()[0] or 0
            pg_cur.execute(f"SELECT setval(pg_get_serial_sequence(\'{table}\', \'id\'), {max_id + 1}, false)")

        pg_conn.commit()
        print(f"  [{table}] {count} registros migrados")
    except Exception as e:
        print(f"  [{table}] ERRO: {e}")
        pg_conn.rollback()

sqlite_conn.close()
pg_conn.close()
print("\nMigração concluída!")
