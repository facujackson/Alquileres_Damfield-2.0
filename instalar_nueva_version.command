#!/bin/bash
set -e

# ── Buscar el archivo jsx ────────────────────────────────────────────
SCRIPT_DIR="$(dirname "$0")"
JSX="$SCRIPT_DIR/damfield-alquileres.jsx"
if [ ! -f "$JSX" ]; then
  # fallback: buscar en Downloads
  JSX=$(ls ~/Downloads/damfield-alquileres*.jsx 2>/dev/null | head -1)
fi
if [ -z "$JSX" ] || [ ! -f "$JSX" ]; then
  echo "❌ No se encontró damfield-alquileres.jsx"
  read -p "Presioná Enter para cerrar..."
  exit 1
fi
echo "✅ Archivo encontrado: $JSX"

# ── Token de GitHub ─────────────────────────────────────────────────
TOKEN_FILE="$(dirname "$0")/.github_token"
if [ ! -f "$TOKEN_FILE" ]; then
  echo "❌ No se encontró .github_token en la carpeta ALQUILERES"
  read -p "Presioná Enter para cerrar..."
  exit 1
fi
TOKEN=$(cat "$TOKEN_FILE")

# ── Crear carpeta en el Escritorio ──────────────────────────────────
DEST=~/Desktop/damfield-alquileres
mkdir -p "$DEST/src"
echo "📁 Carpeta creada: $DEST"

# ── package.json ────────────────────────────────────────────────────
cat > "$DEST/package.json" << 'EOF'
{
  "name": "damfield-alquileres",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.0"
  }
}
EOF

# ── vite.config.js ──────────────────────────────────────────────────
cat > "$DEST/vite.config.js" << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({ plugins: [react()] })
EOF

# ── index.html ──────────────────────────────────────────────────────
cat > "$DEST/index.html" << 'EOF'
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Damfield Alquileres</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOF

# ── src/main.jsx ────────────────────────────────────────────────────
cat > "$DEST/src/main.jsx" << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
)
EOF

# ── Copiar App.jsx ──────────────────────────────────────────────────
cp "$JSX" "$DEST/src/App.jsx"
echo "✅ App.jsx copiado desde Downloads"

# ── .gitignore ──────────────────────────────────────────────────────
cat > "$DEST/.gitignore" << 'EOF'
node_modules
dist
.github_token
EOF

# ── npm install ─────────────────────────────────────────────────────
echo ""
echo "📦 Instalando dependencias..."
cd "$DEST"
npm install

# ── Git ─────────────────────────────────────────────────────────────
echo ""
echo "🔀 Configurando git y subiendo a GitHub..."
git init
git checkout -B main
git add .
git commit -m "v1 damfield alquileres"
git remote remove origin 2>/dev/null || true
git remote add origin https://${TOKEN}@github.com/facujackson/Alquileres_Damfield-2.0.git
git push -u origin main --force

echo ""
echo "✅ Publicado en GitHub."
echo ""
echo "🚀 Iniciando servidor local en http://localhost:5173 ..."
echo "   (cerrá esta ventana para detener el servidor)"
echo ""
npm run dev
