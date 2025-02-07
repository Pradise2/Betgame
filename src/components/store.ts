import { create } from 'zustand';
import { getGameDetails, getTimeLeftToExpire, getGameIdCounter } from '../utils/contractFunction';

interface Game {
  gameId: number;
  betAmount: string;
  tokenName: string;
  isCompleted: boolean;
  player1Choice: boolean;
  timeLeft: {
    hours: number;
    minutes: number;
    seconds: number;
  } | null;
  tokenAddress: string;
  createdAt: number;
  tokenSymbol: string;
  player2Balance: string;
  player1: string;
}

interface GameStore {
  availableGames: Game[];
  addGame: (gameId: number) => Promise<void>;
  fetchGames: () => Promise<void>;
}

// store.ts
export const useGameStore = create<GameStore>((set) => ({
  availableGames: [],

  // Add a new game to the list
  addGame: async (gameId: number) => {
    try {
      // Optimistic UI update
      set((state) => ({
        availableGames: [{ 
          gameId, 
          betAmount: 'Pending...', 
          player1Choice: true, 
          tokenAddress: 'Loading...', 
          createdAt: Date.now(), 
          tokenName: 'Loading...', 
          tokenSymbol: '', 
          player2Balance: '0', 
          player1: '', 
          isCompleted: false, 
          timeLeft: null 
        }, ...state.availableGames],
      }));

      // Fetch and update game details
      const gameDetails = await getGameDetails(gameId);
      const timeLeft = await getTimeLeftToExpire(gameId);

      set((state) => ({
        availableGames: state.availableGames
          .map((game) =>
            game.gameId === gameId ? { ...game, ...gameDetails, timeLeft } : game
          )
          .sort((a, b) => b.createdAt - a.createdAt), // Sort descending by createdAt
      }));
    } catch (error) {
      console.error('Error adding game:', error);
    }
  },

  // Fetch all games
  fetchGames: async () => {
    try {
      const gameIdCounter = await getGameIdCounter();
      const fetchedGames = await Promise.all(
        Array.from({ length: gameIdCounter }, async (_, gameId) => {
          try {
            const game = await getGameDetails(gameId);
            const timeLeft = await getTimeLeftToExpire(gameId);
            return { ...game, timeLeft, gameId };
          } catch (error) {
            console.error(`Error fetching game ${gameId}:`, error);
            return null; // Return null if an error occurs
          }
        })
      );

      // Filter out null values and assert the correct type
      const filteredGames = fetchedGames.filter((game): game is Game => game !== null);

      // Sort the games in descending order by createdAt
      set({ availableGames: filteredGames.sort((a, b) => b.createdAt - a.createdAt) });

      console.log('Fetched Games:', filteredGames); // Log the fetched games
    } catch (error) {
      console.error('Error fetching games:', error);
    }
  },
}));
