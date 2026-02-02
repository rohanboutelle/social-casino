/**
 * Craps Game Module - Full Casino Table
 * Complete betting layout with Pass/Don't Pass, Come, Field, Place, Hardways, Props
 */

class CrapsGame {
  constructor() {
    this.dice = [0, 0];
    this.point = null;
    this.gameState = 'comeOut'; // comeOut, point
    this.bets = {
      passLine: 0,
      dontPass: 0,
      come: 0,
      dontCome: 0,
      field: 0,
      place: { 4: 0, 5: 0, 6: 0, 8: 0, 9: 0, 10: 0 },
      hardways: { 4: 0, 6: 0, 8: 0, 10: 0 },
      anySeven: 0,
      anyCraps: 0,
      horn: 0,
      big6: 0,
      big8: 0
    };
    this.totalBet = 0;
  }

  placeBet(betType, amount, number = null) {
    if (number !== null) {
      this.bets[betType][number] += amount;
    } else {
      this.bets[betType] += amount;
    }
    this.totalBet += amount;
  }

  rollDice() {
    this.dice = [randomInt(1, 6), randomInt(1, 6)];
    return this.dice;
  }

  getDiceTotal() {
    return this.dice[0] + this.dice[1];
  }

  isHardway(num) {
    return (num === 4 || num === 6 || num === 8 || num === 10) && this.dice[0] === this.dice[1];
  }

  calculatePayouts() {
    const total = this.getDiceTotal();
    let payouts = {};
    let messages = [];
    let clearBets = {}; // Track which bets to clear (won or lost)

    // Come Out Roll
    if (this.gameState === 'comeOut') {
      // Pass Line
      if (this.bets.passLine > 0) {
        if (total === 7 || total === 11) {
          payouts.passLine = this.bets.passLine * 2;
          messages.push(`Pass Line wins! +$${this.bets.passLine}`);
          clearBets.passLine = true;
        } else if (total === 2 || total === 3 || total === 12) {
          messages.push(`Pass Line loses.`);
          clearBets.passLine = true;
        } else {
          this.point = total;
          this.gameState = 'point';
          messages.push(`Point is ${this.point}`);
          // Bet stays on the table
        }
      }

      // Don't Pass
      if (this.bets.dontPass > 0) {
        if (total === 2 || total === 3) {
          payouts.dontPass = this.bets.dontPass * 2;
          messages.push(`Don't Pass wins! +$${this.bets.dontPass}`);
          clearBets.dontPass = true;
        } else if (total === 12) {
          payouts.dontPass = this.bets.dontPass; // Push
          messages.push(`Don't Pass pushes (12).`);
          clearBets.dontPass = true;
        } else if (total === 7 || total === 11) {
          messages.push(`Don't Pass loses.`);
          clearBets.dontPass = true;
        } else {
          this.point = total;
          this.gameState = 'point';
          messages.push(`Point is ${this.point}`);
          // Bet stays on the table
        }
      }
    }
    // Point Phase
    else if (this.gameState === 'point') {
      // Pass Line
      if (this.bets.passLine > 0) {
        if (total === this.point) {
          payouts.passLine = this.bets.passLine * 2;
          messages.push(`Point made! Pass Line wins! +$${this.bets.passLine}`);
          this.gameState = 'comeOut';
          this.point = null;
          clearBets.passLine = true;
        } else if (total === 7) {
          messages.push(`Seven out! Pass Line loses.`);
          this.gameState = 'comeOut';
          this.point = null;
          clearBets.passLine = true;
        } else {
          // Bet stays on the table
        }
      }

      // Don't Pass
      if (this.bets.dontPass > 0) {
        if (total === 7) {
          payouts.dontPass = this.bets.dontPass * 2;
          messages.push(`Seven out! Don't Pass wins! +$${this.bets.dontPass}`);
          this.gameState = 'comeOut';
          this.point = null;
          clearBets.dontPass = true;
        } else if (total === this.point) {
          messages.push(`Point made! Don't Pass loses.`);
          this.gameState = 'comeOut';
          this.point = null;
          clearBets.dontPass = true;
        } else {
          // Bet stays on the table
        }
      }
    }

    // Field Bet (2, 3, 4, 9, 10, 11, 12)
    if (this.bets.field > 0) {
      if ([3, 4, 9, 10, 11].includes(total)) {
        payouts.field = this.bets.field * 2;
        messages.push(`Field wins (1:1)! +$${this.bets.field}`);
      } else if (total === 2) {
        payouts.field = this.bets.field * 3; // 2:1
        messages.push(`Field wins (2:1)! +$${this.bets.field * 2}`);
      } else if (total === 12) {
        payouts.field = this.bets.field * 3; // 2:1
        messages.push(`Field wins (2:1)! +$${this.bets.field * 2}`);
      } else {
        messages.push(`Field loses.`);
      }
    }

    // Place Bets
    for (let num in this.bets.place) {
      if (this.bets.place[num] > 0 && parseInt(num) === total) {
        const odds = { 4: 1.8, 5: 1.4, 6: 1.166, 8: 1.166, 9: 1.4, 10: 1.8 };
        const payout = Math.round(this.bets.place[num] * (1 + odds[num]) * 100) / 100;
        payouts[`place${num}`] = payout;
        messages.push(`Place ${num} wins! +$${(payout - this.bets.place[num]).toFixed(2)}`);
      } else if (this.bets.place[num] > 0 && total === 7) {
        messages.push(`Place ${num} loses (7 out).`);
      }
      // Place bets stay on the table if not resolved
    }

    // Hardways
    for (let num in this.bets.hardways) {
      const n = parseInt(num);
      if (this.bets.hardways[num] > 0) {
        if (total === n && this.isHardway(n)) {
          const odds = { 4: 7, 6: 9, 8: 9, 10: 7 };
          const payout = this.bets.hardways[num] * (odds[num] + 1);
          payouts[`hard${num}`] = payout;
          messages.push(`Hard ${num} wins! +$${this.bets.hardways[num] * odds[num]}`);
        } else if (total === n || total === 7) {
          messages.push(`Hard ${num} loses.`);
        }
        // Hardway bets stay on the table if not resolved
      }
    }

    // Any Seven (one roll)
    if (this.bets.anySeven > 0) {
      if (total === 7) {
        payouts.anySeven = this.bets.anySeven * 5; // 4:1
        messages.push(`Any Seven wins! +$${this.bets.anySeven * 4}`);
      } else {
        messages.push(`Any Seven loses.`);
      }
    }

    // Any Craps (one roll: 2, 3, 12)
    if (this.bets.anyCraps > 0) {
      if ([2, 3, 12].includes(total)) {
        payouts.anyCraps = this.bets.anyCraps * 8; // 7:1
        messages.push(`Any Craps wins! +$${this.bets.anyCraps * 7}`);
      } else {
        messages.push(`Any Craps loses.`);
      }
    }

    // Horn Bet (2, 3, 11, 12) - splits bet 4 ways
    if (this.bets.horn > 0) {
      const quarter = this.bets.horn / 4;
      if (total === 2 || total === 12) {
        payouts.horn = quarter * 31; // 30:1 on the winning number
        messages.push(`Horn wins (${total})! +$${(quarter * 30).toFixed(2)}`);
      } else if (total === 3 || total === 11) {
        payouts.horn = quarter * 16; // 15:1 on the winning number
        messages.push(`Horn wins (${total})! +$${(quarter * 15).toFixed(2)}`);
      } else {
        messages.push(`Horn loses.`);
      }
    }

    // Big 6 / Big 8
    if (this.bets.big6 > 0) {
      if (total === 6) {
        payouts.big6 = this.bets.big6 * 2;
        messages.push(`Big 6 wins! +$${this.bets.big6}`);
      } else if (total === 7) {
        messages.push(`Big 6 loses.`);
      }
      // Big 6 bet stays on the table if not resolved
    }

    if (this.bets.big8 > 0) {
      if (total === 8) {
        payouts.big8 = this.bets.big8 * 2;
        messages.push(`Big 8 wins! +$${this.bets.big8}`);
      } else if (total === 7) {
        messages.push(`Big 8 loses.`);
      }
      // Big 8 bet stays on the table if not resolved
    }

    return { payouts, messages, total, clearBets };
  }

  clearBets() {
    this.bets = {
      passLine: 0,
      dontPass: 0,
      come: 0,
      dontCome: 0,
      field: 0,
      place: { 4: 0, 5: 0, 6: 0, 8: 0, 9: 0, 10: 0 },
      hardways: { 4: 0, 6: 0, 8: 0, 10: 0 },
      anySeven: 0,
      anyCraps: 0,
      horn: 0,
      big6: 0,
      big8: 0
    };
    this.totalBet = 0;
  }
}

/**
 * Craps Table UI
 */
function launchCraps(container) {
  let game = new CrapsGame();
  window.game = game;
  let chipValue = 5;

  container.innerHTML = `
    <div class="craps-table-container">
      <div class="craps-header">
        <h3>Craps Table</h3>
        <div class="dice-display" id="dice-display">
          <div class="die">?</div>
          <div class="die">?</div>
        </div>
        <div id="point-indicator">Point: <span id="point-value">OFF</span></div>
      </div>

      <div class="chip-selector">
        <button class="casino-chip chip-1" data-value="1">$1</button>
        <button class="casino-chip chip-5 active" data-value="5">$5</button>
        <button class="casino-chip chip-25" data-value="25">$25</button>
        <button class="casino-chip chip-50" data-value="50">$50</button>
        <button class="casino-chip chip-100" data-value="100">$100</button>
        <button class="casino-chip chip-500" data-value="500">$500</button>
        <button class="casino-chip chip-1k" data-value="1000">$1k</button>
      </div>

      <div class="craps-table">
        <!-- Pass Line / Don't Pass -->
        <div class="table-row">
          <div class="bet-area pass-line" data-bet="passLine">
            <div class="bet-label">PASS LINE</div>
            <div class="bet-amount" id="bet-passLine">$0</div>
          </div>
          <div class="bet-area dont-pass" data-bet="dontPass">
            <div class="bet-label">DON'T PASS BAR</div>
            <div class="bet-amount" id="bet-dontPass">$0</div>
          </div>
        </div>

        <!-- Field -->
        <div class="bet-area field-bet" data-bet="field">
          <div class="bet-label">FIELD (2, 3, 4, 9, 10, 11, 12) - 2:1 on 2 & 12</div>
          <div class="bet-amount" id="bet-field">$0</div>
        </div>

        <!-- Place Bets -->
        <div class="place-bets-row">
          <div class="place-label">PLACE BETS</div>
          <div class="place-numbers">
            <div class="bet-area place-bet" data-bet="place" data-number="4">
              <div class="bet-label">4</div>
              <div class="odds-label">9:5</div>
              <div class="bet-amount" id="bet-place4">$0</div>
            </div>
            <div class="bet-area place-bet" data-bet="place" data-number="5">
              <div class="bet-label">5</div>
              <div class="odds-label">7:5</div>
              <div class="bet-amount" id="bet-place5">$0</div>
            </div>
            <div class="bet-area place-bet" data-bet="place" data-number="6">
              <div class="bet-label">6</div>
              <div class="odds-label">7:6</div>
              <div class="bet-amount" id="bet-place6">$0</div>
            </div>
            <div class="bet-area place-bet" data-bet="place" data-number="8">
              <div class="bet-label">8</div>
              <div class="odds-label">7:6</div>
              <div class="bet-amount" id="bet-place8">$0</div>
            </div>
            <div class="bet-area place-bet" data-bet="place" data-number="9">
              <div class="bet-label">9</div>
              <div class="odds-label">7:5</div>
              <div class="bet-amount" id="bet-place9">$0</div>
            </div>
            <div class="bet-area place-bet" data-bet="place" data-number="10">
              <div class="bet-label">10</div>
              <div class="odds-label">9:5</div>
              <div class="bet-amount" id="bet-place10">$0</div>
            </div>
          </div>
        </div>

        <!-- Hardways -->
        <div class="hardways-row">
          <div class="hardways-label">HARDWAYS</div>
          <div class="hardways-bets">
            <div class="bet-area hardway-bet" data-bet="hardways" data-number="4">
              <div class="bet-label">Hard 4 (7:1)</div>
              <div class="bet-amount" id="bet-hard4">$0</div>
            </div>
            <div class="bet-area hardway-bet" data-bet="hardways" data-number="6">
              <div class="bet-label">Hard 6 (9:1)</div>
              <div class="bet-amount" id="bet-hard6">$0</div>
            </div>
            <div class="bet-area hardway-bet" data-bet="hardways" data-number="8">
              <div class="bet-label">Hard 8 (9:1)</div>
              <div class="bet-amount" id="bet-hard8">$0</div>
            </div>
            <div class="bet-area hardway-bet" data-bet="hardways" data-number="10">
              <div class="bet-label">Hard 10 (7:1)</div>
              <div class="bet-amount" id="bet-hard10">$0</div>
            </div>
          </div>
        </div>

        <!-- Props -->
        <div class="props-row">
          <div class="bet-area prop-bet" data-bet="anySeven">
            <div class="bet-label">ANY SEVEN (4:1)</div>
            <div class="bet-amount" id="bet-anySeven">$0</div>
          </div>
          <div class="bet-area prop-bet" data-bet="anyCraps">
            <div class="bet-label">ANY CRAPS (7:1)</div>
            <div class="bet-amount" id="bet-anyCraps">$0</div>
          </div>
          <div class="bet-area prop-bet" data-bet="horn">
            <div class="bet-label">HORN (30:1/15:1)</div>
            <div class="bet-amount" id="bet-horn">$0</div>
          </div>
        </div>
      </div>

      <div class="game-controls">
        <button class="btn btn-secondary" id="clear-bets-btn">Clear Bets</button>
        <button class="btn btn-primary" id="roll-dice-btn">Roll Dice</button>
        <div class="total-bet">Total Bet: $<span id="total-bet">0</span></div>
      </div>

      <div id="result-messages"></div>
    </div>
  `;

  // Chip selector
  container.querySelectorAll('.casino-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      container.querySelectorAll('.casino-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      chipValue = parseInt(chip.dataset.value);
    });
  });

  // Bet areas
  container.querySelectorAll('.bet-area').forEach(area => {
    area.addEventListener('click', () => {
      const betType = area.dataset.bet;
      const number = area.dataset.number ? parseInt(area.dataset.number) : null;
      
      if (wallet.getBalance() < chipValue) {
        showNotification('Insufficient balance', 'error');
        return;
      }

      if (!wallet.deductBet(chipValue)) {
        showNotification('Failed to place bet', 'error');
        return;
      }

      game.placeBet(betType, chipValue, number);
      updateBetDisplays();
    });
  });

  // Clear bets
  container.querySelector('#clear-bets-btn').addEventListener('click', () => {
    wallet.addWinnings(game.totalBet);
    game.clearBets();
    updateBetDisplays();
    showNotification('Bets cleared', 'info');
  });

  // Roll dice
  container.querySelector('#roll-dice-btn').addEventListener('click', () => {
    if (game.totalBet === 0) {
      showNotification('Place a bet first', 'error');
      return;
    }

    game.rollDice();
    const result = game.calculatePayouts();
    
    // Update dice display
    const diceDisplay = container.querySelector('#dice-display');
    diceDisplay.innerHTML = `
      <div class="die">${game.dice[0]}</div>
      <div class="die">${game.dice[1]}</div>
    `;

    // Update point
    const pointValue = container.querySelector('#point-value');
    pointValue.textContent = game.point || 'OFF';
    pointValue.style.color = game.point ? '#00ff00' : '#ff0000';

    // Add payouts to wallet
    let totalPayout = 0;
    for (let key in result.payouts) {
      totalPayout += result.payouts[key];
    }
    if (totalPayout > 0) {
      wallet.addWinnings(totalPayout);
    }

    // Show messages
    const messagesDiv = container.querySelector('#result-messages');
    messagesDiv.innerHTML = `
      <div class="roll-result">
        <div class="roll-total">Rolled: ${result.total}</div>
        ${result.messages.map(msg => `<div class="result-message">${msg}</div>`).join('')}
      </div>
    `;

    // Clear one-roll bets
    game.bets.field = 0;
    game.bets.anySeven = 0;
    game.bets.anyCraps = 0;
    game.bets.horn = 0;

    // Clear resolved bets based on clearBets flag
    if (result.clearBets.passLine) {
      game.bets.passLine = 0;
    }
    if (result.clearBets.dontPass) {
      game.bets.dontPass = 0;
    }

    game.totalBet = 0;
    for (let key in game.bets) {
      if (typeof game.bets[key] === 'object') {
        for (let num in game.bets[key]) {
          game.totalBet += game.bets[key][num];
        }
      } else {
        game.totalBet += game.bets[key];
      }
    }

    updateBetDisplays();
    onBalanceUpdated();

    setTimeout(() => {
      messagesDiv.innerHTML = '';
    }, 5000);
  });

  function updateBetDisplays() {
    container.querySelector('#bet-passLine').textContent = `$${game.bets.passLine}`;
    container.querySelector('#bet-dontPass').textContent = `$${game.bets.dontPass}`;
    container.querySelector('#bet-field').textContent = `$${game.bets.field}`;
    container.querySelector('#bet-anySeven').textContent = `$${game.bets.anySeven}`;
    container.querySelector('#bet-anyCraps').textContent = `$${game.bets.anyCraps}`;
    container.querySelector('#bet-horn').textContent = `$${game.bets.horn}`;

    for (let num in game.bets.place) {
      container.querySelector(`#bet-place${num}`).textContent = `$${game.bets.place[num]}`;
    }

    for (let num in game.bets.hardways) {
      container.querySelector(`#bet-hard${num}`).textContent = `$${game.bets.hardways[num]}`;
    }

    container.querySelector('#total-bet').textContent = game.totalBet.toFixed(2);
  }

  updateBetDisplays();
}
