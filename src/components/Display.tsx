// GameDisplay.tsx
import React, { useEffect } from 'react';
import { Game } from './gameUtils';

interface GameDisplayProps {
  games: Game[]; // Array of games to display
}

const Display: React.FC<GameDisplayProps> = ({ games }) => {
  useEffect(() => {
    console.log('Rendering Games List:', games); // Log the games every time the component renders
  }, [games]);

  return (
    <div>
      <h2>Game List:</h2>
      {games.length > 0 ? (
        <ul>
          {games.map((game) => (
            <li key={game.id}>
              <h3>{game.gameName}</h3>
              <p>Score: {game.gameScore}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No games created yet.</p>
      )}
    </div>
  );
};

export default Display;
