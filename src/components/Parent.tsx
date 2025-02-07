import { useState } from 'react';
import CreateGame from './CreateGame';
import Available from './Available';
import { createGame } from '../utils/contractFunction'; // Example function for blockchain call

// Define the `Game` interface here or import it from another file
interface Game {
  gameId: number;
  betAmount: string;
  tokenAddress: string;
  isCompleted: boolean;
  player1Choice: boolean;
  createdAt: number;
  tokenName: string;
  tokenSymbol: string;
  player2Balance: string;
  player1: string;
  timeLeft: { hours: number; minutes: number; seconds: number } | null;
}

const Parent = () => {
  const [games, setGames] = useState<Game[]>([
    {
      gameId: 1,
      betAmount: '10',
      tokenAddress: '0x...',
      isCompleted: false,
      player1Choice: true,
      createdAt: Date.now(),
      tokenName: 'TokenA',
      tokenSymbol: 'TKA',
      player2Balance: '100',
      player1: '0x...',
      timeLeft: { hours: 0, minutes: 5, seconds: 30 },
    },
    // Add more game objects here
  ]);

  const [loading, setLoading] = useState<boolean>(false); // Loading state while waiting for the game to be created

  const handleCreateGame = async (tokenAddress: string, betAmount: string, player1Choice: boolean, timeoutDuration: string) => {
    setLoading(true);
    try {
      // Call the blockchain function to create the game
      const gameId = await createGame(tokenAddress, betAmount, player1Choice, timeoutDuration);

      // If successful, update the games list with the new gameId
      setGames((prevGames) => [...prevGames, { gameId, betAmount, tokenAddress, isCompleted: false, player1Choice, createdAt: Date.now(), tokenName: 'New Token', tokenSymbol: 'NTK', player2Balance: '0', player1: '0x...', timeLeft: null }]);
    } catch (error) {
      console.error('Error creating game:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <CreateGame onCreateGame={handleCreateGame} />
      <Available games={games} loading={loading} />
    </div>
  );
};

export default Parent;
