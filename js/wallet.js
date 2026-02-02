/**
 * Wallet Module - Manages user balance with persistent cookie storage
 */

const STORAGE_KEY = 'casinoBalance';
const INITIAL_BALANCE = 1000;

class Wallet {
  constructor() {
    this.balance = this.loadBalance();
  }

  /**
   * Read a cookie value by name
   */
  getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  /**
   * Set a cookie value
   */
  setCookie(name, value, days = 365) {
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value}; Max-Age=${maxAge}; Path=/`;
  }

  /**
   * Load balance from localStorage or initialize with default
   */
  loadBalance() {
    const cookieValue = this.getCookie(STORAGE_KEY);
    if (cookieValue !== null && !isNaN(cookieValue)) {
      return parseFloat(cookieValue);
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null && !isNaN(stored)) {
      const amount = parseFloat(stored);
      this.saveBalance(amount);
      return amount;
    }

    this.saveBalance(INITIAL_BALANCE);
    return INITIAL_BALANCE;
  }

  /**
   * Save balance to localStorage
   */
  saveBalance(amount) {
    const value = amount.toFixed(2);
    this.setCookie(STORAGE_KEY, value);
    localStorage.setItem(STORAGE_KEY, value);
  }

  /**
   * Get current balance
   */
  getBalance() {
    return this.balance;
  }

  /**
   * Deduct bet from balance
   * @param {number} amount - Bet amount
   * @returns {boolean} - true if deduction successful, false if insufficient funds
   */
  deductBet(amount) {
    if (amount <= 0) {
      console.error('Bet amount must be positive');
      return false;
    }
    if (this.balance < amount) {
      console.error('Insufficient balance');
      return false;
    }
    this.balance -= amount;
    this.saveBalance(this.balance);
    return true;
  }

  /**
   * Add winnings to balance
   * @param {number} amount - Winnings amount
   */
  addWinnings(amount) {
    if (amount <= 0) {
      console.error('Winnings must be positive');
      return;
    }
    this.balance += amount;
    this.saveBalance(this.balance);
  }

  /**
   * Reset balance to initial amount
   */
  resetBalance() {
    this.balance = INITIAL_BALANCE;
    this.saveBalance(this.balance);
  }

  /**
   * Format balance for display
   */
  formatBalance() {
    return `$${this.balance.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  }
}

// Initialize global wallet
const wallet = new Wallet();
