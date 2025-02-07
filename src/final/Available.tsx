import React, { useState, useEffect } from 'react';
import { getFullGameDetails, getGameIdCounter, publicWsContract,  } from '../utils/function';
import { GameStat } from '../components/interface';

const Available: React.FC = () => {
  const [gameDetailsList, setGameDetailsList] = useState<GameStat[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [gameIdCounter, setGameIdCounter] = useState<number>(0);

  // Fetch the total number of games (gameIdCounter)
  const fetchGameIdCounter = async () => {
    try {
      const count = await getGameIdCounter();
      setGameIdCounter(Number(count));
    } catch (error) {
      console.error('Error fetching game ID counter:', error);
      setError('Failed to fetch game ID counter.');
    }
  };

  // Fetch all game details
  const fetchAllGameDetails = async () => {
    try {
      setLoading(true);
      const gameDetails: GameStat[] = [];

      // Start from gameIdCounter - 1 and fetch all games down to 0
      for (let id = gameIdCounter - 1; id >= 0; id--) {
        try {
          const details = await getFullGameDetails(id);
          gameDetails.push(details);
        } catch (error) {
          console.error(`Error fetching details for game ID: ${id}`);
        }
      }
      console.log('Fetched Game Details:', gameDetails); // Debugging the fetched game details
     
      setGameDetailsList(gameDetails);
    } catch (err) {
      setError('Failed to fetch game details.');
      console.error('Error fetching game details:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch of game counter and all game details
  useEffect(() => {
    const initializeData = async () => {
      await fetchGameIdCounter();
    };
    initializeData();
  }, []);

  // Fetch all game details when counter is available
  useEffect(() => {
    if (gameIdCounter > 0) {
      fetchAllGameDetails();
    }
  }, [gameIdCounter]);

  // Set up event listeners to handle new game creation and updates
  useEffect(() => {
    if (!publicWsContract) return;
  
    const handleGameCreated = async (gameId: number, player1: string, betAmount: string, tokenAddress: string, player1Choice: boolean) => {
      console.log("New game created:", gameId, player1, betAmount, tokenAddress, player1Choice);
      await fetchAllGameDetails();
    };
  
    const handleGameResolved = async (gameId: number, winner: string, winAmount: string) => {
      console.log("Game resolved:", gameId, winner, winAmount);
      await fetchAllGameDetails();
    };
  
    publicWsContract.on("GameCreated", handleGameCreated);
    publicWsContract.on("GameResolved", handleGameResolved);
  
    return () => {
      publicWsContract.off("GameCreated", handleGameCreated);
      publicWsContract.off("GameResolved", handleGameResolved);
    };
  }, []);
  
  console.log("publicWsContract:", publicWsContract);
console.log("Does it have .on()?", typeof publicWsContract.on === "function");

  if (loading) {
    return <div>Loading all game details...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div>
      <h1>Game Details</h1>
      
      {gameDetailsList.length > 0 ? (
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left p-2">Game ID</th>
              <th className="text-left p-2">Bet Amount (ETH)</th>
              <th className="text-left p-2">Token</th>
              <th className="text-left p-2">Player 1 Choice</th>
              <th className="text-left p-2">State</th>
            </tr>
          </thead>
          <tbody>
            {gameDetailsList.map((gameDetails, index) => {
              const displayId = gameIdCounter - 1 - index;
              return (
                <tr key={`game-${displayId}`}>
                  <td className="p-2">{displayId}</td>
                  <td className="p-2">{gameDetails.betAmount}</td>
                  <td className="p-2">
                    {gameDetails.tokenName} ({gameDetails.tokenSymbol})
                  </td>
                  <td className="p-2">{gameDetails.player1Choice ? 'Heads' : 'Tails'}</td>
                  <td className="p-2">{gameDetails.state}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <div className="text-center py-4">No game details found.</div>
      )}
    </div>
  );
};

export default Available;