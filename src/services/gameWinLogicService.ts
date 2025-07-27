
export const GameWinLogicService = {
  /**
   * Determines if a bet should win based on 30% winning chances
   * @param betType - 'color' or 'number'
   * @param betValue - The bet value (color or number)
   * @param actualResult - The actual game result
   * @returns boolean indicating if the bet should win
   */
  shouldWin(betType: string, betValue: string, actualResult: { color: string; number: number }): boolean {
    // Generate random number between 0 and 1
    const randomChance = Math.random();
    
    // Only 30% chance to win
    const winChance = 0.3;
    
    // If random chance is greater than 30%, user loses regardless of actual result
    if (randomChance > winChance) {
      console.log(`User loses due to 30% win rate: ${randomChance} > ${winChance}`);
      return false;
    }
    
    // If within 30% chance, check if bet matches actual result
    if (betType === 'color') {
      const result = betValue === actualResult.color;
      console.log(`Color bet result: ${betValue} === ${actualResult.color} = ${result}`);
      return result;
    } else if (betType === 'number') {
      const result = parseInt(betValue) === actualResult.number;
      console.log(`Number bet result: ${betValue} === ${actualResult.number} = ${result}`);
      return result;
    }
    
    return false;
  },

  /**
   * Calculates potential winnings based on bet type and amount
   * @param betType - 'color' or 'number'
   * @param amount - Bet amount
   * @returns potential win amount
   */
  calculatePotentialWin(betType: string, amount: number): number {
    if (betType === 'color') {
      // Color bets have lower multiplier
      return amount * 0.95;
    } else if (betType === 'number') {
      // Number bets have higher multiplier
      return amount * 9;
    }
    return 0;
  }
};
