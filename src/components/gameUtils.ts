// gameUtils.ts
export type Game = {
  id: string;
  gameName: string;
  gameScore: number;
};

// Generate a unique ID for each game
export function createGame(name: string, score: number): Game {
  const newGame: Game = {
    id: `${Date.now()}-${Math.random()}`, // Unique ID based on timestamp and random number
    gameName: name,
    gameScore: score,
  };
  console.log('Creating Game:', newGame); // Log when a new game is created
  return newGame;
}

// Edit an existing game's score
export function editGameScore(games: Game[], gameId: string, newScore: number): Game[] {
  console.log('Editing Game Score:', { gameId, newScore }); // Log editing details
  const updatedGames = games.map(game =>
    game.id === gameId
      ? { ...game, gameScore: newScore } // Update the score if the ID matches
      : game
  );
  console.log('Updated Games after Edit:', updatedGames); // Log the updated list
  return updatedGames;
}

// Delete a game by ID
export function deleteGame(games: Game[], gameId: string): Game[] {
  console.log('Deleting Game:', { gameId }); // Log deletion details
  const updatedGames = games.filter(game => game.id !== gameId); // Remove the game with the matching ID
  console.log('Updated Games after Deletion:', updatedGames); // Log the updated list after deletion
  return updatedGames;
}
