/**
 * Lobby Controller - Main menu and game switching
 */

class Lobby {
  constructor() {
    this.currentGame = null;
    this.games = ['Blackjack', 'Baccarat', 'Craps', 'Pai Gow'];
    this.routeMap = {
      '/black_jack': 'Blackjack',
      '/baccarat': 'Baccarat',
      '/craps': 'Craps',
      '/pai_gow_poker': 'Pai Gow'
    };
    this.gameToRoute = {
      'Blackjack': '/black_jack',
      'Baccarat': '/baccarat',
      'Craps': '/craps',
      'Pai Gow': '/pai_gow_poker'
    };
    window.lobby = this;
    this.initializeUI();
    this.attachEventListeners();
    this.handleInitialRoute();
  }

  initializeUI() {
    // Update balance display
    this.updateBalanceDisplay();
  }

  attachEventListeners() {
    // Game selection buttons
    document.querySelectorAll('.game-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const gameName = btn.dataset.game;
        this.navigateToGame(gameName);
      });
    });

    // Return to lobby button
    const returnBtn = document.getElementById('return-lobby-btn');
    if (returnBtn) {
      returnBtn.addEventListener('click', () => this.returnToLobby());
    }

    // Reset balance button
    const resetBtn = document.getElementById('reset-balance-btn');
    const resetModal = document.getElementById('reset-modal');
    const modalNoBtn = document.getElementById('modal-no-btn');
    const modalYesBtn = document.getElementById('modal-yes-btn');
    
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        resetModal.style.display = 'flex';
      });
    }
    
    if (modalNoBtn) {
      modalNoBtn.addEventListener('click', () => {
        resetModal.style.display = 'none';
      });
    }
    
    if (modalYesBtn) {
      modalYesBtn.addEventListener('click', () => {
        wallet.resetBalance();
        this.updateBalanceDisplay();
        showNotification('Balance reset to $1,000', 'success');
        resetModal.style.display = 'none';
      });
    }
    
    // Close modal when clicking outside
    if (resetModal) {
      resetModal.addEventListener('click', (e) => {
        if (e.target === resetModal) {
          resetModal.style.display = 'none';
        }
      });
    }

    // Handle URL hash changes
    window.addEventListener('hashchange', () => {
      this.handleRouteChange();
    });
  }

  updateBalanceDisplay() {
    const balanceEl = document.getElementById('balance-display');
    if (balanceEl) {
      balanceEl.textContent = wallet.formatBalance();
    }
  }

  handleInitialRoute() {
    this.handleRouteChange();
  }

  handleRouteChange() {
    const path = window.location.hash.replace('#', '') || '/';
    const gameName = this.routeMap[path];

    if (gameName) {
      if (this.currentGame !== gameName) {
        this.launchGame(gameName);
      }
      return;
    }

    // Default to lobby
    if (this.currentGame) {
      this.returnToLobby(false);
    }
  }

  navigateToGame(gameName) {
    const route = this.gameToRoute[gameName] || '/';
    window.location.hash = route;
  }

  launchGame(gameName) {
    this.currentGame = gameName;
    
    // Clear hint box
    const hintBox = document.getElementById('hint-box');
    if (hintBox) {
      hintBox.style.display = 'none';
      hintBox.textContent = '';
      hintBox.style.opacity = '0';
    }
    
    // Hide lobby, show game container
    document.getElementById('lobby-container').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';

    // Clear previous game content
    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = '';

    // Load game based on name
    switch (gameName) {
      case 'Blackjack':
        launchBlackjack(gameContent);
        break;
      case 'Baccarat':
        launchBaccarat(gameContent);
        break;
      case 'Craps':
        launchCraps(gameContent);
        break;
      case 'Pai Gow':
        launchPaiGow(gameContent);
        break;
    }

    // Update balance every 500ms during game play
    if (this.balanceInterval) clearInterval(this.balanceInterval);
    this.balanceInterval = setInterval(() => this.updateBalanceDisplay(), 500);
  }

  returnToLobby(updateHash = true) {
    this.currentGame = null;
    
    // Clear hint box
    const hintBox = document.getElementById('hint-box');
    if (hintBox) {
      hintBox.style.display = 'none';
      hintBox.textContent = '';
      hintBox.style.opacity = '0';
    }
    
    // Clear balance update interval
    if (this.balanceInterval) clearInterval(this.balanceInterval);
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('lobby-container').style.display = 'block';
    this.updateBalanceDisplay();
    if (updateHash) {
      window.location.hash = '/';
    }
  }
}

// Initialize lobby when DOM is ready
let lobby;
document.addEventListener('DOMContentLoaded', () => {
  lobby = new Lobby();
});

// Update balance display when it changes
function onBalanceUpdated() {
  if (lobby) {
    lobby.updateBalanceDisplay();
  }
}
