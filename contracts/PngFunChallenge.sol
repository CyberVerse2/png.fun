// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PngFunChallenge
 * @notice Daily photo challenge contract with WLD token prizes
 * @dev Manages challenges, submissions, voting, and prize distribution on World Chain
 */

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
}

contract PngFunChallenge {
    // WLD token address on World Chain Mainnet
    // For Sepolia testnet, you'll need to use a test token or deploy a mock ERC20
    IERC20 public immutable wldToken;
    
    address public owner;
    uint256 public challengeCounter;
    
    // Structs
    struct Challenge {
        uint256 id;
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        uint256 prizePool;
        address winner;
        bool finalized;
        bool cancelled;
    }
    
    struct Submission {
        address user;
        uint256 challengeId;
        bytes32 photoHash; // IPFS hash or content hash
        uint256 voteCount;
        uint256 totalWLDVoted;
        uint256 timestamp;
        bool exists;
    }
    
    struct Vote {
        address voter;
        uint256 submissionId;
        uint256 wldAmount;
        uint256 timestamp;
    }
    
    struct UserStats {
        uint256 totalWins;
        uint256 totalWLDEarned;
        uint256 currentStreak;
        uint256 lastWinTimestamp;
    }
    
    // Storage
    mapping(uint256 => Challenge) public challenges;
    mapping(uint256 => Submission) public submissions; // submissionId => Submission
    mapping(uint256 => uint256[]) public challengeSubmissions; // challengeId => submissionIds[]
    mapping(address => mapping(uint256 => uint256)) public userChallengeSubmission; // user => challengeId => submissionId
    mapping(uint256 => mapping(address => bool)) public hasVoted; // submissionId => voter => bool
    mapping(address => UserStats) public userStats;
    mapping(address => uint256) public userBalances; // User WLD balances in contract
    
    uint256 public submissionCounter;
    uint256 public constant MIN_CHALLENGE_DURATION = 1 hours;
    uint256 public constant MAX_CHALLENGE_DURATION = 7 days;
    uint256 public constant MIN_VOTE_AMOUNT = 1 ether; // 1 WLD (assuming 18 decimals)
    
    // Events
    event ChallengeCreated(uint256 indexed challengeId, string title, uint256 prizePool, uint256 endTime);
    event SubmissionCreated(uint256 indexed submissionId, uint256 indexed challengeId, address indexed user, bytes32 photoHash);
    event Voted(uint256 indexed submissionId, address indexed voter, uint256 wldAmount);
    event ChallengeFinalized(uint256 indexed challengeId, address winner, uint256 prizeAmount);
    event WinningsClaimed(address indexed user, uint256 amount);
    event ChallengeCancelled(uint256 indexed challengeId);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier challengeExists(uint256 challengeId) {
        require(challengeId > 0 && challengeId <= challengeCounter, "Challenge does not exist");
        _;
    }
    
    modifier challengeActive(uint256 challengeId) {
        Challenge storage challenge = challenges[challengeId];
        require(block.timestamp >= challenge.startTime, "Challenge not started");
        require(block.timestamp < challenge.endTime, "Challenge ended");
        require(!challenge.finalized, "Challenge finalized");
        require(!challenge.cancelled, "Challenge cancelled");
        _;
    }
    
    constructor(address _wldToken) {
        require(_wldToken != address(0), "Invalid token address");
        wldToken = IERC20(_wldToken);
        owner = msg.sender;
    }
    
    /**
     * @notice Create a new daily challenge
     * @param title Challenge title
     * @param description Challenge description
     * @param duration Duration in seconds
     * @param prizePool Prize pool in WLD (must approve contract first)
     */
    function createChallenge(
        string memory title,
        string memory description,
        uint256 duration,
        uint256 prizePool
    ) external onlyOwner returns (uint256) {
        require(duration >= MIN_CHALLENGE_DURATION && duration <= MAX_CHALLENGE_DURATION, "Invalid duration");
        require(prizePool > 0, "Prize pool must be positive");
        require(bytes(title).length > 0, "Title required");
        
        // Transfer prize pool to contract
        require(wldToken.transferFrom(msg.sender, address(this), prizePool), "Prize transfer failed");
        
        challengeCounter++;
        uint256 challengeId = challengeCounter;
        
        challenges[challengeId] = Challenge({
            id: challengeId,
            title: title,
            description: description,
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            prizePool: prizePool,
            winner: address(0),
            finalized: false,
            cancelled: false
        });
        
        emit ChallengeCreated(challengeId, title, prizePool, block.timestamp + duration);
        
        return challengeId;
    }
    
    /**
     * @notice Submit a photo to a challenge
     * @param challengeId The challenge ID
     * @param photoHash IPFS hash or content hash of the photo
     */
    function submitPhoto(uint256 challengeId, bytes32 photoHash) 
        external 
        challengeExists(challengeId) 
        challengeActive(challengeId) 
        returns (uint256) 
    {
        require(photoHash != bytes32(0), "Invalid photo hash");
        require(userChallengeSubmission[msg.sender][challengeId] == 0, "Already submitted");
        
        submissionCounter++;
        uint256 submissionId = submissionCounter;
        
        submissions[submissionId] = Submission({
            user: msg.sender,
            challengeId: challengeId,
            photoHash: photoHash,
            voteCount: 0,
            totalWLDVoted: 0,
            timestamp: block.timestamp,
            exists: true
        });
        
        challengeSubmissions[challengeId].push(submissionId);
        userChallengeSubmission[msg.sender][challengeId] = submissionId;
        
        emit SubmissionCreated(submissionId, challengeId, msg.sender, photoHash);
        
        return submissionId;
    }
    
    /**
     * @notice Vote for a submission with WLD
     * @param submissionId The submission to vote for
     * @param wldAmount Amount of WLD to vote (must approve contract first)
     */
    function vote(uint256 submissionId, uint256 wldAmount) external {
        require(submissions[submissionId].exists, "Submission does not exist");
        require(wldAmount >= MIN_VOTE_AMOUNT, "Vote amount too small");
        require(!hasVoted[submissionId][msg.sender], "Already voted");
        
        Submission storage submission = submissions[submissionId];
        uint256 challengeId = submission.challengeId;
        Challenge storage challenge = challenges[challengeId];
        
        require(block.timestamp < challenge.endTime, "Challenge ended");
        require(!challenge.finalized, "Challenge finalized");
        require(submission.user != msg.sender, "Cannot vote for yourself");
        
        // Transfer WLD from voter to contract
        require(wldToken.transferFrom(msg.sender, address(this), wldAmount), "Vote transfer failed");
        
        // Update submission stats
        submission.voteCount++;
        submission.totalWLDVoted += wldAmount;
        
        // Mark as voted
        hasVoted[submissionId][msg.sender] = true;
        
        // Award WLD to submission owner (they can claim later)
        userBalances[submission.user] += wldAmount;
        
        emit Voted(submissionId, msg.sender, wldAmount);
    }
    
    /**
     * @notice Finalize a challenge and determine winner
     * @param challengeId The challenge to finalize
     */
    function finalizeChallenge(uint256 challengeId) external onlyOwner challengeExists(challengeId) {
        Challenge storage challenge = challenges[challengeId];
        require(block.timestamp >= challenge.endTime, "Challenge not ended");
        require(!challenge.finalized, "Already finalized");
        require(!challenge.cancelled, "Challenge cancelled");
        
        // Find winner (submission with most WLD votes)
        uint256[] memory submissionIds = challengeSubmissions[challengeId];
        require(submissionIds.length > 0, "No submissions");
        
        uint256 winningSubmissionId = submissionIds[0];
        uint256 highestVotes = submissions[submissionIds[0]].totalWLDVoted;
        
        for (uint256 i = 1; i < submissionIds.length; i++) {
            if (submissions[submissionIds[i]].totalWLDVoted > highestVotes) {
                highestVotes = submissions[submissionIds[i]].totalWLDVoted;
                winningSubmissionId = submissionIds[i];
            }
        }
        
        address winner = submissions[winningSubmissionId].user;
        challenge.winner = winner;
        challenge.finalized = true;
        
        // Award prize pool to winner
        userBalances[winner] += challenge.prizePool;
        
        // Update stats
        UserStats storage stats = userStats[winner];
        stats.totalWins++;
        stats.totalWLDEarned += challenge.prizePool + submissions[winningSubmissionId].totalWLDVoted;
        
        // Update streak
        if (stats.lastWinTimestamp > 0 && block.timestamp - stats.lastWinTimestamp <= 2 days) {
            stats.currentStreak++;
        } else {
            stats.currentStreak = 1;
        }
        stats.lastWinTimestamp = block.timestamp;
        
        emit ChallengeFinalized(challengeId, winner, challenge.prizePool);
    }
    
    /**
     * @notice Claim accumulated WLD winnings
     */
    function claimWinnings() external {
        uint256 amount = userBalances[msg.sender];
        require(amount > 0, "No winnings to claim");
        
        userBalances[msg.sender] = 0;
        require(wldToken.transfer(msg.sender, amount), "Claim transfer failed");
        
        emit WinningsClaimed(msg.sender, amount);
    }
    
    /**
     * @notice Cancel a challenge and refund prize pool (owner only, emergency)
     */
    function cancelChallenge(uint256 challengeId) external onlyOwner challengeExists(challengeId) {
        Challenge storage challenge = challenges[challengeId];
        require(!challenge.finalized, "Already finalized");
        require(!challenge.cancelled, "Already cancelled");
        
        challenge.cancelled = true;
        
        // Refund prize pool to owner
        require(wldToken.transfer(owner, challenge.prizePool), "Refund failed");
        
        emit ChallengeCancelled(challengeId);
    }
    
    // View functions
    
    /**
     * @notice Get all submissions for a challenge
     */
    function getChallengeSubmissions(uint256 challengeId) 
        external 
        view 
        challengeExists(challengeId) 
        returns (uint256[] memory) 
    {
        return challengeSubmissions[challengeId];
    }
    
    /**
     * @notice Get submission details
     */
    function getSubmission(uint256 submissionId) 
        external 
        view 
        returns (
            address user,
            uint256 challengeId,
            bytes32 photoHash,
            uint256 voteCount,
            uint256 totalWLDVoted,
            uint256 timestamp
        ) 
    {
        Submission storage sub = submissions[submissionId];
        require(sub.exists, "Submission does not exist");
        return (sub.user, sub.challengeId, sub.photoHash, sub.voteCount, sub.totalWLDVoted, sub.timestamp);
    }
    
    /**
     * @notice Get user's submission for a challenge
     */
    function getUserSubmission(address user, uint256 challengeId) external view returns (uint256) {
        return userChallengeSubmission[user][challengeId];
    }
    
    /**
     * @notice Check if user has voted for a submission
     */
    function hasUserVoted(uint256 submissionId, address user) external view returns (bool) {
        return hasVoted[submissionId][user];
    }
    
    /**
     * @notice Get user statistics
     */
    function getUserStats(address user) 
        external 
        view 
        returns (
            uint256 totalWins,
            uint256 totalWLDEarned,
            uint256 currentStreak,
            uint256 pendingWinnings
        ) 
    {
        UserStats storage stats = userStats[user];
        return (stats.totalWins, stats.totalWLDEarned, stats.currentStreak, userBalances[user]);
    }
    
    /**
     * @notice Get challenge details
     */
    function getChallenge(uint256 challengeId) 
        external 
        view 
        challengeExists(challengeId) 
        returns (
            string memory title,
            string memory description,
            uint256 startTime,
            uint256 endTime,
            uint256 prizePool,
            address winner,
            bool finalized
        ) 
    {
        Challenge storage challenge = challenges[challengeId];
        return (
            challenge.title,
            challenge.description,
            challenge.startTime,
            challenge.endTime,
            challenge.prizePool,
            challenge.winner,
            challenge.finalized
        );
    }
}
