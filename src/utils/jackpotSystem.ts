import { gorConnection } from './gorConnection';

interface GameEntry {
  id: string;
  player: string;
  score: number;
  timestamp: Date;
  prize: number;
}

interface RoundData {
  roundId: string;
  startTime: Date;
  endTime: Date;
  prizePool: number;
  games: GameEntry[];
  winner?: {
    player: string;
    score: number;
    prize: number;
    winType: 'jackpot' | 'highest_score' | 'test_prize';
  };
}

export class JackpotSystem {
  private static readonly ROUND_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private static readonly STORAGE_KEY = 'currentRound';
  private static readonly ROUNDS_HISTORY_KEY = 'roundsHistory';

  static getCurrentRound(): RoundData | null {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return null;

    const round = JSON.parse(stored);
    // Convert string dates back to Date objects
    round.startTime = new Date(round.startTime);
    round.endTime = new Date(round.endTime);
    round.games = round.games.map((game: any) => ({
      ...game,
      timestamp: new Date(game.timestamp)
    }));

    return round;
  }

  static async getPrizePool(): Promise<number> {
    try {
      return await gorConnection.getTreasuryBalance();
    } catch (error) {
      console.error('Failed to get treasury balance for prize pool:', error);
      return 0;
    }
  }

  static initializeRound(initialPrizePool: number = 0): RoundData {
    const now = new Date();
    const round: RoundData = {
      roundId: `round_${now.getTime()}`,
      startTime: now,
      endTime: new Date(now.getTime() + this.ROUND_DURATION),
      prizePool: initialPrizePool,
      games: []
    };

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(round));
    return round;
  }

  static async addGameToRound(game: GameEntry, paymentAmount: number): Promise<RoundData> {
    let round = this.getCurrentRound();
    
    if (!round || this.isRoundExpired(round)) {
      // End current round if it exists and is expired
      if (round) {
        await this.endRoundAsync(round);
      }
      // Start new round with current treasury balance
      const currentBalance = await this.getPrizePool();
      round = this.initializeRound(currentBalance);
    } else {
      // Update prize pool to current treasury balance
      round.prizePool = await this.getPrizePool();
    }

    // Add game to round
    round.games.push(game);
    
    // TESTING: Award prize for ANY score (removed the score === 100 check)
    const treasuryBalance = await this.getPrizePool();
    game.prize = treasuryBalance;
    round.winner = {
      player: game.player,
      score: game.score,
      prize: treasuryBalance,
      winType: 'test_prize'
    };
    
    // End round immediately on any game for testing
    await this.endRoundAsync(round);
    return this.initializeRound(0);
  }

  static isRoundExpired(round: RoundData): boolean {
    return new Date() >= round.endTime;
  }

  static getTimeRemaining(round: RoundData): number {
    const now = new Date();
    const remaining = round.endTime.getTime() - now.getTime();
    return Math.max(0, Math.floor(remaining / 1000));
  }

  static async endRoundAsync(round: RoundData): Promise<RoundData> {
    if (!round.winner && round.games.length > 0) {
      // Find highest score(s)
      const highestScore = Math.max(...round.games.map(g => g.score));
      const highestScoreGames = round.games.filter(g => g.score === highestScore);
      
      if (highestScoreGames.length > 0) {
        // Award to first person to achieve the highest score
        const winner = highestScoreGames.reduce((earliest, current) => 
          current.timestamp < earliest.timestamp ? current : earliest
        );
        
        // Award ALL treasury funds to round winner
        const treasuryBalance = await this.getPrizePool();
        winner.prize = treasuryBalance;
        round.winner = {
          player: winner.player,
          score: winner.score,
          prize: treasuryBalance,
          winType: 'highest_score'
        };

        // Update the game entry in the round
        const gameIndex = round.games.findIndex(g => g.id === winner.id);
        if (gameIndex !== -1) {
          round.games[gameIndex] = winner;
        }
      }
    }

    // Save to history
    this.saveRoundToHistory(round);
    
    // Clear current round
    localStorage.removeItem(this.STORAGE_KEY);
    
    return round;
  }

  // Synchronous version for compatibility
  static endRound(round: RoundData): RoundData {
    if (!round.winner && round.games.length > 0) {
      // Find highest score(s)
      const highestScore = Math.max(...round.games.map(g => g.score));
      const highestScoreGames = round.games.filter(g => g.score === highestScore);
      
      if (highestScoreGames.length > 0) {
        // Award to first person to achieve the highest score
        const winner = highestScoreGames.reduce((earliest, current) => 
          current.timestamp < earliest.timestamp ? current : earliest
        );
        
        // Note: This sync version can't get real treasury balance
        // The prize will be set when the async distribution happens
        round.winner = {
          player: winner.player,
          score: winner.score,
          prize: 0, // Will be updated during distribution
          winType: 'highest_score'
        };

        // Update the game entry in the round
        const gameIndex = round.games.findIndex(g => g.id === winner.id);
        if (gameIndex !== -1) {
          round.games[gameIndex] = winner;
        }
      }
    }

    // Save to history
    this.saveRoundToHistory(round);
    
    // Clear current round
    localStorage.removeItem(this.STORAGE_KEY);
    
    return round;
  }

  static saveRoundToHistory(round: RoundData): void {
    const history = this.getRoundsHistory();
    history.unshift(round);
    
    // Keep only last 10 rounds
    const limitedHistory = history.slice(0, 10);
    localStorage.setItem(this.ROUNDS_HISTORY_KEY, JSON.stringify(limitedHistory));
  }

  static getRoundsHistory(): RoundData[] {
    const stored = localStorage.getItem(this.ROUNDS_HISTORY_KEY);
    if (!stored) return [];
    
    const history = JSON.parse(stored);
    return history.map((round: any) => ({
      ...round,
      startTime: new Date(round.startTime),
      endTime: new Date(round.endTime),
      games: round.games.map((game: any) => ({
        ...game,
        timestamp: new Date(game.timestamp)
      }))
    }));
  }

  static checkAndEndExpiredRound(): { roundEnded: boolean; winner?: any } {
    const round = this.getCurrentRound();
    if (!round) return { roundEnded: false };

    if (this.isRoundExpired(round)) {
      const endedRound = this.endRound(round);
      return { 
        roundEnded: true, 
        winner: endedRound.winner 
      };
    }

    return { roundEnded: false };
  }
}
