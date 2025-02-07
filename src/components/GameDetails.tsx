// GameDetails.tsx
import React from 'react';
import { GameDetailsProps } from './interfaces';

const GameDetails: React.FC<GameDetailsProps> = ({ gameDetailsList }) => {
  if (gameDetailsList.length === 0) return <p>No games created yet.</p>; // Display message if no games

  return (
    <div>
      <h2>Created Games</h2>
      <ul>
        {gameDetailsList.map((gameDetails, index) => {
          const gameDetailsArray = Object.entries(gameDetails);
          return (
            <li key={index}>
              <h3>Game {index + 1}</h3>
              <ul>
                {gameDetailsArray.map(([key, value]) => (
                  <li key={key}>
                    <strong>{key}:</strong> {String(value)} {/* Safely convert value to string */}
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default GameDetails;