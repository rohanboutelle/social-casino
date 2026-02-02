/**
 * Baccarat Game Module
 * Scoring: Sum of cards modulo 10
 * Third Card Rules (Tableau) implemented
 */

class BaccaratGame {
  constructor() {
    this.deck = [];
    this.playerHand = [];
    this.bankerHand = [];
    this.playerBet = 0;
    this.bankerBet = 0;
    this.tieBet = 0;
    this.gameState = 'betting'; // betting, dealing, result
  }

  /**
   * Calculate hand score (sum mod 10)
   */
  calculateScore(cards) {
    let total = 0;
    for (let card of cards) {
      if (card.rank === 'A') {
        total += 1;
      } else if (card.rank === 'J' || card.rank === 'Q' || card.rank === 'K') {
        total += 0;
      } else {
        total += parseInt(card.rank);
      }
    }
    return total % 10;
  }

  /**
   * Banker decision: Should banker draw a third card?
   * Based on Tableau (Third Card Rules)
   */
  shouldBankerDraw(bankerCards, playerCards) {
    const bankerScore = this.calculateScore(bankerCards);
    const playerScore = this.calculateScore(playerCards);

    // If player doesn't have 3 cards, banker uses simple rule
    if (playerCards.length < 3) {
      return bankerScore < 6;
    }

    // Player's third card
    const playerThirdCard = playerCards[2];
    const playerThirdRank = playerThirdCard.rank === 'A' ? 1 : 
                           (playerThirdCard.rank === 'J' || playerThirdCard.rank === 'Q' || playerThirdCard.rank === 'K') ? 0 :
                           parseInt(playerThirdCard.rank);

    // Banker score rules
    if (bankerScore <= 2) return true;
    if (bankerScore === 3) return playerThirdRank !== 8;
    if (bankerScore === 4) return playerThirdRank >= 2 && playerThirdRank <= 7;
    if (bankerScore === 5) return playerThirdRank >= 4 && playerThirdRank <= 7;
    if (bankerScore === 6) return playerThirdRank >= 6 && playerThirdRank <= 7;
    return false;
  }

  /**
   * Initialize game with bets
   */
  startGame(playerBet, bankerBet, tieBet) {
    const totalBet = playerBet + bankerBet + tieBet;
    if (totalBet <= 0) {
      return false;
    }

    // Money was already deducted when placing bets on zones
    this.playerBet = playerBet;
    this.bankerBet = bankerBet;
    this.tieBet = tieBet;
    this.deck = createDeck();
    this.playerHand = [];
    this.bankerHand = [];

    // Deal: Player, Banker, Player, Banker
    this.playerHand.push(this.deck.shift());
    this.bankerHand.push(this.deck.shift());
    this.playerHand.push(this.deck.shift());
    this.bankerHand.push(this.deck.shift());

    // Check for third card
    const playerScore = this.calculateScore(this.playerHand);
    if (playerScore < 6) {
      if (this.deck.length < 5) this.deck = createDeck();
      this.playerHand.push(this.deck.shift());
    }

    // Banker's decision
    if (this.shouldBankerDraw(this.bankerHand, this.playerHand)) {
      if (this.deck.length < 5) this.deck = createDeck();
      this.bankerHand.push(this.deck.shift());
    }

    this.gameState = 'result';
    return true;
  }

  /**
   * Determine winner and payouts
   */
  determineWinner() {
    const playerScore = this.calculateScore(this.playerHand);
    const bankerScore = this.calculateScore(this.bankerHand);

    let playerPayout = 0;
    let bankerPayout = 0;
    let tiePayout = 0;
    let result = '';

    if (playerScore > bankerScore) {
      playerPayout = this.playerBet * 2;
      result = 'Player';
    } else if (bankerScore > playerScore) {
      bankerPayout = Math.round(this.bankerBet * 1.95 * 100) / 100; // 5% commission, rounded to cents
      result = 'Banker';
    } else {
      tiePayout = this.tieBet * 9;
      playerPayout = this.playerBet;
      bankerPayout = this.bankerBet;
      result = 'Tie';
    }

    const totalPayout = playerPayout + bankerPayout + tiePayout;
    if (totalPayout > 0) {
      wallet.addWinnings(totalPayout);
    }

    return {
      playerScore,
      bankerScore,
      result,
      playerPayout,
      bankerPayout,
      tiePayout,
      totalPayout
    };
  }
}

/**
 * Baccarat UI
 */
function launchBaccarat(container) {
  let game = new BaccaratGame();
  window.game = game;
  let chipValue = 5;

  container.innerHTML = `
    <div class="baccarat-container">
      <h3 style="color: #ffd700; margin-bottom: 20px;">Baccarat - Select Your Bet</h3>
      
      <div id="bet-selection" class="bet-input-section">
        <div style="text-align: center; margin-bottom: 10px; color: #ffd700; font-size: 1.1em;">
          Selected Chip: <span id="pending-bet">$5</span>
        </div>
        <div class="chip-selector" style="margin-bottom: 20px;">
          <button class="casino-chip chip-1" data-value="1">$1</button>
          <button class="casino-chip chip-5 active" data-value="5">$5</button>
          <button class="casino-chip chip-25" data-value="25">$25</button>
          <button class="casino-chip chip-50" data-value="50">$50</button>
          <button class="casino-chip chip-100" data-value="100">$100</button>
          <button class="casino-chip chip-500" data-value="500">$500</button>
          <button class="casino-chip chip-1k" data-value="1000">$1k</button>
        </div>
        <div style="text-align: center; margin-bottom: 15px; color: #ffd700; font-size: 1.1em;">Select a chip, then click a bet area to add it</div>
        <div class="baccarat-bet-areas">
          <div class="bet-zone" data-bet="player">
            <div class="bet-zone-label">Player Bet</div>
            <div class="bet-zone-amount" id="player-bet-amount">$0</div>
          </div>
          <div class="bet-zone" data-bet="banker">
            <div class="bet-zone-label">Banker Bet</div>
            <div class="bet-zone-amount" id="banker-bet-amount">$0</div>
          </div>
          <div class="bet-zone" data-bet="tie">
            <div class="bet-zone-label">Tie Bet</div>
            <div class="bet-zone-amount" id="tie-bet-amount">$0</div>
          </div>
        </div>
        <div style="display: flex; gap: 15px; justify-content: center; margin-top: 20px;">
          <button class="btn btn-secondary" id="clear-bets-btn">Clear Bets</button>
          <button class="btn btn-primary" id="deal-btn">Deal</button>
        </div>
      </div>

      <div id="game-area" style="display: none;">
        <div class="baccarat-hands">
          <div class="baccarat-hand">
            <h4>🤖 Banker</h4>
            <div id="banker-cards" class="cards-row"></div>
            <div class="hand-total" id="banker-score">Score: -</div>
          </div>
          <div class="baccarat-hand">
            <h4>👤 Player</h4>
            <div id="player-cards" class="cards-row"></div>
            <div class="hand-total" id="player-score">Score: -</div>
          </div>
        </div>

        <div id="result-area"></div>

        <div class="game-controls">
          <button class="btn btn-primary" id="play-again-btn">Play Again</button>
        </div>
      </div>
    </div>
  `;

  const dealBtn = container.querySelector('#deal-btn');
  const clearBetsBtn = container.querySelector('#clear-bets-btn');
  const gameArea = container.querySelector('#game-area');
  const betSelection = container.querySelector('#bet-selection');
  const playAgainBtn = container.querySelector('#play-again-btn');
  
  let playerBet = 0;
  let bankerBet = 0;
  let tieBet = 0;

  // Chip selector
  container.querySelectorAll('.casino-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      container.querySelectorAll('.casino-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      chipValue = parseInt(chip.dataset.value, 10);
      container.querySelector('#pending-bet').textContent = `$${chipValue}`;
    });
  });

  // Bet zones
  container.querySelectorAll('.bet-zone').forEach(zone => {
    zone.addEventListener('click', () => {
      const betType = zone.dataset.bet;
      
      if (wallet.getBalance() < chipValue) {
        showNotification('Insufficient funds', 'error');
        return;
      }

      if (!wallet.deductBet(chipValue)) {
        showNotification('Failed to place bet', 'error');
        return;
      }

      if (betType === 'player') {
        playerBet += chipValue;
        container.querySelector('#player-bet-amount').textContent = `$${playerBet}`;
      } else if (betType === 'banker') {
        bankerBet += chipValue;
        container.querySelector('#banker-bet-amount').textContent = `$${bankerBet}`;
      } else if (betType === 'tie') {
        tieBet += chipValue;
        container.querySelector('#tie-bet-amount').textContent = `$${tieBet}`;
      }
    });
  });

  clearBetsBtn.addEventListener('click', () => {
    wallet.addWinnings(playerBet + bankerBet + tieBet);
    playerBet = 0;
    bankerBet = 0;
    tieBet = 0;
    container.querySelector('#player-bet-amount').textContent = '$0';
    container.querySelector('#banker-bet-amount').textContent = '$0';
    container.querySelector('#tie-bet-amount').textContent = '$0';
    showNotification('Bets cleared', 'info');
  });

  dealBtn.addEventListener('click', () => {
    if (playerBet + bankerBet + tieBet <= 0) {
      showNotification('Place at least one bet', 'error');
      return;
    }

    if (!game.startGame(playerBet, bankerBet, tieBet)) {
      showNotification('Insufficient balance', 'error');
      return;
    }

    betSelection.style.display = 'none';
    gameArea.style.display = 'block';

    updateDisplay();
    setTimeout(() => {
      showResult();
    }, 1000);
  });

  playAgainBtn.addEventListener('click', () => {
    game = new BaccaratGame();
    window.game = game;
    betSelection.style.display = 'block';
    gameArea.style.display = 'none';
    playerBet = 0;
    bankerBet = 0;
    tieBet = 0;
    chipValue = 5;
    container.querySelector('#player-bet-amount').textContent = '$0';
    container.querySelector('#banker-bet-amount').textContent = '$0';
    container.querySelector('#tie-bet-amount').textContent = '$0';
    container.querySelector('#pending-bet').textContent = '$5';
    container.querySelectorAll('.casino-chip').forEach(c => c.classList.remove('active'));
    container.querySelector('.chip-5').classList.add('active');
    container.querySelector('#result-area').innerHTML = '';
  });

  function updateDisplay() {
    const bankerCards = container.querySelector('#banker-cards');
    const playerCards = container.querySelector('#player-cards');
    const bankerScore = container.querySelector('#banker-score');
    const playerScore = container.querySelector('#player-score');

    bankerCards.innerHTML = game.bankerHand.map(card => getCardHTML(card)).join('');
    playerCards.innerHTML = game.playerHand.map(card => getCardHTML(card)).join('');

    bankerScore.textContent = `Score: ${game.calculateScore(game.bankerHand)}`;
    playerScore.textContent = `Score: ${game.calculateScore(game.playerHand)}`;
  }

  function showResult() {
    const result = game.determineWinner();
    const resultArea = container.querySelector('#result-area');

    let resultText = '';
    if (result.result === 'Player') {
      resultText = `<span style="color: #4caf50;">Player Wins!</span><br>Player: ${result.playerScore} | Banker: ${result.bankerScore}`;
    } else if (result.result === 'Banker') {
      resultText = `<span style="color: #4caf50;">Banker Wins!</span><br>Banker: ${result.bankerScore} | Player: ${result.playerScore}`;
    } else {
      resultText = `<span style="color: #ff9800;">Tie!</span><br>Both: ${result.playerScore}`;
    }

    let payoutText = '';
    
    if (result.result === 'Tie') {
      // Show pushes for player/banker bets, and actual payout for tie bet
      if (result.playerPayout > 0) {
        payoutText += `Player Bet: Push (returned $${game.playerBet})<br>`;
      }
      if (result.bankerPayout > 0) {
        payoutText += `Banker Bet: Push (returned $${game.bankerBet})<br>`;
      }
      if (result.tiePayout > 0) {
        const tieProfit = result.tiePayout - game.tieBet;
        payoutText += `Tie Bet Wins: +$${tieProfit}<br>`;
      }
      if (!result.playerPayout && !result.bankerPayout && !result.tiePayout) {
        payoutText = 'No bets placed';
      }
    } else {
      // Normal win/loss display
      if (result.playerPayout > 0) {
        const profit = result.playerPayout - game.playerBet;
        payoutText += `Player Payout: +$${profit}<br>`;
      }
      if (result.bankerPayout > 0) {
        const profit = result.bankerPayout - game.bankerBet;
        payoutText += `Banker Payout: +$${profit}<br>`;
      }
      if (result.totalPayout === 0) {
        payoutText = 'No payout';
      }
    }

    resultArea.innerHTML = `
      <div class="game-result ${result.result === 'Tie' ? 'tie' : 'win'}">
        <div class="result-title">${resultText}</div>
        <div style="margin-top: 15px; font-size: 1.1em;">
          ${payoutText}
        </div>
        <div style="margin-top: 15px;">New Balance: ${wallet.formatBalance()}</div>
      </div>
    `;

    onBalanceUpdated();
  }
}
