import { ethers } from 'ethers';
import { 
  getSigner, 
  getPngFunContract, 
  getPngFunContractWithSigner,
  getWLDContract,
  hashPhoto 
} from './pngFunContract';

// Create a new challenge (admin only)
export async function createChallenge(
  title: string,
  description: string,
  durationHours: number,
  prizePoolWLD: number
) {
  const signer = await getSigner();
  if (!signer) throw new Error('No signer available');
  
  const contract = await getPngFunContractWithSigner();
  const wldContract = await getWLDContract();
  
  // Convert WLD to wei (18 decimals)
  const prizePoolWei = ethers.parseEther(prizePoolWLD.toString());
  const durationSeconds = durationHours * 3600;
  
  // Step 1: Approve WLD
  console.log('Approving WLD...');
  // We need to connect the WLD contract to the signer
  const wldWithSigner = wldContract.connect(signer) as ethers.Contract;
  const approveTx = await wldWithSigner.approve(contract.target, prizePoolWei);
  await approveTx.wait();
  console.log('WLD approved');
  
  // Step 2: Create challenge
  console.log('Creating challenge...');
  const tx = await contract.createChallenge(
    title,
    description,
    durationSeconds,
    prizePoolWei
  );
  const receipt = await tx.wait();
  
  // Extract challenge ID from event
  const event = receipt.logs.find((log: any) => {
    try {
      return contract.interface.parseLog(log)?.name === 'ChallengeCreated';
    } catch {
      return false;
    }
  });
  
  const parsedLog = contract.interface.parseLog(event);
  const challengeId = parsedLog?.args[0];
  
  return {
    challengeId: Number(challengeId),
    txHash: receipt.hash
  };
}

// Submit a photo to a challenge
export async function submitPhoto(challengeId: number, photoDataUrl: string) {
  const signer = await getSigner();
  if (!signer) throw new Error('No signer available');
  
  const contract = await getPngFunContractWithSigner();
  
  // Hash the photo
  const photoHash = hashPhoto(photoDataUrl);
  
  console.log('Submitting photo to blockchain...');
  const tx = await contract.submitPhoto(challengeId, photoHash);
  const receipt = await tx.wait();
  
  // Extract submission ID from event
  const event = receipt.logs.find((log: any) => {
    try {
      return contract.interface.parseLog(log)?.name === 'SubmissionCreated';
    } catch {
      return false;
    }
  });
  
  const parsedLog = contract.interface.parseLog(event);
  const submissionId = parsedLog?.args[0];
  
  return {
    submissionId: Number(submissionId),
    photoHash,
    txHash: receipt.hash
  };
}

// Vote for a submission
export async function voteForSubmission(submissionId: number, wldAmount: number = 1) {
  const signer = await getSigner();
  if (!signer) throw new Error('No signer available');
  
  const contract = await getPngFunContractWithSigner();
  const wldContract = await getWLDContract();
  
  const voteAmountWei = ethers.parseEther(wldAmount.toString());
  
  // Step 1: Approve WLD
  console.log('Approving WLD for vote...');
  const wldWithSigner = wldContract.connect(signer) as ethers.Contract;
  const approveTx = await wldWithSigner.approve(contract.target, voteAmountWei);
  await approveTx.wait();
  console.log('WLD approved');
  
  // Step 2: Vote
  console.log('Submitting vote...');
  const tx = await contract.vote(submissionId, voteAmountWei);
  const receipt = await tx.wait();
  
  return {
    txHash: receipt.hash
  };
}

// Claim winnings
export async function claimWinnings() {
  const signer = await getSigner();
  if (!signer) throw new Error('No signer available');
  
  const contract = await getPngFunContractWithSigner();
  
  console.log('Claiming winnings...');
  const tx = await contract.claimWinnings();
  const receipt = await tx.wait();
  
  return {
    txHash: receipt.hash
  };
}

// Get challenge details
export async function getChallenge(challengeId: number) {
  const contract = await getPngFunContract();
  
  const [title, description, startTime, endTime, prizePool, winner, finalized] = 
    await contract.getChallenge(challengeId);
  
  return {
    id: challengeId,
    title,
    description,
    startTime: Number(startTime),
    endTime: Number(endTime),
    prizePool: ethers.formatEther(prizePool),
    winner,
    finalized
  };
}

// Get challenge submissions
export async function getChallengeSubmissions(challengeId: number) {
  const contract = await getPngFunContract();
  const submissionIds = await contract.getChallengeSubmissions(challengeId);
  
  const submissions = await Promise.all(
    submissionIds.map(async (id: bigint) => {
      const [user, challengeId, photoHash, voteCount, totalWLDVoted, timestamp] = 
        await contract.getSubmission(Number(id));
      
      return {
        id: Number(id),
        user,
        challengeId: Number(challengeId),
        photoHash,
        voteCount: Number(voteCount),
        totalWLDVoted: ethers.formatEther(totalWLDVoted),
        timestamp: Number(timestamp)
      };
    })
  );
  
  return submissions;
}

// Get user stats
export async function getUserStats(userAddress: string) {
  const contract = await getPngFunContract();
  
  const [totalWins, totalWLDEarned, currentStreak, lastWinTimestamp] = 
    await contract.userStats(userAddress);
    
  const pendingWinnings = await contract.userBalances(userAddress);
  
  return {
    totalWins: Number(totalWins),
    totalWLDEarned: ethers.formatEther(totalWLDEarned),
    currentStreak: Number(currentStreak),
    pendingWinnings: ethers.formatEther(pendingWinnings)
  };
}

// Check if user has voted
export async function hasUserVoted(submissionId: number, userAddress: string) {
  const contract = await getPngFunContract();
  return await contract.hasUserVoted(submissionId, userAddress);
}
