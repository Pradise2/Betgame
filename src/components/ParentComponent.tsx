import React, { useState } from 'react';
import GameComponent from './GameComponent';
import GameDetails from './GameDetails';

const ParentComponent: React.FC = () => {
  const [gameDetailsList, setGameDetailsList] = useState<any[]>([]); // Store an array of game details

  const addGameDetails = (details: any) => {
    setGameDetailsList((prevState) => [...prevState, details]); // Add new game details to the array
  };

  return (
    <div>
      <h1>Game Management</h1>
      <GameComponent setGameDetails={addGameDetails} /> {/* Pass the function to add new game details */}
      <GameDetails gameDetailsList={gameDetailsList} /> {/* Pass the list of game details */}
    </div>
  );
};

export default ParentComponent;
