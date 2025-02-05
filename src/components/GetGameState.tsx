import React, { useState, useEffect } from 'react';
import { getGameState, hasPlayerWithdrawn, getGameIdCounter } from '../utils/contractFunction'; // Import the functions from FlipGame.ts
import {
  GamepadIcon,
  Trophy,
  Coins,
  XCircle,
  
} from 'lucide-react';

const GetGameState = () => {
  const [gameId] = useState<number>(1); // Example gameId
  const [gameStates, setGameStates] = useState<any[]>([]); // Array to hold multiple game states
  const [playerAddress, setPlayerAddress] = useState<string>(''); // The address of the player (this should be connected wallet)
  const [hasWithdrawnState, setHasWithdrawnState] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGameStates = async () => {
      try {
        const gameIdCounter = await getGameIdCounter();
        console.log('Game ID Counter:', gameIdCounter);

        if (gameIdCounter === undefined || gameIdCounter === 0) {
          return;
        }

        const states = await Promise.all(
          Array.from({ length: gameIdCounter }, async (_, gameId) => {
            const state = await getGameState(gameId);
            return state;
          })
        );
        setGameStates(states);
      } catch (error) {
        console.error('Error fetching game states:', error);
        setError('Failed to fetch game states');
      }
    };

    fetchGameStates();
  }, []);


  const checkWithdrawnStatus = async () => {
    if (playerAddress) {
      try {
        const hasWithdrawn = await hasPlayerWithdrawn(gameId, playerAddress);
        setHasWithdrawnState(hasWithdrawn);
      } catch (error) {
        console.error('Error checking withdrawn status:', error);
        setError('Failed to check withdrawal status');
      }
    } else {
      setError('Please connect a wallet address');
    }
  };

  const handlePlayerAddressChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPlayerAddress(event.target.value);
  };


  return (
    <div className="p-6">
      <div className="max-w-[1400px] mx-auto">
        {/* Displaying Game State */}
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400">
            <p className="flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              {error}
            </p>
          </div>
        )}

        {/* Table and other UI */}
        {gameStates.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 shadow-xl p-8 text-center">
            <GamepadIcon className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No Available Games
            </h3>
            <p className="text-white/70">
              There are currently no active games to join. Check back later or create a game.
            </p>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-b border-white/10">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                      Game ID
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                      Player1
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                      Player2
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                      Betamount
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                      TokenAddress
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                      State
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                      Winner
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                      WinAmount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {gameStates.map((state) => (
                    <tr key={state.gameId} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-yellow-400" />
                          <span className="text-white font-semibold">
                            {state.gameId}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Coins className="w-4 h-4 text-purple-400" />
                          <span className="text-white/90">{state.player1}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white/90">
                          {state.player2 || 'Not joined yet'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white/90">
                          {state.betAmount}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white/90">
                          {state.tokenAddress}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white/90">
                          {state.state}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white/90">
                          {state.winner || 'Not resolved yet'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white/90">
                          {state.winAmount}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Input for Player Address */}
        <div>
          <label htmlFor="playerAddress">Player Address: </label>
          <input
            type="text"
            id="playerAddress"
            value={playerAddress}
            onChange={handlePlayerAddressChange}
          />
        </div>

        {/* Check if Player has Withdrawn */}
        <div>
          <button onClick={checkWithdrawnStatus}>
            Check If Player Has Withdrawn
          </button>
          {hasWithdrawnState === null ? (
            <p>Check withdrawn status...</p>
          ) : hasWithdrawnState ? (
            <p>Player has withdrawn the reward.</p>
          ) : (
            <p>Player has not withdrawn the reward yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GetGameState;
