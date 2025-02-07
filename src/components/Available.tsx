import { useEffect, useState } from 'react';
import { GamepadIcon, Coins, Trophy, XCircle, CircleDollarSign } from 'lucide-react';

interface Game {
  gameId: number;
  betAmount: string;
  tokenAddress: string;
  isCompleted: boolean;
  player1Choice: boolean;
  createdAt: number;
  tokenName: string;
  tokenSymbol: string;
  player2Balance: string;
  player1: string;
  timeLeft: { hours: number; minutes: number; seconds: number } | null;
}

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center h-64 gap-8">
    <div className="coin">
      <div className="coin-face coin-front">
        <CircleDollarSign className="w-full h-full text-white/90 p-6" />
      </div>
      <div className="coin-face coin-back">
        <CircleDollarSign className="w-full h-full text-white/90 p-6" />
      </div>
    </div>
    <span className="text-xl font-semibold loading-text">
      Loading available games...
    </span>
  </div>
);

interface AvailableProps {
  games: Game[];
  loading: boolean;
}

const Available: React.FC<AvailableProps> = ({ games, loading }) => {
  const [gameDetails, setGameDetails] = useState<Game[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const gamesPerPage = 5;

  useEffect(() => {
    if (games.length > 0) {
      setGameDetails(games);
    }
  }, [games]);

  const indexOfLastGame = currentPage * gamesPerPage;
  const indexOfFirstGame = indexOfLastGame - gamesPerPage;
  const currentGames = gameDetails.slice(indexOfFirstGame, indexOfLastGame);

  const totalPages = Math.ceil(gameDetails.length / gamesPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div>{error}</div>;

  return (
    <div className="p-6">
      <div className="max-w-[1400px] mx-auto">
        {gameDetails.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 shadow-xl p-8 text-center">
            <GamepadIcon className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Available Games</h3>
            <p className="text-white/70">There are currently no active games to join. Check back later or create a game.</p>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-b border-white/10">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Game ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Required Bet</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Token Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Game Completed</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Player 1 Choice</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {currentGames.map((game) => (
                    <tr key={game.gameId} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-yellow-400" />
                          <span className="text-white font-semibold">{game.gameId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Coins className="w-4 h-4 text-purple-400" />
                          <span className="text-white/90">{game.betAmount}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white/90">{game.tokenName || 'Unknown'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white/90">{game.isCompleted ? 'Yes' : 'No'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white/90">{game.player1Choice ? 'Heads' : 'Tails'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white/90">
                          {game.timeLeft ? `${game.timeLeft.hours}h ${game.timeLeft.minutes}m ${game.timeLeft.seconds}s` : 'Expired'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between py-4 px-6 text-white">
              <button onClick={handlePreviousPage} disabled={currentPage === 1} className="px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 disabled:bg-gray-500">
                Previous
              </button>
              <button onClick={handleNextPage} disabled={currentPage === totalPages} className="px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 disabled:bg-gray-500">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Available;
