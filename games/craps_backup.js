/**
 * Craps Game Module
 * Two six-sided dice, state machine for Point Off/Point On phases
 */

class CrapsGame {
  constructor() {
    this.dice = [0, 0];
    this.point = null;
    this.bet = 0;
    this.gameState = 'betting'; // betting, comeOut, onPoint, finished
    this.lastRoll = null;
    this.result = null;
  }

  /**
   * Roll two dice
   */
  rollDice() {
    this.dice = [randomInt(1, 6), randomInt(1, 6)];
    return this.dice;
  }

  /**
   * Get total of dice
   */
  getDiceTotal() {
    return this.dice[0] + this.dice[1];
  }

  /**
   * Come Out roll (Point Off phase)
   */
  comeOutRoll(bet) {
    if (!wallet.deductBet(bet)) {
      return false;
    }

    this.bet = bet;
    this.rollDice();
    const total = this.getDiceTotal();
    this.lastRoll = total;

    if (total === 7 || total === 11) {
      this.result = 'win';
      this.gameState = 'finished';
      wallet.addWinnings(this.bet * 2);
      return { status: 'win', message: `Craps Win! Rolled ${total}` };
    } else if (total === 2 || total === 3 || total === 12) {
      this.result = 'loss';
      this.gameState = 'finished';
      return { status: 'loss', message: `Craps Loss! Rolled ${total}` };
    } else {
      this.point = total;
      this.gameState = 'onPoint';
      return { status: 'point', message: `Point is ${total}. Roll again!` };
    }
  }

  /**
   * Roll while Point On
   */
  pointRoll() {
    this.rollDice();
    const total = this.getDiceTotal();
    this.lastRoll = total;

    if (total === this.point) {
      this.result = 'win';
      this.gameState = 'finished';
      wallet.addWinnings(this.bet * 2);
      return { status: 'win', message: `Point Made! Rolled ${total}. You win!` };
    } else if (total === 7) {
      this.result = 'loss';
      this.gameState = 'finished';
      return { status: 'loss', message: `Seven Out! Rolled 7. You lose.` };
    } else {
      return { status: 'continue', message: `Rolled ${total}. Point still ${this.point}.` };
    }
  }

  /**
   * Get current game state for display
   */
  getState() {
    return {
      phase: this.gameState,
      point: this.point,
      lastDice: this.dice,
      lastRoll: this.lastRoll
    };
  }
}

/**
 * Craps UI
 */
function launchCraps(container) {
  let game = new CrapsGame();
  window.game = game;

  container.innerHTML = `
    <div class="craps-container">
      <h3 style="color: #ffd700; margin-bottom: 20px;">Craps</h3>
      
      <div id="bet-section">
        <div style="text-align: center; margin-bottom: 20px;">
          <label style="font-size: 1.1em; display: block; margin-bottom: 10px;">Enter Your Bet:</label>
          <input type="number" id="bet-amount" placeholder="Amount" min="1" max="1000">
        </div>
        <div class="game-controls">
          <button class="btn btn-deal" id="roll-btn" style="width: 200px;">Roll Dice (Come Out)</button>
        </div>
        <div class="quick-bets" style="margin-top: 15px; justify-content: center;">
          <button class="quick-bet-btn" data-amount="10">$10</button>
          <button class="quick-bet-btn" data-amount="50">$50</button>
          <button class="quick-bet-btn" data-amount="100">$100</button>
        </div>
      </div>

      <div id="game-area" style="display: none;">
        <div style="text-align: center;">
          <div class="dice-display" id="dice-display">🎲 🎲</div>
          <div class="dice-value" id="dice-value">Total: -</div>
          
          <div class="point-display" id="point-display" style="display: none;">
            <span style="color: #ffd700;">Point: <span id="point-value">-</span></span>
          </div>

          <div class="game-status" id="game-status" style="margin: 30px 0;">-</div>

          <div class="game-controls">
            <button class="btn btn-hit" id="continue-roll-btn" style="width: 200px;">Roll Again</button>
            <button class="btn btn-primary" id="new-game-btn" style="display: none; width: 200px;">New Game</button>
          </div>

          <div id="result-area" style="margin-top: 30px;"></div>
        </div>
      </div>
    </div>
  `;

  const betInput = container.querySelector('#bet-amount');
  const rollBtn = container.querySelector('#roll-btn');
  const gameArea = container.querySelector('#game-area');
  const betSection = container.querySelector('#bet-section');
  const continueRollBtn = container.querySelector('#continue-roll-btn');
  const newGameBtn = container.querySelector('#new-game-btn');
  const quickBetBtns = container.querySelectorAll('.quick-bet-btn');

  // Quick bets
  quickBetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      betInput.value = btn.dataset.amount;
    });
  });

  // Initial roll (Come Out)
  rollBtn.addEventListener('click', () => {
    const bet = parseInt(betInput.value);
    if (!bet || bet <= 0 || bet > wallet.getBalance()) {
      showNotification('Invalid bet amount', 'error');
      return;
    }

    const rollResult = game.comeOutRoll(bet);
    if (!rollResult) {
      showNotification('Failed to place bet', 'error');
      return;
    }

    betSection.style.display = 'none';
    gameArea.style.display = 'block';
    updateDisplay(rollResult);
  });

  // Continue rolling (Point On)
  continueRollBtn.addEventListener('click', () => {
    const rollResult = game.pointRoll();
    updateDisplay(rollResult);
  });

  // New game
  newGameBtn.addEventListener('click', () => {
    game = new CrapsGame();
    betSection.style.display = 'block';
    gameArea.style.display = 'none';
    betInput.value = '';
    continueRollBtn.style.display = 'inline-block';
    newGameBtn.style.display = 'none';
    container.querySelector('#result-area').innerHTML = '';
  });

  function updateDisplay(rollResult) {
    const diceDisplay = container.querySelector('#dice-display');
    const diceValue = container.querySelector('#dice-value');
    const pointDisplay = container.querySelector('#point-display');
    const pointValue = container.querySelector('#point-value');
    const gameStatus = container.querySelector('#game-status');
    const resultArea = container.querySelector('#result-area');

    // Display dice
    const dice1 = game.dice[0];
    const dice2 = game.dice[1];
    diceDisplay.textContent = `${getDiceEmoji(dice1)} ${getDiceEmoji(dice2)}`;
    diceValue.textContent = `Total: ${game.getDiceTotal()}`;

    // Update point display
    if (game.point) {
      pointDisplay.style.display = 'block';
      pointValue.textContent = game.point;
    }

    // Update status
    gameStatus.textContent = rollResult.message;

    // Show result if game finished
    if (rollResult.status === 'win' || rollResult.status === 'loss') {
      continueRollBtn.style.display = 'none';
      newGameBtn.style.display = 'inline-block';

      const isWin = rollResult.status === 'win';
      const resultClass = isWin ? 'win' : 'loss';
      const payout = isWin ? game.bet * 2 : 0;
      const netGain = isWin ? game.bet : 0;
      const amountText = isWin ? `Net Gain: +$${netGain}` : 'No payout';

      resultArea.innerHTML = `
        <div class="game-result ${resultClass}">
          <div class="result-title">${isWin ? 'You Win!' : 'You Lose!'}</div>
          <div class="result-amount ${isWin ? 'positive' : 'negative'}">${amountText}</div>
          <div style="margin-top: 10px;">New Balance: ${wallet.formatBalance()}</div>
        </div>
      `;

      onBalanceUpdated();
    }
  }

  function getDiceEmoji(num) {
    const emojis = ['', '🎲', '🎲', '🎲', '🎲', '🎲', '🎲'];
    return emojis[num] || '🎲';
  }
}
