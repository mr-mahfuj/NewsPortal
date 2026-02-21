#!/bin/bash
#

echo "🚀 Starting NewsPortal Backend..."
echo ""


SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"


if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found!"
    echo "Creating virtual environment..."
    python3 -m venv venv
fi


source venv/bin/activate


echo "📦 Installing dependencies..."
pip install -q -r requirments.txt


if [ ! -f "../.env" ]; then
    echo "⚠️  Warning: .env file not found in root directory!"
    echo "Please create .env file with MongoDB credentials"
    exit 1
fi


echo ""
echo "✅ Starting FastAPI server on http://localhost:8000"
echo "📚 API Documentation: http://localhost:8000/docs"
echo ""
echo "Press CTRL+C to stop the server"
echo ""

uvicorn main:app --reload --port 8000
