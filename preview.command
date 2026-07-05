#!/bin/bash
cd "$(dirname "$0")"
echo "📦 Instalando dependencias si faltan..."
npm install --silent
echo ""
echo "🚀 Abriendo la app en el navegador..."
sleep 1
open http://localhost:5173
npm run dev
