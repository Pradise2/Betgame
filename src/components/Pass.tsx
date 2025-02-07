// Pass.tsx
import React, { useEffect, useState } from 'react';
import { useGameStore } from './store';
import {
  GamepadIcon,
  Trophy,
  Coins,
  XCircle,
  CircleDollarSign,
} from 'lucide-react';

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
);const Pass: React.FC = () => {
  const { availableGames, fetchGames } = useGameStore();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loadingGameId, setLoadingGameId] = useState<number | null>(null); // Add this line
  const gamesPerPage = 5;

  // Fetch games when the component mounts
  useEffect(() => {
    const loadGames = async () => {
      try {
        await fetchGames();
      } catch (error) {
        setError('Error fetching games');
      } finally {
        setLoading(false);
      }
    };

    loadGames();
  }, [fetchGames]);

  // Log availableGames whenever it changes
  useEffect(() => {
    console.log('Available Games Updated:', availableGames);
  }, [availableGames]);

  if (loading) return <LoadingSpinner />;
  if (error) return <div>{error}</div>;

  // Pagination logic
  const indexOfLastGame = currentPage * gamesPerPage;
  const indexOfFirstGame = indexOfLastGame - gamesPerPage;
  const currentGames = availableGames.slice(indexOfFirstGame, indexOfLastGame);
  const totalPages = Math.ceil(availableGames.length / gamesPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-[1400px] mx-auto">
        {/* Display Error Message */}
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400">
            <p className="flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              {error}
            </p>
          </div>
        )}

        {/* Table and other UI */}
        {availableGames.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 shadow-xl p-8 text-center">
            <GamepadIcon className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No Available Games
            </h3>
            <p className="text-white/70">
              There are currently no active games to join. Check back later or
              create a game.
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
                      Required Bet
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                      Token Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                      Game Completed
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                      Player 1 Choice
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                      Time
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {currentGames.map((game) => (
                    <tr key={game.gameId} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-yellow-400" />
                          <span className="text-white font-semibold">
                            {game.gameId}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Coins className="w-4 h-4 text-purple-400" />
                          <span className="text-white/90">{game.betAmount}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white/90">
                          {game.tokenName || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white/90">
                          {game.isCompleted ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white/90">
                          {game.player1Choice ? 'Heads' : 'Tails'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white/90">
                          {game.timeLeft
                            ? `${game.timeLeft.hours}h ${game.timeLeft.minutes}m ${game.timeLeft.seconds}s`
                            : 'Expired'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setLoadingGameId(game.gameId)} // Use setLoadingGameId here
                            className="bg-purple-600 text-white px-4 py-2 rounded-full"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20">
              <button
                onClick={handlePreviousPage}
                className="text-white disabled:opacity-50"
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <div className="text-white">
                Page {currentPage} of {totalPages}
              </div>
              <button
                onClick={handleNextPage}
                className="text-white disabled:opacity-50"
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pass;