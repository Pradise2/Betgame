// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract PvpFlipGame is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    mapping(uint256 => Game) public games;
    uint256 public gameIdCounter;

    address public treasury;
    mapping(address => bool) public supportedTokens;
    mapping(address => string) public tokenNames;
    address[] public supportedTokenAddresses;
    mapping(address => uint256) public tokenIndex;

    struct Game {
        address player1;
        address player2;
        uint256 betAmount;
        address tokenAddress;
        bool isCompleted;
        bool player1Choice;
        uint256 createdAt; // Track game creation time
        uint256 timeoutDuration; // Store custom timeout duration
    }

    event GameCreated(uint256 gameId, address player1, uint256 betAmount, address tokenAddress, bool player1Choice);
    event GameJoined(uint256 gameId, address player1, address player2, uint256 betAmount, address tokenAddress);
    event GameResolved(uint256 gameId, address winner, uint256 payout, uint256 treasuryAmount);
    event TokenAdded(address tokenAddress, string tokenName);
    event TokenRemoved(address tokenAddress);

    constructor(address initialOwner) Ownable(initialOwner) {
        treasury = address(this);
    }

    modifier onlyPlayer1(uint256 gameId) {
        require(msg.sender == games[gameId].player1, "Only Player 1 can call this");
        _;
    }

    modifier gameExists(uint256 gameId) {
        require(games[gameId].player1 != address(0), "Game does not exist");
        _;
    }

    modifier gameNotCompleted(uint256 gameId) {
        require(!games[gameId].isCompleted, "Game already completed");
        _;
    }

    modifier tokenSupported(address tokenAddress) {
        require(supportedTokens[tokenAddress], "Token is not supported");
        _;
    }

    modifier gameExpired(uint256 gameId) {
        require(block.timestamp > games[gameId].createdAt + games[gameId].timeoutDuration, "Game has not expired yet");
        _;
    }

    function isContract(address addr) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(addr)
        }
        return size > 0;
    }

    function addSupportedToken(address tokenAddress, string calldata tokenName) external onlyOwner {
        require(!supportedTokens[tokenAddress], "Token already supported");
        require(tokenAddress != address(0), "Invalid token address");
        require(isContract(tokenAddress), "Address is not a contract");
        supportedTokens[tokenAddress] = true;
        tokenNames[tokenAddress] = tokenName;
        tokenIndex[tokenAddress] = supportedTokenAddresses.length;
        supportedTokenAddresses.push(tokenAddress);
        emit TokenAdded(tokenAddress, tokenName);
    }

    function removeSupportedToken(address tokenAddress) external onlyOwner {
        require(supportedTokens[tokenAddress], "Token not supported");
        supportedTokens[tokenAddress] = false;
        uint256 index = tokenIndex[tokenAddress];
        uint256 lastIndex = supportedTokenAddresses.length - 1;
        if (index != lastIndex) {
            address lastToken = supportedTokenAddresses[lastIndex];
            supportedTokenAddresses[index] = lastToken;
            tokenIndex[lastToken] = index;
        }
        supportedTokenAddresses.pop();
        emit TokenRemoved(tokenAddress);
    }

    function createGame(uint256 betAmount, address tokenAddress, bool player1Choice, uint256 timeoutDuration) external tokenSupported(tokenAddress) {
        require(betAmount > 0, "Bet amount must be greater than zero");
        require(isContract(tokenAddress), "Address is not a contract");

        IERC20 token = IERC20(tokenAddress);

        // Attempt to transfer betAmount from player1 to the treasury
        bool success = token.transferFrom(msg.sender, treasury, betAmount);
        require(success, "Token transfer failed or token is not ERC20 compliant");

        uint256 gameId = gameIdCounter++;
        games[gameId] = Game({
            player1: msg.sender,
            player2: address(0),
            betAmount: betAmount,
            tokenAddress: tokenAddress,
            isCompleted: false,
            player1Choice: player1Choice,
            createdAt: block.timestamp, // Track game creation time
            timeoutDuration: timeoutDuration // Store custom timeout duration
        });

        emit GameCreated(gameId, msg.sender, betAmount, tokenAddress, player1Choice);
    }

    function joinGame(uint256 gameId) external gameExists(gameId) gameNotCompleted(gameId) {
        Game storage game = games[gameId];
        require(block.timestamp <= game.createdAt + game.timeoutDuration, "Game has expired");
        require(game.player2 == address(0), "Game already has two players");
        require(msg.sender != game.player1, "Player 1 cannot join their own game");

        IERC20 token = IERC20(game.tokenAddress);
        uint256 betAmount = game.betAmount;

        // Attempt to transfer betAmount from player2 to the treasury
        bool success = token.transferFrom(msg.sender, treasury, betAmount);
        require(success, "Token transfer failed or token is not ERC20 compliant");

        game.player2 = msg.sender;
        emit GameJoined(gameId, game.player1, msg.sender, betAmount, game.tokenAddress);

        resolveGame(gameId);
    }

    function cancelExpiredGame(uint256 gameId) external gameExists(gameId) gameNotCompleted(gameId) onlyPlayer1(gameId) gameExpired(gameId) {
        Game storage game = games[gameId];
        IERC20 token = IERC20(game.tokenAddress);
        token.safeTransfer(game.player1, game.betAmount); // Refund Player 1
        game.isCompleted = true; // Mark the game as completed

        emit GameResolved(gameId, game.player1, game.betAmount, 0); // Emit event for cancellation
    }

    function resolveGame(uint256 gameId) internal gameExists(gameId) gameNotCompleted(gameId) nonReentrant {
        Game storage game = games[gameId];
        require(game.player2 != address(0), "Game does not have two players");

        // Collect data points for randomness
        uint256 player1Timestamp = game.createdAt;   // Player 1's game creation timestamp
        uint256 player2Timestamp = block.timestamp;  // Current block timestamp for Player 2
        uint256 blockNumber = block.number;           // Current block number
        bytes32 blockHash = blockhash(block.number - 1); // Block hash from the previous block

        // Combine the data points and hash them for randomness (Now excluding msg.sender or player addresses)
        uint256 combinedHash = uint256(keccak256(abi.encodePacked(
            player1Timestamp, 
            player2Timestamp, 
            blockNumber, 
            blockHash, 
            gameId
        )));

        // Derive the coin flip result from the combined hash
        bool coinFlipResult = (combinedHash % 2) == 1;
        bool didPlayer1Win = (coinFlipResult == game.player1Choice);

        // Payout and treasury calculation
        IERC20 token = IERC20(game.tokenAddress);
        uint256 winnerPayout = game.betAmount * 190 / 100;
        uint256 treasuryAmount = game.betAmount * 10 / 100;

        // Transfer payouts
        if (didPlayer1Win) {
            token.safeTransfer(game.player1, winnerPayout);
        } else {
            token.safeTransfer(game.player2, winnerPayout);
        }

        // Transfer the treasury cut
        token.safeTransfer(treasury, treasuryAmount);

        // Mark the game as completed
        game.isCompleted = true;

        // Emit event for the resolution of the game
        emit GameResolved(gameId, didPlayer1Win ? game.player1 : game.player2, winnerPayout, treasuryAmount);
    }

    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid treasury address");
        treasury = newTreasury;
    }

    function withdrawTreasuryFunds(address tokenAddress, uint256 amount) external onlyOwner {
        require(supportedTokens[tokenAddress], "Token not supported");
        IERC20 token = IERC20(tokenAddress);
        uint256 treasuryBalance = token.balanceOf(treasury);
        require(treasuryBalance >= amount, "Insufficient treasury balance");
        token.safeTransfer(msg.sender, amount);
    }

    function getSupportedTokens() external view returns (address[] memory) {
        return supportedTokenAddresses;
    }
}
