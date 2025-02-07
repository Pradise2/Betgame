// GameComponent.tsx
import React, { useState } from 'react';
import { createGame, SUPPORTED_TOKENS } from '../utils/function';
import { useAppKitAccount } from '@reown/appkit/react';
import { GameComponentProps } from './interface';

const GameComponent: React.FC<GameComponentProps> = ({ setGameDetails }) => {
  const [betAmount, setBetAmount] = useState<string>('');
  const [tokenAddress, setTokenAddress] = useState<string>(SUPPORTED_TOKENS.STABLEAI);
  const [player1Choice, setPlayer1Choice] = useState<boolean>(true);
  const [timeoutDuration, setTimeoutDuration] = useState<number>(3600); // 1 hour in seconds
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { address, isConnected } = useAppKitAccount();

  const handleCreateGame = async () => {
    if (!address || !isConnected) return;
    setLoading(true);
    setError(null);
    try {
      const details = await createGame(betAmount, tokenAddress, player1Choice, timeoutDuration);
      setGameDetails(details); // Add new game details to the list
      console.log('Game created successfully:', details);
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to create game:', err);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div>
      <h2>Create Game</h2>
      <div>
        <label>
          Bet Amount:
          <input
            type="text"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            placeholder="Enter bet amount"
          />
        </label>
      </div>
      <div>
        <label>
          Token Address:
          <select value={tokenAddress} onChange={(e) => setTokenAddress(e.target.value)}>
            {Object.entries(SUPPORTED_TOKENS).map(([key, value]) => (
              <option key={key} value={value}>
                {key}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div>
        <label>
          Player 1 Choice:
          <select value={player1Choice.toString()} onChange={(e) => setPlayer1Choice(e.target.value === 'true')}>
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        </label>
      </div>
      <div>
        <label>
          Timeout Duration (seconds):
          <input
            type="number"
            value={timeoutDuration}
            onChange={(e) => setTimeoutDuration(Number(e.target.value))}
            placeholder="Enter timeout duration"
          />
        </label>
      </div>
      <button onClick={handleCreateGame} disabled={loading}>
        {loading ? 'Creating Game...' : 'Create Game'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default GameComponent;