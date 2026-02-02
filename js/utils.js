/**
 * Shared Utilities for Casino Games
 */

/**
 * Create a standard 52-card deck
 * @returns {Array} - Array of card objects {suit, rank, value}
 */
function createDeck() {
  const suits = ['♠', '♥', '♦', '♣'];
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const values = [11, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10]; // A=11 initially, J/Q/K=10

  const deck = [];
  for (let suit of suits) {
    for (let i = 0; i < ranks.length; i++) {
      deck.push({
        suit: suit,
        rank: ranks[i],
        value: values[i]
      });
    }
  }
  return shuffle(deck);
}

/**
 * Fisher-Yates shuffle
 */
function shuffle(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Format a card for display
 */
function formatCard(card) {
  return `${card.rank}${card.suit}`;
}

/**
 * Display card in HTML
 */
function getCardHTML(card) {
  const colors = {
    '♠': 'black',
    '♣': 'black',
    '♥': 'red',
    '♦': 'red'
  };
  const color = colors[card.suit] || 'black';
  return `<div class="card" style="color: ${color};">${card.rank}<br>${card.suit}</div>`;
}

/**
 * Generate random integer between min and max (inclusive)
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Sleep for given milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Show notification message
 */
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('show');
  }, 10);

  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}
