/**
 * AI Hints System using OpenRouter
 */

class AIHints {
    constructor() {
        this.OPENROUTER_API_KEY = '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'; // Add your OpenRouter API key here
        this.isThinking = false;
    }

    async getHint(gameState) {
        if (this.isThinking) return;
        
        // Check if we have a valid game state with cards dealt
        if (!gameState || !this.hasValidGameState(gameState)) {
            this.showHint('AI hint currently not available');
            return;
        }
        
        this.isThinking = true;
        
        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.href,
                },
                body: JSON.stringify({
                    model: 'openai/gpt-3.5-turbo',
                    messages: [{
                        role: 'system',
                        content: 'You are a casino strategy advisor. Analyze the game state and provide a ONE-SENTENCE specific recommendation. Only respond with the recommendation, nothing else. Be direct: "Hit", "Stand", "Bet on Player", etc.'
                    }, {
                        role: 'user',
                        content: this.formatGameState(gameState)
                    }]
                })
            });

            const data = await response.json();
            if (!response.ok) {
                console.error('API Error:', data);
                this.showHint('API Error: ' + (data.error?.message || 'Unknown error'));
                return;
            }
            const hint = data.choices[0].message.content;
            this.showHint(hint);
        } catch (error) {
            console.error('Error getting hint:', error);
            console.error('Game state was:', gameState);
            this.showHint('Error: ' + error.message);
        } finally {
            this.isThinking = false;
        }
    }

    hasValidGameState(gameState) {
        if (!gameState || !gameState.game) return false;
        
        // Check if we have enough info for each game type
        switch (gameState.game) {
            case 'BlackjackGame':
                // Check if game result is showing (means game is finished)
                const resultArea = document.querySelector('#result-area');
                if (resultArea && resultArea.innerHTML.trim().length > 0) {
                    // Result area has content - game is finished
                    return false;
                }
                // Show hint if player has cards dealt (playerTotal > 0)
                return gameState.playerTotal > 0;
            case 'BaccaratGame':
                return true; // Baccarat always has valid state
            case 'CrapsGame':
                return true; // Craps always has valid state
            case 'PaiGowGame':
                return gameState.cards && gameState.cards.length > 0;
            default:
                return false;
        }
    }

    formatGameState(gameState) {
        if (!gameState) return 'Analyze this blackjack hand';

        let prompt = '';
        switch (gameState.game) {
            case 'BlackjackGame':
                prompt = `Player hand total: ${gameState.playerTotal}. Dealer up card: ${gameState.dealerUpCard.rank}. Recommend: Hit or Stand?`;
                break;

            case 'BaccaratGame':
                prompt = `Last 5 outcomes: ${gameState.history.slice(-5).join(', ') || 'None yet'}. What should I bet on next: Player, Banker, or Tie?`;
                break;

            case 'CrapsGame':
                prompt = `Craps game ${gameState.point ? 'with point at ' + gameState.point : 'on come out roll'}. What's the best move?`;
                break;

            case 'PaiGowGame':
                prompt = `Pai Gow cards: ${gameState.cards.map(c => c.rank + c.suit).join(', ') || 'dealing'}. How should I split?`;
                break;
                
            default:
                prompt = 'What should I do?';
        }
        return prompt;
    }

    getCurrentGameState() {
        if (!window.game) return null;
        
        const game = window.game;
        const gameState = { game: game.constructor.name };
        
        if (game.constructor.name === 'BlackjackGame') {
            // Calculate player total from hand
            let playerTotal = 0;
            let aces = 0;
            
            if (game.playerHand && game.playerHand.length > 0) {
                for (let card of game.playerHand) {
                    if (card.rank === 'A') {
                        aces++;
                        playerTotal += 11;
                    } else {
                        playerTotal += card.value;
                    }
                }
                while (playerTotal > 21 && aces > 0) {
                    playerTotal -= 10;
                    aces--;
                }
            }
            
            gameState.playerTotal = playerTotal;
            gameState.dealerUpCard = game.dealerHand ? game.dealerHand[0] : { rank: '?', suit: '' };
            gameState.gameState = game.gameState;
        } else if (game.constructor.name === 'BaccaratGame') {
            gameState.history = game.history || [];
        } else if (game.constructor.name === 'CrapsGame') {
            gameState.point = game.point || null;
        } else if (game.constructor.name === 'PaiGowGame') {
            gameState.cards = game.playerCards || [];
        }
        
        return gameState;
    }

    showHint(hint) {
        const hintBox = document.getElementById('hint-box');
        if (hintBox) {
            hintBox.textContent = '';  // Clear previous message
            hintBox.textContent = hint;
            hintBox.style.display = 'block';
            hintBox.style.opacity = '0';
            setTimeout(() => {
                hintBox.style.opacity = '1';
            }, 10);

            // Hide after 8 seconds
            setTimeout(() => {
                hintBox.style.opacity = '0';
                setTimeout(() => {
                    hintBox.style.display = 'none';
                }, 300);
            }, 8000);
        }
    }
}

// Initialize global AI hints
const aiHints = new AIHints();

// Attach button event listener when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const hintButton = document.getElementById('hint-button');
    if (hintButton) {
        hintButton.addEventListener('click', () => {
            if (window.game) {
                const gameState = aiHints.getCurrentGameState();
                aiHints.getHint(gameState);
            } else {
                aiHints.showHint('Start a game to get hints!');
            }
        });
    }
});

// Also attach to window for manual calls
window.aiHints = aiHints;