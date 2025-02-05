import React, { useState, useEffect, useCallback } from 'react';
import {
  useAppKitAccount
   } from '@reown/appkit/react'
import { createGame, SUPPORTED_TOKENS } from '../utils/contractFunction';
import { Coins, Loader2, Plus, AlertCircle, CheckCircle2, Info } from 'lucide-react';

import { ethers } from 'ethers';

interface CreateGameState {
  player1Choice: boolean;
  timeoutDuration: string;
  betAmount: string;
  tokenAddress: string;
  loading: boolean;
  error: string | null;
  success: string | null;
  tokenBalance: string;
  tokenSymbol: string;
}

const CreateGame: React.FC = () => {
   const {address, isConnected} = useAppKitAccount();
  const [state, setState] = useState<CreateGameState>({
    player1Choice: false,
    timeoutDuration: '3600', // Default 1 hour in seconds
    betAmount: '',
    tokenAddress: SUPPORTED_TOKENS.STABLEAI,
    loading: false,
    error: null,
    success: null,
    tokenBalance: '0',
    tokenSymbol: 'STABLEAI'
  });


  const fetchTokenBalance = useCallback(async () => {
    if (!address || !state.tokenAddress || !isConnected) return;

    console.log('Fetching token balance for address:', address);

    try {
      const provider = new ethers.JsonRpcProvider('https://base-mainnet.infura.io/v3/b17a040a14bc48cfb3928a73d26f3617');
      const tokenContract = new ethers.Contract(
        state.tokenAddress,
        [
          'function balanceOf(address owner) view returns (uint256)',
          'function symbol() view returns (string)'
        ],
        provider
      );

      const [balance, symbol] = await Promise.all([
        tokenContract.balanceOf(address),
        tokenContract.symbol()
      ]);

      setState(prevState => ({
        ...prevState,
        tokenBalance: ethers.formatUnits(balance, 18),
        tokenSymbol: symbol
      }));
    } catch (error) {
      console.error('Error fetching token details:', error);
      setState(prevState => ({
        ...prevState,
        error: 'Failed to fetch token details'
      }));
    }
  }, [address, state.tokenAddress, isConnected]);

  useEffect(() => {
    fetchTokenBalance();
  }, [fetchTokenBalance]);

  const validateInput = (): string | null => {
    if (!isConnected) return 'Please connect your wallet';
    if (!state.betAmount || parseFloat(state.betAmount) <= 0) return 'Bet amount must be positive';
    if (parseFloat(state.tokenBalance) < parseFloat(state.betAmount)) {
    return `Insufficient ${state.tokenSymbol} balance`;
    }    
    if (!state.timeoutDuration || parseInt(state.timeoutDuration) < 300) return 'Timeout must be at least 5 minutes';
    return null;
  };

  console.log('player1chioce', state.player1Choice);

  const handleCreateGame = async () => {

    const validationError = validateInput();
    console.log(validationError); 
  
    if (validationError) {
      setState(prev => ({ ...prev, error: validationError }));
  
      // Clear the error message after 1 second (1000 milliseconds)
      setTimeout(() => {
        setState(prev => ({ ...prev, error: null }));
      }, 1000);
  
      return;
    }
  
    setState(prev => ({ ...prev, error: null, success: null, loading: true }));
  
    try {
      await createGame(
        state.tokenAddress,
        state.betAmount,
        state.player1Choice,
        state.timeoutDuration
      );
  
      setState(prev => ({
        ...prev,
        success: 'Game created successfully!',
        loading: false,
        betAmount: '' // Reset bet amount after successful creation
      }));
  
      // Clear the success message after 5 seconds (5000 milliseconds)
      setTimeout(() => {
        setState(prev => ({ ...prev, success: null }));
      }, 5000);
  
      // Refresh token balance
      fetchTokenBalance();
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to create game',
        loading: false
      }));
  
      // Clear the error message after 1 second (1000 milliseconds)
      setTimeout(() => {
        setState(prev => ({ ...prev, error: null }));
      }, 1000);
    }
  };
  
  
  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <Coins className="w-8 h-8 text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-800">Create New Game</h2>
        </div>

        <div className="space-y-4">
          {/* Token Balance Card */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Available Balance</span>
              <span className="font-medium text-gray-700">
                {parseFloat(state.tokenBalance).toFixed(4)} {state.tokenSymbol}
              </span>
            </div>
          </div>

          {/* Bet Amount Input */}
          <div>
            <label htmlFor="betAmount" className="block text-sm font-medium text-gray-700 mb-1">
              Bet Amount
            </label>
            <div className="text-gray-700 relative">
              <input
                id="betAmount"
                type="number"
                step="0.000001"
                min="0"
                placeholder="0.00"
                value={state.betAmount}
                onChange={(e) => setState(prev => ({ ...prev, betAmount: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                {state.tokenSymbol}
              </span>
            </div>
          </div>

          {/* Token Selection */}
          <div>
            <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-1">
              Select Token
            </label>
            <select
              id="token"
              value={state.tokenAddress}
              onChange={(e) => setState(prev => ({ ...prev, tokenAddress: e.target.value }))}
              className="w-full text-gray-700 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            >
              {Object.entries(SUPPORTED_TOKENS).map(([key, value]) => (
                <option key={key} value={value}>
                  {key}
                </option>
              ))}
            </select>
          </div>

          {/* Timeout Duration */}
          <div>
            <label htmlFor="timeout" className="block text-sm font-medium text-gray-700 mb-1">
              Game Timeout
            </label>
            <select
              id="timeout"
              value={state.timeoutDuration}
              onChange={(e) => setState(prev => ({ ...prev, timeoutDuration: e.target.value }))}
              className="w-full text-gray-700 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            >
              <option value="300">5 minutes</option>
              <option value="3600">1 hour</option>
              <option value="86400">24 hours</option>
            </select>
          </div>

          {/* Player Choice */}
          <div className="flex items-center gap-2">
             <span className="ml-3 text-sm font-medium text-gray-700">Tails</span>
            
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={state.player1Choice}
                onChange={(e) => setState(prev => ({ ...prev, player1Choice: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              <span className="ml-3 text-sm font-medium text-gray-700">Heads</span>
            </label>
          </div>

          {/* Create Game Button */}
          <button
            onClick={handleCreateGame}
            disabled={state.loading || !isConnected}
            className={`w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 text-white font-medium transition-colors ${
              state.loading || !isConnected
                ? 'bg-indigo-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {state.loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Game...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Create Game
              </>
            )}
          </button>

          {/* Status Messages */}
          {state.error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-600">{state.error}</p>
            </div>
          )}

          {state.success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-600">{state.success}</p>
            </div>
          )}

          {/* Help Text */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-600">
              Create a new game by setting your bet amount and choosing heads or tails. The game will timeout if no one joins within the selected timeout period.
            </p>
          </div>
        </div>
      </div>
      <div>
       
      </div>
    </div>
  );
};

export default CreateGame