#!/bin/bash
# Deploy fix v2: Fix remaining old field references causing frontend crash
# - PropertyProfile.tsx: revenue chart still used bank/rent/deposit
# - reports.py: CSV export header mismatch

cd ~/Desktop/dream-abroad

echo "=== Verificando alteracoes ==="
git diff --stat

echo ""
echo "=== Commit e Push ==="
git add -A
git commit -m "Fix: PropertyProfile chart + reports CSV + remaining old field refs

- PropertyProfile.tsx: chart now uses single Receita bar instead of Bank/Rent/Deposit
- PropertyProfile.tsx: KPI cards use total_receita
- reports.py: CSV export header matches data columns (single Amount)
- schemas.py: PropertyProfile, PnLRow, RankingProperty, ClientProfileMonthSummary cleaned
- dashboard.py: PnL uses single receita field
- clients.py: monthly_data uses single revenue field
- types.ts + types/index.ts: all interfaces updated"

git push

echo ""
echo "=== Feito! Aguarde ~2min para atualizar ==="
