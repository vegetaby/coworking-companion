#!/bin/bash
# =============================================================================
# CoWorking Space Companion -- Setup & Deploy Script
# =============================================================================
# Dieses Script installiert alle Abhaengigkeiten, baut die App und
# deployed sie optional auf Netlify.
#
# Ausfuehren: chmod +x setup.sh && ./setup.sh
# =============================================================================

set -e

echo ""
echo "=========================================="
echo "  CoWorking Space Companion -- Setup"
echo "=========================================="
echo ""

# 1. Pruefen ob Node.js installiert ist
if ! command -v node &> /dev/null; then
    echo "Node.js ist nicht installiert!"
    echo "Bitte installiere Node.js: https://nodejs.org/"
    exit 1
fi

echo "Node.js Version: $(node -v)"
echo "npm Version: $(npm -v)"
echo ""

# 2. Abhaengigkeiten installieren
echo ">> Installiere Abhaengigkeiten..."
npm install
echo ""

# 3. .env pruefen
if [ ! -f .env ]; then
    echo ">> Erstelle .env aus .env.example..."
    cp .env.example .env
    echo ""
    echo "WICHTIG: Oeffne .env und trage deine Supabase-Daten ein!"
    echo "  VITE_SUPABASE_URL=https://lfujrpzaenfptyehcwwd.supabase.co"
    echo "  VITE_SUPABASE_ANON_KEY=<dein-anon-key>"
    echo ""
    echo "Den Anon Key findest du unter:"
    echo "  https://supabase.com/dashboard/project/lfujrpzaenfptyehcwwd/settings/api"
    echo ""
    read -p "Druecke Enter wenn du die .env Datei konfiguriert hast..."
fi

# Pruefen ob der Anon Key gesetzt wurde
if grep -q "HIER_DEINEN_ANON_KEY_EINFUEGEN\|your-anon-key-here" .env 2>/dev/null; then
    echo ""
    echo "WARNUNG: Der Supabase Anon Key ist noch nicht gesetzt!"
    echo "Bitte oeffne .env und ersetze den Platzhalter."
    echo ""
    read -p "Druecke Enter wenn du den Key eingetragen hast..."
fi

# 4. Dev-Server oder Build
echo ""
echo "Was moechtest du tun?"
echo "  1) Dev-Server starten (lokal entwickeln)"
echo "  2) Produktions-Build erstellen (fuer Netlify)"
echo "  3) Build erstellen UND auf Netlify deployen"
echo ""
read -p "Deine Wahl (1/2/3): " choice

case $choice in
    1)
        echo ""
        echo ">> Starte Dev-Server auf http://localhost:3000..."
        npm run dev
        ;;
    2)
        echo ""
        echo ">> Erstelle Produktions-Build..."
        npm run build
        echo ""
        echo "Build erfolgreich! Der dist/ Ordner ist bereit."
        echo ""
        echo "Zum Deployen auf Netlify:"
        echo "  1. Oeffne https://app.netlify.com/start"
        echo "  2. Scrolle zu 'Upload your project files'"
        echo "  3. Ziehe den 'dist' Ordner per Drag & Drop rein"
        echo ""
        ;;
    3)
        echo ""
        echo ">> Erstelle Produktions-Build..."
        npm run build
        echo ""

        # Pruefen ob Netlify CLI installiert ist
        if ! command -v netlify &> /dev/null; then
            echo ">> Installiere Netlify CLI..."
            npm install -g netlify-cli
        fi

        echo ">> Deploye auf Netlify..."
        netlify deploy --prod --dir=dist
        echo ""
        echo "Deployment abgeschlossen!"
        ;;
    *)
        echo "Ungueltige Auswahl. Bitte starte das Script erneut."
        exit 1
        ;;
esac
