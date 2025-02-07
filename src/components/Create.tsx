// CreateGameComponent.tsx
import React, { useState } from 'react';
import { createGame, Game } from './gameUtils';

interface CreateGameProps {
  onGameCreated: (game: Game) => void;
}

const Create: React.FC<CreateGameProps> = ({ onGameCreated }) => {
  const [gameName, setGameName] = useState('');
  const [gameScore, setGameScore] = useState(0);

  const handleGameNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGameName(e.target.value);
  };

  const handleGameScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGameScore(Number(e.target.value));
  };

  const handleCreateGame = () => {
    if (gameName.trim() === '') {
      alert('Please enter a game name!');
      return;
    }
    const newGame = createGame(gameName, gameScore);
    console.log('Game Created:', newGame); // Log the new game when it's created
    onGameCreated(newGame); // Pass the created game to the parent
  };

  return (
    <div>
      <input
        type="text"
        value={gameName}
        onChange={handleGameNameChange}
        placeholder="Enter game name"
      />
      <input
        type="number"
        value={gameScore}
        onChange={handleGameScoreChange}
        placeholder="Enter score"
      />
      <button onClick={handleCreateGame}>Create Game</button>
    </div>
  );
};

export default Create;
