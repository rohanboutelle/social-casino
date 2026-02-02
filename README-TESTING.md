# Social Casino - Playwright Testing

## Setup Instructions

1. **Install Playwright and dependencies:**
   ```bash
   npm install
   npx playwright install
   ```

2. **Make sure your local server is running:**
   ```bash
   python3 -m http.server 8000
   ```

3. **Run the craps simulation:**
   ```bash
   npm run test:craps
   ```

## What the Test Does

The `simulate_craps.spec.ts` script will:
- Navigate to http://localhost:8000/#/craps
- Loop 500 times, clicking the Roll button each time
- Track balance changes, wins, losses, and pushes
- Calculate the actual house edge from the simulation
- Compare it to the expected house edge (1.41% for Pass Line)
- Save detailed results to JSON and summary to TXT files

## Output Files

After running the test, you'll get two files:
- `craps-simulation-YYYY-MM-DD-detailed.json` - Full roll-by-roll data
- `craps-simulation-YYYY-MM-DD-summary.txt` - Summary statistics

## Other Test Commands

- Run with browser visible: `npm run test:headed`
- Debug mode: `npm run test:debug`
- All tests: `npm test`

## Expected Results

For a properly implemented craps game with Pass Line bets:
- **House Edge:** ~1.41%
- **Win Rate:** ~49.3%
- Over 500 rolls, you should see results close to these values
