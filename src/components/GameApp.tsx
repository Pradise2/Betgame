// GameApp.tsx
import React, { useState } from 'react';
import Create from './Create';
import Display from './Display';
import { Game, editGameScore, deleteGame } from './gameUtils';

const GameApp: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]); // State for storing all games

  const handleGameCreated = (newGame: Game) => {
    setGames((prevGames) => {
      const updatedGames = [...prevGames, newGame];
      console.log('Updated Games (New Game Created):', updatedGames);
      return updatedGames;
    });
  };

  const handleEditGameScore = (gameId: string, newScore: number) => {
    setGames((prevGames) => {
      const updatedGames = editGameScore(prevGames, gameId, newScore);
      console.log(`Updated Games (Game Edited):`, updatedGames);
      return updatedGames;
    });
  };

  const handleDeleteGame = (gameId: string) => {
    setGames((prevGames) => {
      const updatedGames = deleteGame(prevGames, gameId);
      console.log(`Updated Games (Game Deleted):`, updatedGames);
      return updatedGames;
    });
  };

  return (
    <div>
      <h1>Game App</h1>
      <Create onGameCreated={handleGameCreated} />
      <Display games={games} />
      
      <div>
        <button onClick={() => handleEditGameScore(games[0]?.id, 500)}>Edit First Game Score to 500</button>
        <button onClick={() => handleDeleteGame(games[0]?.id)}>Delete First Game</button>
      </div>
    </div>
  );
};

export default GameApp;
