#!/bin/bash
echo "================================================"
echo "   Dream Abroad - Property Management System"
echo "================================================"
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "Python3 nao encontrado. Instale Python 3.10+"
    exit 1
fi

# Backend setup
echo ">> Configurando Backend..."
cd backend

# Create venv if not exists
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate

pip install -r requirements.txt -q
echo ">> Dependencias do backend instaladas."

# Seed database
echo ">> Populando banco de dados com dados de exemplo..."
python3 seed.py

# Start backend
echo ""
echo ">> Iniciando Backend em http://localhost:8000"
echo ">> API Docs: http://localhost:8000/docs"
echo ""
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

cd ..

# Frontend setup
echo ""
echo ">> Configurando Frontend..."
cd frontend

if [ ! -d "node_modules" ]; then
    npm install
fi

echo ">> Iniciando Frontend em http://localhost:5173"
npm run dev &
FRONTEND_PID=$!

cd ..

echo ""
echo "================================================"
echo "  Sistema Dream Abroad iniciado!"
echo ""
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
echo ""
echo "  Login: admin@dreamabroad.com / admin123"
echo "================================================"
echo ""
echo "Pressione Ctrl+C para parar os servidores."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
