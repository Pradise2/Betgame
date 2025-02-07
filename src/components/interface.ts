// interfaces.ts
export interface GameDetails {
  transactionHash: string;
  gameId: number;
  playerAddress: string;
  betAmount: string;
  tokenAddress: string;
  player1Choice: boolean;
  timeoutDuration: number;
  Symbol: string;
}

export interface GameComponentProps {
  setGameDetails: (details: GameDetails) => void; // Accepts a function that takes GameDetails
}

export interface GameDetailsProps {
  gameDetailsList: GameDetails[];
}

// Define the GameDetails interface
export interface GameStat {
  gameId: number;
  player1: string;
  player2: string;
  betAmount: string;
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  player1Choice: boolean;
  state: string; // Consider defining states as an enum if needed
  createdAt: number;
  timeoutDuration: number;
  winner: string;
  winAmount: string;
  isCompleted: string;
  player2Balance: string;
  timeduration: number;
}


export interface GameId {
  gameId: number;
}

export interface available {}