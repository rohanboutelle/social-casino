# Social Casino - Project Specification

## Tech Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Storage**: localStorage for persistent wallet balance
- **Target**: Browser-based, publishable to web

## Project Structure
```
casino/
├── index.html           # Main lobby and game container
├── AGENT.md             # This file
├── css/
│   ├── style.css        # Global styles
│   └── games.css        # Game-specific styles
├── js/
│   ├── wallet.js        # Balance management (localStorage)
│   ├── lobby.js         # Main lobby controller
│   └── utils.js         # Shared utilities
└── games/
    ├── blackjack.js     # Blackjack game module
    ├── baccarat.js      # Baccarat game module
    ├── craps.js         # Craps game module
    └── paigow.js        # Pai Gow Poker game module
```

## Phase 1: Foundation & Project Mapping

### Task 1.1: Project Setup ✓
- Create directory structure
- Create AGENT.md specification
- Create index.html lobby

### Task 1.2: wallet.js
**Requirements:**
- Initial balance: $1,000
- Functions:
  - `getBalance()` - Returns current balance
  - `deductBet(amount)` - Subtract from balance, return true/false
  - `addWinnings(amount)` - Add to balance
  - `resetBalance()` - Reset to $1,000
- Storage: localStorage with key "casinoBalance"

### Task 1.3: lobby.js & index.html
- Display current balance
- Game selection buttons (Blackjack, Baccarat, Craps, Pai Gow)
- Game switching via modal/page overlay
- Return to lobby option

## Phase 2: Game Modules

### 1. Blackjack (blackjack.js)
- Standard 52-card deck
- Dealer hits on 16, stands on 17 (Soft 17 rule)
- User vs. Dealer comparison
- Functions:
  - `calculateHand(cards)` - Calculate total, handle Aces as 1 or 11
  - `dealerAction(dealerCards)` - Return true/false for hit decision

### 2. Baccarat (baccarat.py)
- Scoring: Score = Total mod 10
- Banker/Player/Tie bets
- Third Card Rules (Tableau-based)
- Functions:
  - `calculateScore(cards)` - Score mod 10
  - `shouldBankerDraw(bankerCards, playerCards)` - Tableau logic

### 3. Craps (craps.js)
- Two six-sided dice
- State machine: "Point Off" (initial) and "Point On"
- Win on 7/11 (come out), lose on 2/3/12
- Functions:
  - `rollDice()` - Return [d1, d2]
  - `getGameState()` - Return current phase

### 4. Pai Gow Poker (paigow.js)
- 7-card deal
- User splits into 5-card "High Hand" and 2-card "Low Hand"
- Both must be higher than dealer's equivalent hands
- House Way for bot splitting
- Functions:
  - `handRank(cards)` - Compare poker hands
  - `houseSplit(cards)` - Bot's optimal split

## Deployment
- Use GitHub Pages for free hosting
- Or deploy to Netlify/Vercel
- Single HTML file or standard web directory
