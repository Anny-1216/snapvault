#!/bin/bash
# Quick local testing script

echo "🧪 SnapVault Local Testing Setup"
echo "================================"
echo ""

# Check if Python3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 not found. Install Python 3.8+"
    exit 1
fi

echo "✅ Python3 found"
echo ""

# Option to run demo mode
echo "Choose testing mode:"
echo "1) Demo mode (UI only, no auth) - FASTEST"
echo "2) Full OAuth testing (requires env vars)"
echo ""
read -p "Enter choice (1 or 2): " choice

if [ "$choice" = "1" ]; then
    echo ""
    echo "🚀 Starting demo mode..."
    echo "Opening http://localhost:8080/?demo=1"
    echo ""
    echo "Press Ctrl+C to stop server"
    echo ""
    
    cd "$(dirname "$0")"
    python3 -m http.server 8080 --directory public
    
elif [ "$choice" = "2" ]; then
    echo ""
    echo "⚠️  Full OAuth testing requires:"
    echo "   1. .env.local file with OAuth credentials"
    echo "   2. Updated OAuth apps with http://localhost:8080"
    echo "   3. Node.js running api/config.js"
    echo ""
    echo "See TESTING.md for setup steps"
    echo ""
    read -p "Continue? (y/n): " confirm
    
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        echo ""
        echo "Check .env.local exists:"
        if [ -f ".env.local" ]; then
            echo "✅ .env.local found"
        else
            echo "❌ .env.local not found. Copy from .env.example:"
            echo "   cp .env.example .env.local"
            echo "   Edit .env.local with your credentials"
            exit 1
        fi
        
        echo ""
        echo "🚀 Starting local server..."
        echo "Opening http://localhost:8080"
        echo ""
        echo "Press Ctrl+C to stop server"
        echo ""
        
        cd "$(dirname "$0")"
        python3 -m http.server 8080 --directory public
    else
        echo "Cancelled"
        exit 0
    fi
else
    echo "Invalid choice"
    exit 1
fi
