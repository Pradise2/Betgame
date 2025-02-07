import React, { useState, useEffect } from 'react';
import { getFullGameDetails, getGameIdCounter } from '../utils/function';
import { GameStat } from '../components/interface';

const GameDetails: React.FC = () => {
  const [gameDetailsList, setGameDetailsList] = useState<GameStat[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [gameIdCounter, setGameIdCounter] = useState<number>(0);

  // Fetch the total number of games (gameIdCounter)
  const fetchGameIdCounter = async () => {
    try {
      const count = await getGameIdCounter(); // Read-only access
      setGameIdCounter(Number(count));
    } catch (error) {
      console.error('Error fetching game ID counter:', error);
    }
  };

  const fetchGameDetailsByPage = async (page: number) => {
    try {
      setLoading(true);
      const gameDetails: GameStat[] = [];
  
      const gamesPerPage = 5;
  
      // Calculate the start and end game IDs based on the current page
      const startGameId = gameIdCounter - (page * gamesPerPage); // Start from the higher gameId
      const endGameId = gameIdCounter - ((page - 1) * gamesPerPage); // End before the next set
  
      // Ensure that the gameId doesn't go below 0
      if (startGameId < 0) {
        console.log('Reached the beginning of game history, stopping...');
        return; // Stop if we hit a gameId less than 0
      }
  
      const gameIdsToFetch = [];
      for (let gameId = startGameId; gameId > endGameId && gameId >= 0; gameId--) {
        gameIdsToFetch.push(gameId);
      }
  
      // Fetch all game details in parallel using Promise.all
      const fetchedGameDetails = await Promise.all(
        gameIdsToFetch.map(gameId => getFullGameDetails(gameId).catch(error => {
          console.error(`Error fetching details for game ID: ${gameId}`);
          return null; // Handle errors gracefully
        }))
      );
  
      // Filter out null results (in case of failed fetches)
      const validGameDetails = fetchedGameDetails.filter(details => details !== null) as GameStat[];
  
      // Sorting in descending order based on `gameId` (generated dynamically)
      const sortedGameDetails = validGameDetails.reverse(); // Reverse to make it descending
  
      // Append the sorted game details to the existing list
      setGameDetailsList(prevDetails => [...prevDetails, ...sortedGameDetails]);
    } catch (err) {
      setError('Failed to fetch game details.');
      console.error('Error fetching game details:', err);
    } finally {
      setLoading(false);
    }
  };
  

  // Load the next page of games
  const loadNextPage = () => {
    setCurrentPage(prevPage => prevPage + 1);
  };

  useEffect(() => {
    fetchGameIdCounter(); // Fetch the total game count when component mounts
  }, []);

  useEffect(() => {
    if (gameIdCounter > 0) {
      fetchGameDetailsByPage(currentPage); // Fetch the game details for the current page
    }
  }, [gameIdCounter, currentPage]);

  if (loading) {
    return <div>Loading game details...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div>
      <h1>Game Details</h1>
      {gameDetailsList.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Game ID</th>
              <th>Bet Amount (ETH)</th>
              <th>Token</th>
              <th>Player 1</th>
              <th>Player 1 Choice</th>
              <th>Player 2</th>
              <th>Game Created At</th>
              <th>Game State</th>
              <th>Winner</th>
              <th>Win Amount (ETH)</th>
            </tr>
          </thead>
          <tbody>
            {gameDetailsList.map((gameDetails, index) => (
              <tr key={index}>
                {/* Calculate gameId dynamically in descending order */}
                <td>{gameIdCounter - (currentPage - 1) * 5 - index}</td> {/* Adjusted gameId */}
                <td>{gameDetails.betAmount}</td>
                <td>{gameDetails.tokenName} ({gameDetails.tokenSymbol})</td>
                <td>{gameDetails.player1}</td>
                <td>{gameDetails.player1Choice ? 'Heads' : 'Tails'}</td>
                <td>{gameDetails.player2}</td>
                <td>{new Date(gameDetails.createdAt).toLocaleString()}</td>
                <td>{gameDetails.state}</td>
                <td>{gameDetails.winner}</td>
                <td>{gameDetails.winAmount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div>No game details found.</div>
      )}

      <div>
        <button onClick={loadNextPage} disabled={loading}>
          Load More
        </button>
      </div>
    </div>
  );
};

export default GameDetails;
