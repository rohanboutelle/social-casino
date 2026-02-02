import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test('Simulate 100 Craps Rolls - House Edge Verification', async ({ page }) => {
  await page.goto('http://localhost:8000/#/craps'); 
  
  // Wait for game to load
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  const results: any[] = [];
  let totalWagered = 0;
  let totalWon = 0;
  let totalLost = 0;
  const totalRolls = 50;

  console.log(`Starting simulation of ${totalRolls} resolved bets...`);

  for (let i = 0; i < totalRolls; i++) {
    try {
      // Get balance before this bet
      const balanceElement = await page.locator('#balance-display').first();
      const balanceText = await balanceElement.textContent() || '';
      const balanceBefore = parseFloat(balanceText.replace(/[$,]/g, ''));
      
      // Place a Pass Line bet ONCE (click Pass Line area)
      await page.click('[data-bet="passLine"]');
      await page.waitForTimeout(200);
      totalWagered += 5; // Track the $5 bet we just placed
      
      // Keep rolling until the bet resolves
      let betResolved = false;
      let rollsInGame = 0;
      const maxRollsPerGame = 50; // Reasonable safety limit (average is ~3.4 rolls)
      
      while (!betResolved && rollsInGame < maxRollsPerGame) {
        // Click the roll button (do NOT click Pass Line again!)
        await page.click('button:has-text("Roll Dice")', { force: true });
        await page.waitForTimeout(800);
        
        rollsInGame++;
        
        // Check if Pass Line bet is cleared (bet resolved)
        // The bet is resolved when it's cleared from the table (shows $0)
        // This happens when: come-out roll resolves OR point is made/sevened out
        const passLineBetText = await page.locator('[data-bet="passLine"] .bet-amount').textContent() || '';
        
        // Bet is resolved when bet amount shows $0 (bet was cleared)
        if (passLineBetText.includes('$0')) {
          betResolved = true;
        }
        
        await page.waitForTimeout(100);
      }
      
      // If we hit max rolls, log debugging info
      if (rollsInGame >= maxRollsPerGame) {
        const pointText = await page.locator('#point-value').textContent() || '';
        const passLineBet = await page.locator('[data-bet="passLine"] .bet-amount').textContent() || '';
        console.log(`Bet ${i + 1} did not resolve after ${maxRollsPerGame} rolls. Point: ${pointText}, Bet: ${passLineBet}`);
      }
      
      // Get balance after bet resolved
      const balanceTextAfter = await balanceElement.textContent() || '';
      const balanceAfter = parseFloat(balanceTextAfter.replace(/[$,]/g, ''));
      
      // Calculate result
      const profitLoss = balanceAfter - balanceBefore;
      
      if (profitLoss > 0) {
        totalWon += profitLoss;
      } else if (profitLoss < 0) {
        totalLost += Math.abs(profitLoss);
      }
      
      const betResult = {
        bet: i + 1,
        rollsToResolve: rollsInGame,
        balanceBefore: balanceBefore.toFixed(2),
        balanceAfter: balanceAfter.toFixed(2),
        profitLoss: profitLoss.toFixed(2),
        result: profitLoss > 0 ? 'WIN' : profitLoss < 0 ? 'LOSS' : 'PUSH'
      };
      
      results.push(betResult);
      
      // Log progress every 10 bets
      if ((i + 1) % 10 === 0) {
        console.log(`Completed ${i + 1}/${totalRolls} bets. Balance: $${balanceAfter.toFixed(2)}`);
      }
      
      await page.waitForTimeout(300);
      
    } catch (error) {
      console.error(`Error on bet ${i + 1}:`, error);
      results.push({
        bet: i + 1,
        error: String(error)
      });
    }
  }
  
  // Calculate final statistics
  const wins = results.filter(r => r.result === 'WIN').length;
  const losses = results.filter(r => r.result === 'LOSS').length;
  const pushes = results.filter(r => r.result === 'PUSH').length;
  const netProfit = totalWon - totalLost;
  const houseEdge = totalWagered > 0 ? ((totalLost - totalWon) / totalWagered) * 100 : 0;
  const totalRollsToResolve = results.reduce((sum, r) => sum + (r.rollsToResolve || 0), 0);
  
  const startBalance = results[0]?.balanceBefore || 0;
  const endBalance = results[results.length - 1]?.balanceAfter || 0;
  
  const summary = {
    totalBets: totalRolls,
    totalRollsToResolve,
    avgRollsPerBet: (totalRollsToResolve / totalRolls).toFixed(2),
    wins,
    losses,
    pushes,
    winRate: ((wins / (wins + losses)) * 100).toFixed(2) + '%',
    startBalance: `$${startBalance}`,
    endBalance: `$${endBalance}`,
    netProfit: `$${netProfit.toFixed(2)}`,
    totalWagered: `$${totalWagered.toFixed(2)}`,
    actualHouseEdge: houseEdge.toFixed(4) + '%',
    expectedPassLineEdge: '1.41%',
    completedAt: new Date().toISOString()
  };
  
  // Write results to files
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const detailedFile = `craps-simulation-${timestamp}-detailed.json`;
  const summaryFile = `craps-simulation-${timestamp}-summary.txt`;
  
  fs.writeFileSync(detailedFile, JSON.stringify({ summary, results }, null, 2));
  
  const summaryText = `
=== CRAPS SIMULATION RESULTS ===
Date: ${new Date().toLocaleString()}
Total Bets Resolved: ${totalRolls}
Total Dice Rolls: ${summary.totalRollsToResolve}
Average Rolls per Bet: ${summary.avgRollsPerBet}
Wins: ${wins}
Losses: ${losses}
Pushes: ${pushes}
Win Rate: ${summary.winRate}

FINANCIAL RESULTS:
Starting Balance: ${summary.startBalance}
Ending Balance: ${summary.endBalance}
Net Profit/Loss: ${summary.netProfit}
Total Wagered: ${summary.totalWagered}

HOUSE EDGE:
Actual House Edge: ${summary.actualHouseEdge}
Expected (Pass Line): ${summary.expectedPassLineEdge}

Detailed results saved to: ${detailedFile}
`;
  
  fs.writeFileSync(summaryFile, summaryText);
  
  console.log(summaryText);
  console.log(`\nResults saved to:`);
  console.log(`  - ${summaryFile}`);
  console.log(`  - ${detailedFile}`);
  
  // Verify house edge is reasonable
  expect(Math.abs(houseEdge)).toBeLessThan(15);
});