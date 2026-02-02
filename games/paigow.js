/**
 * Pai Gow Poker Game Module
 * 7-card deal, split into 5-card High Hand and 2-card Low Hand
 * House Way bot strategy
 */

class PaiGowGame {
  constructor() {
    this.deck = [];
    this.playerCards = [];
    this.dealerCards = [];
    this.playerHighHand = [];
    this.playerLowHand = [];
    this.dealerHighHand = [];
    this.dealerLowHand = [];
    this.bet = 0;
    this.gameState = 'betting'; // betting, dealing, splitting, result
  }

  /**
   * Poker hand rankings
   */
  getHandRank(cards) {
    cards.sort((a, b) => {
      const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
      return ranks.indexOf(b.rank) - ranks.indexOf(a.rank);
    });

    const ranks = cards.map(c => c.rank);
    const values = cards.map(c => {
      const rankMap = { 'A': 14, 'K': 13, 'Q': 12, 'J': 11 };
      return rankMap[c.rank] !== undefined ? rankMap[c.rank] : parseInt(c.rank);
    });

    // Suits for flush check
    const suits = cards.map(c => c.suit);
    const isFlush = suits.every(s => s === suits[0]);

    // Check for straights
    const sortedVals = [...values].sort((a, b) => b - a);
    let isStraight = false;
    if (sortedVals[0] - sortedVals[4] === 4 && new Set(sortedVals).size === 5) {
      isStraight = true;
    }
    // Ace-low straight (A-2-3-4-5)
    if (JSON.stringify(sortedVals.sort((a, b) => a - b)) === JSON.stringify([2, 3, 4, 5, 14])) {
      isStraight = true;
    }

    // Count pairs
    const counts = {};
    ranks.forEach(r => counts[r] = (counts[r] || 0) + 1);
    const countArray = Object.values(counts).sort((a, b) => b - a);

    // Determine hand type
    if (countArray[0] === 5) return 8; // Five of a kind (with wild)
    if (countArray[0] === 4) return 7; // Four of a kind
    if (countArray[0] === 3 && countArray[1] === 2) return 6; // Full house
    if (isFlush) return 5; // Flush
    if (isStraight) return 4; // Straight
    if (countArray[0] === 3) return 3; // Three of a kind
    if (countArray[0] === 2 && countArray[1] === 2) return 2; // Two pair
    if (countArray[0] === 2) return 1; // One pair
    return 0; // High card
  }

  /**
   * Compare two poker hands (5-card or 2-card)
   * Returns 1 if hand1 wins, -1 if hand2 wins, 0 if tie
   */
  compareHands(hand1, hand2) {
    const rank1 = this.getHandRank(hand1);
    const rank2 = this.getHandRank(hand2);

    if (rank1 !== rank2) {
      return rank1 > rank2 ? 1 : -1;
    }

    // If same rank, compare high cards
    const vals1 = hand1.map(c => {
      const rankMap = { 'A': 14, 'K': 13, 'Q': 12, 'J': 11 };
      return rankMap[c.rank] !== undefined ? rankMap[c.rank] : parseInt(c.rank);
    }).sort((a, b) => b - a);

    const vals2 = hand2.map(c => {
      const rankMap = { 'A': 14, 'K': 13, 'Q': 12, 'J': 11 };
      return rankMap[c.rank] !== undefined ? rankMap[c.rank] : parseInt(c.rank);
    }).sort((a, b) => b - a);

    for (let i = 0; i < vals1.length; i++) {
      if (vals1[i] !== vals2[i]) {
        return vals1[i] > vals2[i] ? 1 : -1;
      }
    }
    return 0;
  }

  /**
   * House Way: Bot's optimal split strategy
   */
  houseSplit(cards) {
    // Sort cards for analysis
    const sorted = [...cards].sort((a, b) => {
      const rankMap = { 'A': 14, 'K': 13, 'Q': 12, 'J': 11 };
      const valA = rankMap[a.rank] !== undefined ? rankMap[a.rank] : parseInt(a.rank);
      const valB = rankMap[b.rank] !== undefined ? rankMap[b.rank] : parseInt(b.rank);
      return valB - valA;
    });

    const ranks = sorted.map(c => c.rank);
    const rankCount = {};
    ranks.forEach(r => rankCount[r] = (rankCount[r] || 0) + 1);

    // Rule 1: If has pair
    for (let rank in rankCount) {
      if (rankCount[rank] >= 2) {
        const pair = sorted.filter(c => c.rank === rank).slice(0, 2);
        const remaining = sorted.filter(c => c.rank !== rank || rankCount[rank] > 2).slice(0, 5);
        return { high: remaining, low: pair };
      }
    }

    // Rule 2: No pair - use highest cards for high hand, lowest for low hand
    const high = sorted.slice(0, 5);
    const low = sorted.slice(5, 7);
    return { high, low };
  }

  /**
   * Initialize game
   */
  startGame(bet, skipDeduct = false) {
    // Money is already deducted when clicking Place Bet button
    this.bet = bet;
    this.deck = createDeck();

    // Deal 7 cards to player
    this.playerCards = this.deck.splice(0, 7);

    // Deal 7 cards to dealer
    this.dealerCards = this.deck.splice(0, 7);

    this.gameState = 'splitting';
    return true;
  }

  /**
   * Finalize game after player splits
   */
  finalizeGame(playerHigh, playerLow) {
    // Validate split
    if (playerHigh.length !== 5 || playerLow.length !== 2) {
      return { status: 'error', message: 'Invalid hand split' };
    }

    // Dealer splits using House Way
    const dealerSplit = this.houseSplit(this.dealerCards);
    this.dealerHighHand = dealerSplit.high;
    this.dealerLowHand = dealerSplit.low;

    // Determine winner
    const highResult = this.compareHands(playerHigh, this.dealerHighHand);
    const lowResult = this.compareHands(playerLow, this.dealerLowHand);

    let playerWins = 0;
    if (highResult > 0) playerWins++;
    if (lowResult > 0) playerWins++;

    let payout = 0;
    if (playerWins === 2) {
      payout = this.bet * 2;
      wallet.addWinnings(payout);
      this.gameState = 'result';
      return { status: 'win', message: 'You win both hands!', highResult, lowResult, payout };
    } else if (playerWins === 1) {
      payout = this.bet;
      wallet.addWinnings(payout);
      this.gameState = 'result';
      return { status: 'push', message: 'You win one, lose one. Push.', highResult, lowResult, payout };
    } else {
      this.gameState = 'result';
      return { status: 'loss', message: 'You lose both hands.', highResult, lowResult, payout: 0 };
    }
  }
}

/**
 * Pai Gow UI
 */
function launchPaiGow(container) {
  let game = new PaiGowGame();
  window.game = game;

  container.innerHTML = `
    <div class="paigow-container">
      <h3 style="color: #ffd700; margin-bottom: 20px;">Pai Gow Poker</h3>
      
      <div id="bet-section">
        <div style="text-align: center; margin-bottom: 20px;">
          <h4 style="color: #ffd700; margin-bottom: 15px;">Select Your Bet: $<span id="current-bet">0</span></h4>
          <div class="chip-selector">
            <button class="casino-chip chip-1" data-value="1">$1</button>
            <button class="casino-chip chip-5" data-value="5">$5</button>
            <button class="casino-chip chip-25" data-value="25">$25</button>
            <button class="casino-chip chip-50" data-value="50">$50</button>
            <button class="casino-chip chip-100" data-value="100">$100</button>
            <button class="casino-chip chip-500" data-value="500">$500</button>
            <button class="casino-chip chip-1k" data-value="1000">$1k</button>
          </div>
        </div>
        <div class="game-controls">
          <button class="btn btn-secondary" id="clear-bet-btn" style="width: 160px;">Clear Bet</button>
          <button class="btn btn-deal" id="deal-btn" style="width: 200px;">Deal Cards</button>
        </div>
      </div>

      <div id="game-area" style="display: none;">
        <div class="paigow-section">
          <h4 style="color: #ffd700; margin-bottom: 15px;">Your Cards</h4>
          <div id="player-available" class="cards-row drop-zone" data-zone="available"></div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin: 30px 0;">
          <div class="paigow-section">
            <h4 style="color: #ffd700;">Your High Hand (<span id="high-count">0</span>/5 Cards)</h4>
            <div class="hand-slot drop-zone" id="player-high" data-zone="high">
              <div id="player-high-cards" class="cards-row"></div>
            </div>
          </div>

          <div class="paigow-section">
            <h4 style="color: #ffd700;">Your Low Hand (<span id="low-count">0</span>/2 Cards)</h4>
            <div class="hand-slot drop-zone" id="player-low" data-zone="low">
              <div id="player-low-cards" class="cards-row"></div>
            </div>
          </div>
        </div>

        <div class="game-controls">
          <button class="btn btn-secondary" id="auto-split-btn">Auto-Split (House Way)</button>
          <button class="btn btn-primary" id="submit-split-btn" style="width: 200px;">Compare Hands</button>
          <button class="btn btn-primary" id="new-game-btn" style="display: none;">New Game</button>
        </div>

        <div id="result-area" style="margin-top: 30px;"></div>
      </div>
    </div>
  `;

  const dealBtn = container.querySelector('#deal-btn');
  const clearBetBtn = container.querySelector('#clear-bet-btn');
  const autoSplitBtn = container.querySelector('#auto-split-btn');
  const submitBtn = container.querySelector('#submit-split-btn');
  const newGameBtn = container.querySelector('#new-game-btn');
  const betSection = container.querySelector('#bet-section');
  const gameArea = container.querySelector('#game-area');

  let selectedHigh = [];
  let selectedLow = [];
  let chipValue = 5;
  let currentBet = 0;

  // Chip selector - directly adds to bet
  container.querySelectorAll('.casino-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const chipValue = parseInt(chip.dataset.value, 10);
      if (!wallet.deductBet(chipValue)) {
        showNotification('Insufficient funds', 'error');
        return;
      }
      container.querySelectorAll('.casino-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentBet += chipValue;
      container.querySelector('#current-bet').textContent = currentBet;
    });
  });

  // Clear bet
  clearBetBtn.addEventListener('click', () => {
    if (currentBet > 0) {
      wallet.addWinnings(currentBet);
    }
    currentBet = 0;
    container.querySelector('#current-bet').textContent = '0';
    container.querySelectorAll('.casino-chip').forEach(c => c.classList.remove('active'));
  });

  // Deal button
  dealBtn.addEventListener('click', () => {
    if (!currentBet || currentBet <= 0) {
      showNotification('Invalid bet amount', 'error');
      return;
    }

    if (!game.startGame(currentBet, true)) {
      showNotification('Insufficient funds', 'error');
      return;
    }

    betSection.style.display = 'none';
    gameArea.style.display = 'block';
    selectedHigh = [];
    selectedLow = [];
    renderCards();
  });

  // Auto split using House Way
  autoSplitBtn.addEventListener('click', () => {
    const split = game.houseSplit(game.playerCards);
    selectedHigh = split.high.map(card => game.playerCards.indexOf(card)).filter(i => i !== -1);
    selectedLow = split.low.map(card => game.playerCards.indexOf(card)).filter(i => i !== -1);
    renderCards();
    showNotification('Auto-split applied!', 'success');
  });

  // Submit split
  submitBtn.addEventListener('click', () => {
    if (selectedHigh.length !== 5 || selectedLow.length !== 2) {
      showNotification('Please select exactly 5 cards for high hand and 2 for low hand', 'error');
      return;
    }

    const highCards = selectedHigh.map(idx => game.playerCards[idx]);
    const lowCards = selectedLow.map(idx => game.playerCards[idx]);

    const result = game.finalizeGame(highCards, lowCards);
    if (result.status === 'error') {
      showNotification(result.message, 'error');
      return;
    }

    showResult(result);
  });

  // New game
  newGameBtn.addEventListener('click', () => {
    game = new PaiGowGame();
    window.game = game;
    betSection.style.display = 'block';
    gameArea.style.display = 'none';
    selectedHigh = [];
    selectedLow = [];
      currentBet = 0;
      container.querySelector('#current-bet').textContent = '0';
      container.querySelectorAll('.casino-chip').forEach(c => c.classList.remove('active'));
    submitBtn.style.display = 'inline-block';
    autoSplitBtn.style.display = 'inline-block';
    newGameBtn.style.display = 'none';
    container.querySelector('#result-area').innerHTML = '';
  });

  function renderCards() {
    const availableContainer = container.querySelector('#player-available');
    const highContainer = container.querySelector('#player-high-cards');
    const lowContainer = container.querySelector('#player-low-cards');

    const selectedSet = new Set([...selectedHigh, ...selectedLow]);
    const remaining = game.playerCards
      .map((_, idx) => idx)
      .filter(idx => !selectedSet.has(idx));

    availableContainer.innerHTML = remaining.map(idx => renderCard(idx, 'available')).join('');
    highContainer.innerHTML = selectedHigh.map(idx => renderCard(idx, 'high')).join('');
    lowContainer.innerHTML = selectedLow.map(idx => renderCard(idx, 'low')).join('');

    updateCounts();
  }

  function renderCard(cardIndex, source) {
    const card = game.playerCards[cardIndex];
    return `
      <div class="paigow-card" draggable="true" data-card-index="${cardIndex}" data-source="${source}">
        ${getCardHTML(card)}
      </div>
    `;
  }

  function updateCounts() {
    const highCountEl = container.querySelector('#high-count');
    const lowCountEl = container.querySelector('#low-count');
    if (highCountEl) highCountEl.textContent = selectedHigh.length;
    if (lowCountEl) lowCountEl.textContent = selectedLow.length;
  }

  function setupDragAndDrop() {
    const availableZone = container.querySelector('#player-available');
    const highZone = container.querySelector('#player-high');
    const lowZone = container.querySelector('#player-low');
    const zones = [availableZone, highZone, lowZone];

    container.addEventListener('dragstart', (e) => {
      const cardEl = e.target.closest('.paigow-card');
      if (!cardEl) return;
      const payload = {
        cardIndex: parseInt(cardEl.dataset.cardIndex, 10),
        source: cardEl.dataset.source
      };
      e.dataTransfer.setData('text/plain', JSON.stringify(payload));
      e.dataTransfer.effectAllowed = 'move';
      cardEl.classList.add('dragging');
    });

    container.addEventListener('dragend', (e) => {
      const cardEl = e.target.closest('.paigow-card');
      if (cardEl) cardEl.classList.remove('dragging');
      zones.forEach(z => z.classList.remove('drop-highlight'));
    });

    zones.forEach(zone => {
      zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('drop-highlight');
      });

      zone.addEventListener('dragleave', () => {
        zone.classList.remove('drop-highlight');
      });

      zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('drop-highlight');
        const payload = JSON.parse(e.dataTransfer.getData('text/plain'));
        if (!payload || Number.isNaN(payload.cardIndex)) return;
        moveCardToZone(payload.cardIndex, zone.dataset.zone);
      });
    });
  }

  function moveCardToZone(cardIndex, zone) {
    selectedHigh = selectedHigh.filter(i => i !== cardIndex);
    selectedLow = selectedLow.filter(i => i !== cardIndex);

    if (zone === 'available') {
      renderCards();
      return;
    }

    if (zone === 'high') {
      if (selectedHigh.length >= 5) {
        showNotification('High hand is full', 'error');
        renderCards();
        return;
      }
      selectedHigh.push(cardIndex);
    }

    if (zone === 'low') {
      if (selectedLow.length >= 2) {
        showNotification('Low hand is full', 'error');
        renderCards();
        return;
      }
      selectedLow.push(cardIndex);
    }

    renderCards();
  }

  setupDragAndDrop();

  function showResult(result) {
    submitBtn.style.display = 'none';
    autoSplitBtn.style.display = 'none';
    newGameBtn.style.display = 'inline-block';

    const resultArea = container.querySelector('#result-area');
    let resultClass = 'win';
    let title = '🎉 You Win!';

    if (result.status === 'loss') {
      resultClass = 'loss';
      title = '❌ You Lose!';
    } else if (result.status === 'push') {
      resultClass = 'tie';
      title = '🤝 Push!';
    }

    const highResult = result.highResult > 0 ? '✓ Win' : result.highResult < 0 ? '✗ Lose' : 'Tie';
    const lowResult = result.lowResult > 0 ? '✓ Win' : result.lowResult < 0 ? '✗ Lose' : 'Tie';

    const payout = result.payout;
    const netGain = payout > 0 ? payout - game.bet : 0;
    const amountText = payout > 0 ? `Net Gain: +$${netGain}` : 'No payout';

    resultArea.innerHTML = `
      <div class="game-result ${resultClass}">
        <div class="result-title">${title}</div>
        <div style="margin-top: 15px; font-size: 1.1em;">
          High Hand: ${highResult}<br>
          Low Hand: ${lowResult}
        </div>
        <div class="result-amount ${payout > 0 ? 'positive' : 'negative'}" style="margin-top: 15px;">
          ${amountText}
        </div>
        <div style="margin-top: 15px;">New Balance: ${wallet.formatBalance()}</div>
      </div>
    `;

    onBalanceUpdated();
  }
}
