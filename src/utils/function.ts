import { ethers } from 'ethers';
import { ABI, ADDRESS } from '../contracts/contract';
import { GameStat } from '../components/interface';

// utils/function.ts

export const SUPPORTED_TOKENS = {
  STABLEAI: '0x07F41412697D14981e770b6E335051b1231A2bA8',
  DIG: '0x208561379990f106E6cD59dDc14dFB1F290016aF',
  WEB9: '0x09CA293757C6ce06df17B96fbcD9c5f767f4b2E1',
  BNKR: '0x22aF33FE49fD1Fa80c7149773dDe5890D3c76F3b',
  FED: '0x19975a01B71D4674325bd315E278710bc36D8e5f',
  TestToken: '0x54939A9F8084b6D3362BD987dE7E0CD2e96462DC',
  GLD: '0xA908e6B941f07c126B0eB9DFb8bA168FAFAD66b9',
};


// Set up provider and contract for public access (read-only)
export const publicProvider = new ethers.JsonRpcProvider(
  'https://base-mainnet.infura.io/v3/b17a040a14bc48cfb3928a73d26f3617'
);
// Set up WebSocket provider for real-time event handling
export const publicWsProvider = new ethers.WebSocketProvider(
  'wss://base-mainnet.infura.io/ws/v3/b17a040a14bc48cfb3928a73d26f3617'
);

export const publicContract = new ethers.Contract(ADDRESS, ABI, publicProvider);

export const publicWsContract = new ethers.Contract(ADDRESS, ABI, publicWsProvider);
// Function to set up signer and contract for wallet interaction
async function setupContractWithSigner() {
  try {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum as unknown as ethers.Eip1193Provider);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(ADDRESS, ABI, signer);
      console.log('Signer and contract setup completed.');
      return { signer, contract };
    } else {
      throw new Error('Ethereum provider is not available. Please install a wallet like MetaMask.');
    }
  } catch (error) {
    console.error('Error setting up contract with signer:', error);
    throw error;
  }
}

// Function to create a game with token approval, balance check, and game creation all within one function
export const createGame = async (
  betAmount: string,
  tokenAddress: string,
  player1Choice: boolean,
  timeoutDuration: number
) => {
  try {
    const { signer, contract } = await setupContractWithSigner();
    const playerAddress = await signer.getAddress(); // Added player address
    console.log('Player address:', playerAddress);

    console.log('Creating game with amount:', betAmount, 'and token address:', tokenAddress);

    // Update token contract ABI for ERC-20 tokens
    const tokenABI = [
      'function approve(address spender, uint256 amount) public returns (bool)',
      'function balanceOf(address owner) public view returns (uint256)',
      'function symbol() view returns (string)',
    ];

    const tokenContract = new ethers.Contract(tokenAddress, tokenABI, signer);
    console.log('Token contract initialized:', tokenContract.address);

    // Convert betAmount to the correct token decimals (18 decimals)
    const betAmountInWei = ethers.parseUnits(betAmount, 18);
    console.log('Converted bet amount to Wei:', betAmountInWei.toString());

    // Step 1: Check Player 1's balance to make sure they have enough tokens
    const balance = await tokenContract.balanceOf(playerAddress);
    console.log('Player balance:', balance.toString());

    const Symbol = await tokenContract.symbol();
    console.log('Token symbol:', Symbol);

    if (balance <(betAmountInWei)) { // Use BigNumber comparison
      const errorMessage = 'Not enough tokens to create game';
      console.error(errorMessage);
      throw new Error(errorMessage);
    }

    // Step 2: Approve the contract to spend the tokens
    console.log(`Approving contract to spend ${betAmountInWei.toString()} tokens...`);
    const approveTx = await tokenContract.approve(ADDRESS, betAmountInWei);
    await approveTx.wait();
    console.log('Token approval successful.');

    // Step 3: Create the game
    console.log('Calling contract to create the game...');
    const tx = await contract.createGame(betAmountInWei, tokenAddress, player1Choice, timeoutDuration);
    console.log('Transaction sent, awaiting confirmation...');
    const receipt = await tx.wait();  // Ensure the transaction is mined
    console.log('Transaction receipt:', receipt);

    
    return {
      transactionHash: receipt.hash,
      gameId: receipt,  // Ensure you have the gameId
      playerAddress, // Return player address as well
      betAmount: ethers.formatUnits(betAmountInWei, 18),
      tokenAddress,
      player1Choice,
      timeoutDuration,
      Symbol,
      
    };
    
  } catch (error) {
    console.error('Error creating game:', error);
    throw error; // Rethrow error to handle in calling code
  }
};


// Function to get game details
export const getFullGameDetails = async (gameId: number) => {
  try {
    // Fetch game details
    const game = await publicContract.getFullGameDetails(gameId);
    console.log('Game details:', game);

    // Fetch token details (name and symbol)
    const tokenContract = new ethers.Contract(
      game.tokenAddress, 
      ['function balanceOf(address owner) view returns (uint256)', 'function name() view returns (string)', 'function symbol() view returns (string)'], 
      publicProvider
    );

    // Fetch token name and symbol with error handling
    const tokenName = await tokenContract.name().catch(err => {
      console.error('Error fetching token name:', err);
      return 'Unknown Token'; // Fallback value in case of error
    });

    const tokenSymbol = await tokenContract.symbol().catch(err => {
      console.error('Error fetching token symbol:', err);
      return 'Unknown Symbol'; // Fallback value in case of error
    });

    // Fetch player2's token balance and handle potential errors
    let player2BalanceInEther = '0';
    try {
      const player2Balance = await tokenContract.balanceOf(game.player2);
      player2BalanceInEther = ethers.formatUnits(player2Balance, 18); // Convert from Wei to Ether
      console.log('Player 2 Token Balance:', player2BalanceInEther);
    } catch (balanceErr) {
      console.error('Error fetching player2 balance:', balanceErr);
      player2BalanceInEther = '0'; // Fallback value in case of error
    }

    // Fetch additional game details: state, winner, winAmount
    const state = game.state.toNumber ? game.state.toNumber() : 0; // Default to 'Unknown' if state is undefined
    const winner = game.winner || 'None'; // Default to 'None' if no winner
    const winAmount = game.winAmount ? ethers.formatUnits(game.winAmount) : '0'; // Convert winAmount from Wei to Ether, fallback to '0'

    // Format the data for the game details
    const formattedGameDetails: GameStat = {
      betAmount: ethers.formatUnits(game.betAmount), // Convert betAmount from Wei to Ether
      tokenAddress: game.tokenAddress,
      isCompleted: game.isCompleted,
      player1Choice: game.player1Choice,
      createdAt: typeof game.createdAt === 'bigint' 
        ? Number(game.createdAt) // Convert BigInt to Number if necessary
        : game.createdAt, // If already a number, use it as is
      tokenName: tokenName,
      tokenSymbol: tokenSymbol,
      player2Balance: player2BalanceInEther,
      player1: game.player1,
      state: state, // Add state
      winner: winner, // Add winner
      winAmount: winAmount, // Add winAmount
      player2: game.player2, // Add player2
      timeduration: game.timeduration,
    };

    console.log('Formatted Game Details:', formattedGameDetails);
    return formattedGameDetails;

  } catch (error) {
    console.error('Error fetching game details:', error);
    throw new Error(`Failed to fetch details for game ID: ${gameId}`);
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
    console.error('Error fetching game details:', error);
    throw error; // Rethrow error to be handled by calling function
  }
};
