#!/bin/bash
# Quick start script for running the craps simulation

echo "🎲 Starting Craps House Edge Simulation..."
echo ""
echo "This will simulate 500 rolls and verify the house edge."
echo ""

# Check if server is running
if ! curl -s http://localhost:8000 > /dev/null; then
    echo "⚠️  Local server not detected on port 8000"
    echo "Starting server..."
    python3 -m http.server 8000 &
    SERVER_PID=$!
    sleep 2
    echo "✅ Server started (PID: $SERVER_PID)"
else
    echo "✅ Server already running on port 8000"
fi

echo ""
echo "🧪 Running Playwright test..."
npx playwright test simulate_craps.spec.ts --reporter=list

echo ""
echo "📊 Check the output files for detailed results:"
ls -lh craps-simulation-*.{json,txt} 2>/dev/null || echo "No result files found yet"
