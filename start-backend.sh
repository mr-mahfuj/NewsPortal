#!/bin/bash
# Quick start script for NewsPortal

echo "════════════════════════════════════════════════════════════"
echo "           NewsPortal - Quick Start"
echo "════════════════════════════════════════════════════════════"
echo ""

# Kill any process on port 8000
echo "🔍 Checking for existing backend process..."
lsof -ti:8000 | xargs kill -9 2>/dev/null && echo "✅ Killed existing process on port 8000" || echo "✅ Port 8000 is free"

echo ""
echo "🚀 Starting Backend Server..."
cd backend
bash -c "source venv/bin/activate && uvicorn main:app --host 127.0.0.1 --port 8000 --reload" &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Test if backend is running
if curl -s http://127.0.0.1:8000/test > /dev/null 2>&1; then
    echo "✅ Backend running on http://127.0.0.1:8000"
    echo "📚 API Docs: http://127.0.0.1:8000/docs"
else
    echo "❌ Backend failed to start"
    exit 1
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "Backend is ready!"
echo ""
echo "To start frontend in another terminal:"
echo "  cd news-portal"
echo "  npm run dev"
echo ""
echo "Press CTRL+C to stop the backend"
echo "════════════════════════════════════════════════════════════"

# Wait for user to stop
wait $BACKEND_PID
