import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test('Simulate 1000 Blackjack Hands - House Edge Verification', async ({ page }) => {
  await page.goto('http://localhost:8000/#/blackjack'); 
  
  // Wait for game to load
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  const results: any[] = [];
  let totalWagered = 0;
  let totalWon = 0;
  let totalLost = 0;
  const totalHands = 1000;

  console.log(`Starting simulation of ${totalHands} blackjack hands...`);

  for (let i = 0; i < totalHands; i++) {
    try {
      // Get balance before this hand
      const balanceElement = await page.locator('#balance-display').first();
      const balanceText = await balanceElement.textContent() || '';
      const balanceBefore = parseFloat(balanceText.replace(/[$,]/g, ''));
      
      // Place a $5 bet by clicking $5 chip
      const chip5 = await page.locator('[data-value="5"]').first();
      await chip5.click();
      totalWagered += 5;
      
      // Deal the hand
      await page.click('#deal-btn');
      await page.waitForTimeout(600);
      
      // Play with basic strategy: hit on < 17, stand on 17+
      let playing = true;
      let rolls = 0;
      const maxRolls = 20; // Safety limit
      
      while (playing && rolls < maxRolls) {
        // Get player total
        const playerTotalText = await page.locator('#player-total').textContent() || '';
        const playerTotalMatch = playerTotalText.match(/Total: (\d+)/);
        const playerTotal = playerTotalMatch ? parseInt(playerTotalMatch[1]) : 0;
        
        // Check if result is showing
        const resultArea = await page.locator('#result-area').textContent() || '';
        
        if (resultArea.includes('WIN') || resultArea.includes('LOSE') || resultArea.includes('TIE')) {
          playing = false;
          break;
        }
        
        // Check if hit/stand buttons are visible
        const hitBtn = await page.locator('#hit-btn');
        const hitVisible = await hitBtn.isVisible();
        
        if (!hitVisible) {
          // Game finished
          playing = false;
          break;
        }
        
        // Basic strategy: hit on < 17, stand on 17+
        if (playerTotal < 17) {
          await page.click('#hit-btn');
          await page.waitForTimeout(400);
          rolls++;
        } else {
          await page.click('#stand-btn');
          await page.waitForTimeout(600);
          rolls++;
          playing = false;
        }
      }
      
      // Wait a bit for result to display
      await page.waitForTimeout(200);
      
      // Get balance after hand
      const balanceTextAfter = await balanceElement.textContent() || '';
      const balanceAfter = parseFloat(balanceTextAfter.replace(/[$,]/g, ''));
      
      // Calculate result
      const profitLoss = balanceAfter - balanceBefore;
      let result = 'LOSS';
      
      if (profitLoss > 0) {
        result = 'WIN';
        totalWon += profitLoss;
      } else if (profitLoss < 0) {
        totalLost += Math.abs(profitLoss);
      } else {
        result = 'PUSH';
      }
      
      const handResult = {
        hand: i + 1,
        balanceBefore: balanceBefore.toFixed(2),
        balanceAfter: balanceAfter.toFixed(2),
        profitLoss: profitLoss.toFixed(2),
        result: result
      };
      
      results.push(handResult);
      
      // Log progress every 100 hands
      if ((i + 1) % 100 === 0) {
        console.log(`Completed ${i + 1}/${totalHands} hands. Balance: $${balanceAfter.toFixed(2)}`);
      }
      
      // Click New Hand button to reset
      const newHandBtn = await page.locator('#new-hand-btn');
      const newHandVisible = await newHandBtn.isVisible();
      if (newHandVisible) {
        await newHandBtn.click();
        await page.waitForTimeout(300);
      }
      
    } catch (error) {
      console.error(`Error on hand ${i + 1}:`, error);
      results.push({
        hand: i + 1,
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
  
  const startBalance = results[0]?.balanceBefore || 0;
  const endBalance = results[results.length - 1]?.balanceAfter || 0;
  
  const summary = {
    totalHands: totalHands,
    completedHands: results.filter(r => r.result).length,
    wins,
    losses,
    pushes,
    winRate: ((wins / (wins + losses + pushes)) * 100).toFixed(2) + '%',
    startBalance: `$${startBalance}`,
    endBalance: `$${endBalance}`,
    netProfit: `$${netProfit.toFixed(2)}`,
    totalWagered: `$${totalWagered.toFixed(2)}`,
    actualHouseEdge: houseEdge.toFixed(4) + '%',
    expectedBlackjackEdge: '0.5%',
    completedAt: new Date().toISOString()
  };
  
  // Write results to files
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const detailedFile = `blackjack-simulation-${timestamp}-detailed.json`;
  const summaryFile = `blackjack-simulation-${timestamp}-summary.txt`;
  
  fs.writeFileSync(detailedFile, JSON.stringify({ summary, results }, null, 2));
  
  const summaryText = `
=== BLACKJACK SIMULATION RESULTS ===
Date: ${new Date().toLocaleString()}
Total Hands: ${totalHands}
Completed Hands: ${results.filter(r => r.result).length}
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
Expected (Blackjack): ${summary.expectedBlackjackEdge}

Detailed results saved to: ${detailedFile}
`;
  
  fs.writeFileSync(summaryFile, summaryText);
  
  console.log(summaryText);
  console.log(`\nResults saved to:`);
  console.log(`  - ${summaryFile}`);
  console.log(`  - ${detailedFile}`);
});
