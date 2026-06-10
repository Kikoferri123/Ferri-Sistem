#!/bin/bash
# Deploy fix: Remove all old amount_bank/amount_rent/amount_deposit references
# from frontend types and pages, and backend schemas/dashboard

cd ~/Desktop/dream-abroad

echo "=== Arquivos modificados ==="
git diff --stat

echo ""
echo "=== Fazendo commit e push ==="
git add -A
git commit -m "Fix: remove all old amount field references (bank/rent/deposit -> single amount)

- Fixed frontend types.ts and types/index.ts: PnLRow, RankingProperty, PropertyProfile
- Fixed Ranking.tsx: removed receita_bank/receita_rent columns
- Fixed PnL.tsx: merged revenue rows into single Receita row
- Fixed PropertyProfile.tsx: single Receita KPI card
- Fixed ClientProfile.tsx: simplified financial monthly table
- Fixed backend schemas.py: PnLRow, RankingProperty, PropertyProfile, ClientProfileMonthSummary
- Fixed backend dashboard.py: PnL calculation uses single receita field
- Fixed backend clients.py: monthly_data uses single revenue field"

git push

echo ""
echo "=== Deploy concluido! ==="
echo "Aguarde ~2min para Railway (backend) e Vercel (frontend) atualizarem."
