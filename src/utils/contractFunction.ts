// src/FlipGame.ts

// src/FlipGame.ts

import { ethers } from 'ethers';
import { ABI, ADDRESS } from '../contracts/contract';

export const SUPPORTED_TOKENS = {
  STABLEAI: '0x07F41412697D14981e770b6E335051b1231A2bA8',
  DIG: '0x208561379990f106E6cD59dDc14dFB1F290016aF',
  WEB9: '0x09CA293757C6ce06df17B96fbcD9c5f767f4b2E1',
  BNKR: '0x22aF33FE49fD1Fa80c7149773dDe5890D3c76F3b',
  FED: '0x19975a01B71D4674325bd315E278710bc36D8e5f',
  TestToken: '0x54939A9F8084b6D3362BD987dE7E0CD2e96462DC',
};

// Set up provider and contract for public access (read-only)
export const publicProvider = new ethers.JsonRpcProvider(
  'https://base-mainnet.infura.io/v3/b17a040a14bc48cfb3928a73d26f3617'
);
export const publicContract = new ethers.Contract(ADDRESS, ABI, publicProvider);

// Function to set up signer and contract for wallet interaction
async function setupContractWithSigner() {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(ADDRESS, ABI, signer);
    return { signer, contract };
  } catch (error) {
    console.error('Error setting up contract with signer:', error);
    throw error;
  }
}

// Get the state of a specific game
export async function getGameState(gameId: number) {
  try {
    const contract = publicContract; // Using the public contract
    const gameState = await contract.getGameState(gameId);
    return {
      player1: gameState[0],
      player2: gameState[1],
      betAmount: ethers.formatUnits(gameState[2], 18), // assuming 18 decimals
      tokenAddress: gameState[3],
      state: gameState[4].toString(),  // Enum value as a string
      winner: gameState[5],
      winAmount: ethers.formatUnits(gameState[6], 18), // assuming 18 decimals
    };
  } catch (error) {
    console.error('Error fetching game state:', error);
    throw error;
  }
}

// Check if a player has withdrawn their reward for a specific game
export async function hasPlayerWithdrawn(gameId: number, player: string) {
  try {
    const contract = publicContract; // Using the public contract
    const hasWithdrawn = await contract.hasPlayerWithdrawn(gameId, player);
    return hasWithdrawn;
  } catch (error) {
    console.error('Error checking if player has withdrawn:', error);
    throw error;
  }
}


// Define the GameDetails interface
interface GameDetails {
  betAmount: string;
  tokenAddress: string;
  isCompleted: boolean;
  player1Choice: boolean;
  createdAt: number;
  tokenName: string;
  tokenSymbol: string;
  player2Balance: string;
  player1: string;
}


// Function to handle contract errors with additional info
interface ContractError extends Error {
  code?: string;
  transaction?: any;
  revert?: string;
}

function handleContractError(error: ContractError) {
  if (error.code === 'CALL_EXCEPTION') {
    console.error('Transaction data:', error.transaction);
    if (error.revert) {
      console.error('Revert reason:', error.revert);
    }
  } else if (error.code === 'ACTION_REJECTED') {
    console.error('User rejected the action:', error);
  } else {
    console.error('Unexpected error:', error);
  }
}

// Function to create a new game
export const createGame = async (
  tokenAddress: string, 
  betAmount: string, 
  player1Choice: boolean, // Add player1Choice parameter
  timeoutDuration: string  // Add timeoutDuration parameter (in seconds)
  ) => {
  try {
    const { signer, contract } = await setupContractWithSigner();

    console.log('Creating game with amount:', betAmount, 'and token address:', tokenAddress);

    // Create token contract instance
    const tokenContract = new ethers.Contract(tokenAddress, [
      'function approve(address spender, uint256 amount) public returns (bool)',
      'function balanceOf(address owner) public view returns (uint256)',
    ], signer);

    console.log('Token contract:', tokenContract);
    // Convert betAmount to the correct token decimals (18 decimals)
    const betAmountInWei = ethers.parseUnits(betAmount, 18);
console.log('betAmountInWei:', betAmountInWei.toString());
    // Step 1: Check Player 1's balance to make sure they have enough tokens
    const balance = await tokenContract.balanceOf(await signer.getAddress());
    console.log('Player balance:', balance.toString());  // Log the balance to check if it returns a BigInt
console.log('balance:', balance.toString());

    if (balance < (betAmountInWei)) {
      const errorMessage = 'Not enough tokens to create game';
      console.error(errorMessage);
      throw new Error(errorMessage);
    }

    // Step 2: Approve the contract to spend the tokens
    const approveTx = await tokenContract.approve(ADDRESS, betAmountInWei);
    await approveTx.wait();
    console.log('Token approved successfully.');

    // Step 3: Call createGame to create the game
    const tx = await contract.createGame(betAmountInWei, tokenAddress, player1Choice, timeoutDuration);
    await tx.wait();
    console.log('Game created successfully:', tx);

  } catch (error) {
    console.error('Error creating game:', error);
    handleContractError(error as ContractError);
  }
};

// Join an existing game
export const joinGame = async (gameId: number) => {
  try {
    console.log('Attempting to join game with ID:', gameId);

    // Set up contract with signer
    const { signer, contract } = await setupContractWithSigner();

    console.log('Contract:', contract);
    console.log('Signer:', signer);

    // Fetch game details
    const game = await contract.games(gameId);
    console.log('Fetched game details:', game);

    // Check if the game has already been completed
    if (game.isCompleted) {
      console.log(`Game with ID ${gameId} has already been completed.`);
      alert('Game has already been completed.');
      return;
    }

    // Create token contract instance
    const tokenContract = new ethers.Contract(game.tokenAddress, [
      'function approve(address spender, uint256 amount) public returns (bool)',
      'function balanceOf(address owner) public view returns (uint256)',
    ], signer);

    // Step 1: Check Player 2's balance to make sure they have enough tokens
    const balance = await tokenContract.balanceOf(await signer.getAddress());
    console.log('Player balance main:', balance);

    // Fetch the player's balance using the provider
    const playerAddress = await signer.getAddress();
    console.log('Player address:', playerAddress);

    const playerBalance = await signer.provider.getBalance(playerAddress);
    console.log('Player balance:', playerBalance.toString());

    console.log('game.betAmount:', game.betAmount);

    if (balance < game.betAmount) {
      console.log(`Player does not have enough balance to join the game.`);
      alert('You do not have enough balance to join the game.');
      return;
    }

    // Step 2: Approve the contract to spend the tokens
    const approveTx = await tokenContract.approve(ADDRESS, game.betAmount);
    await approveTx.wait();
    console.log('Token approved successfully.');

    // Step 3: Get the current nonce
    const currentNonce = await signer.getNonce();
    console.log('Current nonce:', currentNonce);

    // Send the transaction to join the game
    const tx = await contract.joinGame(gameId, { nonce: currentNonce });

    const currentTime = Math.floor(Date.now() / 1000); // Convert to seconds
const timeElapsed = currentTime - tx.startTime;

if (timeElapsed < 20) {
  alert(`Wait for ${20 - timeElapsed} more seconds before joining.`);
  return;
}
    const receipt = await tx.wait();
     console.log('Transaction sent! Hash:', tx.hash);
    if (receipt.status === 1) {
      console.log(`Successfully joined game with ID: ${gameId}`);
      alert(`Successfully joined game with ID: ${gameId}`);
    } else {
      console.log(`Transaction failed for Game ID: ${gameId}`);
      alert(`Transaction failed for Game ID: ${gameId}`);
    }
  } catch (error) {
    console.error('Error joining game:', error);
    alert('An error occurred. Check the console for details.');
  }
};

// resolve an existing game
export const resolveGame = async (gameId: number) => {
  try {
    console.log('Attempting to join game with ID:', gameId);

    // Set up contract with signer
    const { signer, contract } = await setupContractWithSigner();

    console.log('Contract:', contract);
    console.log('Signer:', signer);

    // Fetch game details
    const game = await contract.games(gameId);
    console.log('Fetched game details:', game);

    // Check if the game has already been completed
    if (game.isCompleted) {
      console.log(`Game with ID ${gameId} has already been completed.`);
      alert('Game has already been completed.');
      return;
    }

    // Create token contract instance
    const tokenContract = new ethers.Contract(game.tokenAddress, [
      'function approve(address spender, uint256 amount) public returns (bool)',
      'function balanceOf(address owner) public view returns (uint256)',
    ], signer);

    // Step 1: Check Player 2's balance to make sure they have enough tokens
    const balance = await tokenContract.balanceOf(await signer.getAddress());
    console.log('Player balance main:', balance);

    // Fetch the player's balance using the provider
    const playerAddress = await signer.getAddress();
    console.log('Player address:', playerAddress);

    const playerBalance = await signer.provider.getBalance(playerAddress);
    console.log('Player balance:', playerBalance.toString());

    console.log('game.betAmount:', game.betAmount);

    if (balance < game.betAmount) {
      console.log(`Player does not have enough balance to join the game.`);
      alert('You do not have enough balance to join the game.');
      return;
    }

    // Step 2: Approve the contract to spend the tokens
    const approveTx = await tokenContract.approve(ADDRESS, game.betAmount);
    await approveTx.wait();
    console.log('Token approved successfully.');

    // Step 3: Get the current nonce
    const currentNonce = await signer.getNonce();
    console.log('Current nonce:', currentNonce);

    // Send the transaction to join the game
    const tx = await contract.joinGame(gameId, { nonce: currentNonce });

    const currentTime = Math.floor(Date.now() / 1000); // Convert to seconds
const timeElapsed = currentTime - tx.startTime;

if (timeElapsed < 20) {
  alert(`Wait for ${20 - timeElapsed} more seconds before joining.`);
  return;
}
    const receipt = await tx.wait();
     console.log('Transaction sent! Hash:', tx.hash);
    if (receipt.status === 1) {
      console.log(`Successfully joined game with ID: ${gameId}`);
      alert(`Successfully joined game with ID: ${gameId}`);
    } else {
      console.log(`Transaction failed for Game ID: ${gameId}`);
      alert(`Transaction failed for Game ID: ${gameId}`);
    }
  } catch (error) {
    console.error('Error joining game:', error);
    alert('An error occurred. Check the console for details.');
  }
};


//claimReward an existing game
export const claimReward = async (gameId: number) => {
  try {
    console.log('Attempting to join game with ID:', gameId);

    // Set up contract with signer
    const { signer, contract } = await setupContractWithSigner();

    console.log('Contract:', contract);
    console.log('Signer:', signer);

    // Fetch game details
    const game = await contract.games(gameId);
    console.log('Fetched game details:', game);

    // Check if the game has already been completed
    if (game.isCompleted) {
      console.log(`Game with ID ${gameId} has already been completed.`);
      alert('Game has already been completed.');
      return;
    }

    // Create token contract instance
    const tokenContract = new ethers.Contract(game.tokenAddress, [
      'function approve(address spender, uint256 amount) public returns (bool)',
      'function balanceOf(address owner) public view returns (uint256)',
    ], signer);

    // Step 1: Check Player 2's balance to make sure they have enough tokens
    const balance = await tokenContract.balanceOf(await signer.getAddress());
    console.log('Player balance main:', balance);

    // Fetch the player's balance using the provider
    const playerAddress = await signer.getAddress();
    console.log('Player address:', playerAddress);

    const playerBalance = await signer.provider.getBalance(playerAddress);
    console.log('Player balance:', playerBalance.toString());

    console.log('game.betAmount:', game.betAmount);

    if (balance < game.betAmount) {
      console.log(`Player does not have enough balance to join the game.`);
      alert('You do not have enough balance to join the game.');
      return;
    }

    // Step 2: Approve the contract to spend the tokens
    const approveTx = await tokenContract.approve(ADDRESS, game.betAmount);
    await approveTx.wait();
    console.log('Token approved successfully.');

    // Step 3: Get the current nonce
    const currentNonce = await signer.getNonce();
    console.log('Current nonce:', currentNonce);

    // Send the transaction to join the game
    const tx = await contract.joinGame(gameId, { nonce: currentNonce });

    const currentTime = Math.floor(Date.now() / 1000); // Convert to seconds
const timeElapsed = currentTime - tx.startTime;

if (timeElapsed < 20) {
  alert(`Wait for ${20 - timeElapsed} more seconds before joining.`);
  return;
}
    const receipt = await tx.wait();
     console.log('Transaction sent! Hash:', tx.hash);
    if (receipt.status === 1) {
      console.log(`Successfully joined game with ID: ${gameId}`);
      alert(`Successfully joined game with ID: ${gameId}`);
    } else {
      console.log(`Transaction failed for Game ID: ${gameId}`);
      alert(`Transaction failed for Game ID: ${gameId}`);
    }
  } catch (error) {
    console.error('Error joining game:', error);
    alert('An error occurred. Check the console for details.');
  }
};

// Function to cancel a game by its gameId
export async function cancelGame(gameId: number) {
  try {
     // Set up contract with signer
     const { signer, contract } = await setupContractWithSigner();
     console.log('Signer:', signer);

    // Call the cancelGame function on the smart contract
    const tx = await contract.cancelGame(gameId);
    
    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    
    console.log('Game cancelled successfully:', receipt);
    return receipt;
  } catch (error) {
    console.error('Error cancelling the game:', error);
    throw error;
  }
}



// Async function to fetch the game details
export const getGameDetails = async (gameId: number): Promise<GameDetails> => {
  try {
    // Fetch game details using the contract call (using ethers.js syntax)
    const gameDetails = await publicContract.games(gameId);
    console.log('Raw game details:', gameDetails);  // Log all details
    
    // Check the type of createdAt before using .toNumber()
    console.log('Created At value:', gameDetails.createdAt);
    console.log('Type of createdAt:', typeof gameDetails.createdAt);

    // Fetch token details (name and symbol)
    const tokenContract = new ethers.Contract(gameDetails.tokenAddress, 
      ['function balanceOf(address owner) view returns (uint256)',"function name() view returns (string)", "function symbol() view returns (string)"], 
      publicProvider);

    const tokenName = await tokenContract.name().catch(err => {
      console.error('Error fetching token name:', err);
      return 'Unknown Token';
    });

    const tokenSymbol = await tokenContract.symbol().catch(err => {
      console.error('Error fetching token symbol:', err);
      return 'Unknown Symbol';
    });

         // Fetch the balance for player1 (you can adjust to check either player1 or player2)
    const player2Balance = await tokenContract.balanceOf(gameDetails.player2);
    const player2BalanceInEther = ethers.formatUnits(player2Balance, 18); // Convert balance to a human-readable format
    console.log('Player 2 Token Balance:', player2BalanceInEther);

    // Format the data (e.g., converting from Wei to Ether)
    const formattedGameDetails: GameDetails = {
      betAmount: ethers.formatUnits(gameDetails.betAmount), // Convert betAmount from Wei to Ether
      tokenAddress: gameDetails.tokenAddress,
      isCompleted: gameDetails.isCompleted,
      player1Choice: gameDetails.player1Choice,
      createdAt: typeof gameDetails.createdAt === 'bigint'
        ? Number(gameDetails.createdAt) // if it's BigInt, convert it to number
        : gameDetails.createdAt, // if it's already a number, just use it
      tokenName: tokenName,
      tokenSymbol: tokenSymbol,
      player2Balance: player2BalanceInEther,
      player1: gameDetails.player1,
    };


console.log('game det', gameDetails)
    console.log("Formatted Game Details:", formattedGameDetails);
    return formattedGameDetails;
  } catch (error) {
    console.error("Error fetching game details:", error);
    throw error;
  }
};

// Function to get the time left to expire for a game
export const getTimeLeftToExpire = async (gameId: number) => {
  try {
    // Fetch game data
    const game = await publicContract.games(gameId);
    const createdAt = game.createdAt; // Timestamp when the game was created
    const timeoutDuration = game.timeoutDuration; // Timeout duration for the game (from the Game struct)

    // Convert BigInt to number (if applicable)
    const createdAtNumber = typeof createdAt === 'bigint' ? Number(createdAt) : createdAt;
    const timeoutDurationNumber = typeof timeoutDuration === 'bigint' ? Number(timeoutDuration) : timeoutDuration;

    // Get current time in seconds
    const currentTime = Math.floor(Date.now() / 1000);

    // Calculate the expiration time
    const expirationTime = createdAtNumber + timeoutDurationNumber;

    // Calculate the time left before expiration
    const timeLeft = expirationTime - currentTime;

    if (timeLeft <= 0) {
      // If the game has expired, return null or an indication of expiration
      return null;
    }

    // Format time left to expire into hours, minutes, and seconds
    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;

    return { hours, minutes, seconds };

  } catch (error) {
    console.error('Error fetching game info:', error);
    throw new Error('Failed to retrieve game expiration details');
  }
};

// Function to get the current game ID counter (using the public contract for read-only access)
export const getGameIdCounter = async () => {
  try {
    const count = await publicContract.gameIdCounter(); // Using publicContract for read-only access
    console.log('Current game ID counter:', count);
    const counter = Number(count);
    return counter;
  } catch (error) {
    handleContractError(error as ContractError);
    return 0; // Return 0 or appropriate fallback value
  }
};
