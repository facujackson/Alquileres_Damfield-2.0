#!/bin/bash
cd "$(dirname "$0")"
git add .
git commit -m "Actualización Damfield"
git push https://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@github.com/facujackson/Alquileres_Damfield-2.0.git HEAD:main
echo ""
echo "✅ Publicado en GitHub. Vercel va a actualizar la app en ~1 minuto."
read -p "Presioná Enter para cerrar..."
