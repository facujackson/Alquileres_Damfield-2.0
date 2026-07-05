#!/bin/bash
cd "$(dirname "$0")"
TOKEN=$(cat .github_token)
git add .
git commit -m "Actualización Damfield"
git push https://${TOKEN}@github.com/facujackson/Alquileres_Damfield-2.0.git HEAD:main
echo ""
echo "✅ Publicado en GitHub. Vercel va a actualizar la app en ~1 minuto."
read -p "Presioná Enter para cerrar..."
