/**
 * Blackjack Game Module
 * Standard 52-card deck, Dealer hits on 16, stands on 17 (Soft 17 rule)
 */

class BlackjackGame {
  constructor() {
    this.deck = [];
    this.playerHand = [];
    this.dealerHand = [];
    this.playerBet = 0;
    this.gameState = 'betting'; // betting, playing, dealerTurn, finished
    this.playerBlackjack = false;
    this.dealerBlackjack = false;
  }

  /**
   * Calculate hand total, treating Aces as 1 or 11
   */
  calculateHand(cards) {
    let total = 0;
    let aces = 0;

    for (let card of cards) {
      if (card.rank === 'A') {
        aces++;
        total += 11;
      } else {
        total += card.value;
      }
    }

    // Adjust for aces if bust
    while (total > 21 && aces > 0) {
      total -= 10;
      aces--;
    }

    return total;
  }

  /**
   * Check if hand is natural blackjack (21 with 2 cards)
   */
  isNatural(cards) {
    return cards.length === 2 && this.calculateHand(cards) === 21;
  }

  /**
   * Dealer AI: Hit on 16 or less, Stand on Hard 17+
   * Dealer hits on Soft 17 (Ace + 6)
   */
  dealerShouldHit(cards) {
    let total = 0;
    let aces = 0;

    for (let card of cards) {
      if (card.rank === 'A') {
        aces++;
        total += 11;
      } else {
        total += card.value;
      }
    }

    while (total > 21 && aces > 0) {
      total -= 10;
      aces--;
    }

    // Hit on 16 or less, or soft 17
    if (total < 17) return true;
    if (total === 17 && aces > 0) return true; // Soft 17
    return false;
  }

  /**
   * Initialize new game
   */
  startGame(bet, skipDeduct = false) {
    // Money is already deducted when clicking Place Bet button
    this.playerBet = bet;
    this.deck = createDeck();
    this.playerHand = [];
    this.dealerHand = [];
    this.gameState = 'playing';
    this.playerBlackjack = false;
    this.dealerBlackjack = false;

    // Deal initial cards
    this.playerHand.push(this.deck.shift());
    this.dealerHand.push(this.deck.shift());
    this.playerHand.push(this.deck.shift());
    this.dealerHand.push(this.deck.shift());
    
    // Reshuffle if deck is low
    if (this.deck.length < 10) {
      this.deck = createDeck();
    }

    // Check for naturals
    this.playerBlackjack = this.isNatural(this.playerHand);
    this.dealerBlackjack = this.isNatural(this.dealerHand);

    return true;
  }

  /**
   * Player hits
   */
  playerHit() {
    if (this.deck.length < 5) {
      this.deck = createDeck();
    }
    this.playerHand.push(this.deck.shift());
    
    if (this.calculateHand(this.playerHand) > 21) {
      this.gameState = 'finished';
      return 'bust';
    }
    return 'ok';
  }

  /**
   * Player stands
   */
  playerStand() {
    this.gameState = 'dealerTurn';
    return this.playDealerTurn();
  }

  /**
   * Dealer plays their hand
   */
  playDealerTurn() {
    while (this.dealerShouldHit(this.dealerHand)) {
      if (this.deck.length < 5) {
        this.deck = createDeck();
      }
      this.dealerHand.push(this.deck.shift());
    }

    this.gameState = 'finished';
    return this.determineWinner();
  }

  /**
   * Determine game outcome
   */
  determineWinner() {
    const playerTotal = this.calculateHand(this.playerHand);
    const dealerTotal = this.calculateHand(this.dealerHand);

    // Player bust
    if (playerTotal > 21) {
      return { result: 'loss', message: 'Bust! You lose.', payout: 0 };
    }

    // Dealer bust
    if (dealerTotal > 21) {
      const payout = this.playerBet * 2;
      wallet.addWinnings(payout);
      return { result: 'win', message: 'Dealer bust! You win!', payout: payout };
    }

    // Both naturals
    if (this.playerBlackjack && this.dealerBlackjack) {
      const payout = this.playerBet;
      wallet.addWinnings(payout);
      return { result: 'tie', message: 'Both blackjack! Push.', payout: payout };
    }

    // Player natural
    if (this.playerBlackjack) {
      const payout = Math.round(this.playerBet * 2.5 * 100) / 100;
      wallet.addWinnings(payout);
      return { result: 'win', message: 'Blackjack! You win!', payout: payout };
    }

    // Dealer natural
    if (this.dealerBlackjack) {
      return { result: 'loss', message: 'Dealer blackjack. You lose.', payout: 0 };
    }

    // Compare totals
    if (playerTotal > dealerTotal) {
      const payout = this.playerBet * 2;
      wallet.addWinnings(payout);
      return { result: 'win', message: `You win! ${playerTotal} vs ${dealerTotal}`, payout: payout };
    } else if (playerTotal < dealerTotal) {
      return { result: 'loss', message: `You lose. ${playerTotal} vs ${dealerTotal}`, payout: 0 };
    } else {
      const payout = this.playerBet;
      wallet.addWinnings(payout);
      return { result: 'tie', message: `Push! Both have ${playerTotal}`, payout: payout };
    }
  }
}

/**
 * Blackjack UI and Game Loop
 */
function launchBlackjack(container) {
  let game = new BlackjackGame();
  window.game = game;
  let chipValue = 5;
  let currentBet = 0;

  container.innerHTML = `
    <div class="blackjack-container">
      <div class="blackjack-section">
        <h3>Blackjack</h3>
        <div class="bet-input-section" id="bet-section">
          <div style="text-align: center; margin-bottom: 15px;">
            <div style="font-size: 1.3em; color: var(--accent-color); margin-bottom: 10px;">
              Select Your Bet: <span id="selected-bet">$0</span>
            </div>
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
          <div style="display: flex; gap: 12px; justify-content: center; margin-top: 15px;">
            <button class="btn btn-secondary" id="clear-bet-btn">Clear Bet</button>
            <button class="btn btn-primary" id="deal-btn">Deal</button>
          </div>
        </div>
        <div id="game-area" style="display: none;">
          <div class="blackjack-section">
            <h3>Dealer's Hand</h3>
            <div class="hand-display">
              <div id="dealer-cards" class="cards-row"></div>
              <div class="hand-total" id="dealer-total">Total: -</div>
            </div>
          </div>

          <div class="blackjack-section">
            <h3>Your Hand</h3>
            <div class="hand-display">
              <div id="player-cards" class="cards-row"></div>
              <div class="hand-total" id="player-total">Total: -</div>
            </div>
          </div>

          <div class="game-controls">
            <button class="btn btn-hit" id="hit-btn">Hit</button>
            <button class="btn btn-stand" id="stand-btn">Stand</button>
            <button class="btn btn-double" id="double-btn" disabled>Double</button>
            <button class="btn btn-split" id="split-btn" disabled>Split</button>
            <button class="btn btn-primary" id="new-hand-btn" style="display: none;">New Hand</button>
          </div>

          <div id="result-area"></div>
        </div>
      </div>
    </div>
  `;

  const clearBetBtn = container.querySelector('#clear-bet-btn');
  const dealBtn = container.querySelector('#deal-btn');
  const chipBtns = container.querySelectorAll('.casino-chip');
  const selectedBetDisplay = container.querySelector('#selected-bet');
  const gameArea = container.querySelector('#game-area');
  const hitBtn = container.querySelector('#hit-btn');
  const standBtn = container.querySelector('#stand-btn');
  const doubleBtn = container.querySelector('#double-btn');
  const splitBtn = container.querySelector('#split-btn');
  const newHandBtn = container.querySelector('#new-hand-btn');

  // Chip selection - directly adds to bet
  chipBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const chipValue = parseInt(btn.dataset.value, 10);
      if (!wallet.deductBet(chipValue)) {
        showNotification('Insufficient funds', 'error');
        return;
      }
      chipBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentBet += chipValue;
      selectedBetDisplay.textContent = `$${currentBet}`;
    });
  });

  // Clear bet
  clearBetBtn.addEventListener('click', () => {
    if (currentBet > 0) {
      wallet.addWinnings(currentBet);
    }
    currentBet = 0;
    selectedBetDisplay.textContent = '$0';
  });

  // Deal
  dealBtn.addEventListener('click', () => {
    if (!currentBet || currentBet <= 0) {
      showNotification('Place a bet first', 'error');
      return;
    }

    if (!game.startGame(currentBet, true)) {
      showNotification('Insufficient funds', 'error');
      return;
    }

    container.querySelector('#bet-section').style.display = 'none';
    gameArea.style.display = 'block';
    updateDisplay();

    // Check for dealer blackjack if dealer shows 10 or Ace
    const dealerUpCard = game.dealerHand[0];
    if ((dealerUpCard.value === 10 || dealerUpCard.rank === 'A') && game.dealerBlackjack) {
      // Dealer has blackjack, reveal immediately
      setTimeout(() => {
        game.gameState = 'dealerTurn';
        updateDisplay();
        const result = game.determineWinner();
        showResult(result);
      }, 800);
      return;
    }
    
    // Check for player blackjack
    if (game.playerBlackjack) {
      setTimeout(() => {
        const result = game.playDealerTurn();
        updateDisplay();
        showResult(result);
      }, 800);
    }
  });

  // Hit button
  hitBtn.addEventListener('click', () => {
    const status = game.playerHit();
    updateDisplay();

    if (status === 'bust') {
      game.gameState = 'dealerTurn';
      setTimeout(() => {
        updateDisplay();
        showResult({ result: 'loss', message: 'Bust! You lose.', payout: 0 });
      }, 600);
    }
  });

  // Stand button
  standBtn.addEventListener('click', () => {
    // Flip dealer's hole card with animation
    game.gameState = 'dealerTurn';
    updateDisplay();
    
    setTimeout(() => {
      const result = game.playerStand();
      updateDisplay();
      showResult(result);
    }, 600);
  });

  // Double button
  doubleBtn.addEventListener('click', () => {
    if (!canDouble()) {
      showNotification('Cannot double down', 'error');
      return;
    }
    
    if (!wallet.deductBet(game.playerBet)) {
      showNotification('Insufficient balance to double', 'error');
      return;
    }
    
    game.playerBet *= 2;
    const status = game.playerHit();
    updateDisplay();
    
    // Flip hole card and resolve
    game.gameState = 'dealerTurn';
    setTimeout(() => {
      updateDisplay();
      if (status === 'bust') {
        showResult({ result: 'loss', message: 'Bust! You lose.', payout: 0 });
      } else {
        const result = game.playerStand();
        updateDisplay();
        showResult(result);
      }
    }, 600);
  });

  // Split button
  splitBtn.addEventListener('click', () => {
    showNotification('Split feature coming soon', 'info');
  });

  // New hand button
  newHandBtn.addEventListener('click', () => {
    game = new BlackjackGame();
    window.game = game;
    container.querySelector('#bet-section').style.display = 'flex';
    gameArea.style.display = 'none';
    container.querySelector('#result-area').innerHTML = '';
    currentBet = 0;
    chipValue = 5;
    selectedBetDisplay.textContent = '$0';
    chipBtns.forEach(b => b.classList.remove('active'));
    hitBtn.style.display = 'inline-block';
    standBtn.style.display = 'inline-block';
    doubleBtn.style.display = 'inline-block';
    splitBtn.style.display = 'inline-block';
    hitBtn.disabled = false;
    standBtn.disabled = false;
    doubleBtn.disabled = true;
    splitBtn.disabled = true;
    newHandBtn.style.display = 'none';
  });

  function canDouble() {
    // Can double only on initial 2 cards
    return game.playerHand.length === 2;
  }

  function canSplit() {
    // Can split if first two cards have same rank
    return game.playerHand.length === 2 && 
           game.playerHand[0].rank === game.playerHand[1].rank;
  }

  function updateDisplay() {
    const dealerCards = container.querySelector('#dealer-cards');
    const playerCards = container.querySelector('#player-cards');
    const dealerTotal = container.querySelector('#dealer-total');
    const playerTotal = container.querySelector('#player-total');

    // Show dealer cards: first card face up, second card face down during play
    if (game.gameState === 'playing') {
      dealerCards.innerHTML = getCardHTML(game.dealerHand[0]) + '<div class="card card-back">🂠</div>';
      dealerTotal.textContent = `Total: ${game.calculateHand([game.dealerHand[0]])}+?`;
    } else {
      dealerCards.innerHTML = game.dealerHand.map(card => getCardHTML(card)).join('');
      dealerTotal.textContent = `Total: ${game.calculateHand(game.dealerHand)}`;
    }
    
    playerCards.innerHTML = game.playerHand.map(card => getCardHTML(card)).join('');

    playerTotal.textContent = `Total: ${game.calculateHand(game.playerHand)}`;

    // Disable/enable buttons
    const isPlaying = game.gameState === 'playing';
    hitBtn.disabled = !isPlaying;
    standBtn.disabled = !isPlaying;
    doubleBtn.disabled = !isPlaying || !canDouble();
    splitBtn.disabled = !isPlaying || !canSplit();
  }

  function showResult(result) {
    hitBtn.style.display = 'none';
    standBtn.style.display = 'none';
    newHandBtn.style.display = 'inline-block';

    const resultArea = container.querySelector('#result-area');
    const resultClass = result.result === 'win' ? 'win' : result.result === 'loss' ? 'loss' : 'tie';
    const netGain = result.payout > 0 ? result.payout - game.playerBet : 0;
    const amountText = result.payout > 0 ? `Net Gain: +$${netGain}` : 'No payout';

    resultArea.innerHTML = `
      <div class="game-result ${resultClass}">
        <div class="result-title">${result.message}</div>
        <div class="result-amount ${result.payout > 0 ? 'positive' : 'negative'}">${amountText}</div>
        <div style="margin-top: 10px;">New Balance: ${wallet.formatBalance()}</div>
      </div>
    `;

    onBalanceUpdated();
  }
}
