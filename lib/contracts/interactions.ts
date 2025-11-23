import { ethers } from 'ethers';
import {
  getSigner,
  getPngFunContract,
  getPngFunContractWithSigner,
  getWLDContract,
  hashPhoto,
  CURRENT_NETWORK,
  PngFunChallengeABI,
} from './pngFunContract';

/**
 * Create a new challenge (admin only)
 */
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

  const prizePoolWei = ethers.parseEther(prizePoolWLD.toString());
  const durationSeconds = durationHours * 3600;

  // Approve WLD for the contract to pull the prize pool
  console.log('Approving WLD...');
  const wldWithSigner = wldContract.connect(signer) as ethers.Contract;
  const approveTx = await wldWithSigner.approve(contract.target, prizePoolWei);
  await approveTx.wait();
  console.log('WLD approved');

  // Create challenge
  console.log('Creating challenge...');
  const tx = await contract.createChallenge(
    title,
    description,
    durationSeconds,
    prizePoolWei
  );
  const receipt = await tx.wait();

  const event = receipt.logs.find((log: any) => {
    try {
      return contract.interface.parseLog(log)?.name === 'ChallengeCreated';
    } catch {
      return false;
    }
  });
  const parsedLog = contract.interface.parseLog(event);
  const challengeId = parsedLog?.args[0];

  return { challengeId: Number(challengeId) };
}

/**
 * Submit a photo to a challenge using MiniKit.
 * Works inside World App where a direct signer is unavailable.
 */
export async function submitPhoto(challengeId: number, photoDataUrl: string) {
  const photoHash = hashPhoto(photoDataUrl);

  // Lazy‑load MiniKit to avoid bundling it for non‑MiniKit builds
  const { MiniKit } = await import('@worldcoin/minikit-js');

  const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
    transaction: [
      {
        address: CURRENT_NETWORK.pngFunChallenge,
        abi: PngFunChallengeABI,
        functionName: 'submitPhoto',
        args: [challengeId, photoHash],
      },
    ],
  });

  return {
    transactionId: (finalPayload as any).transactionId,
    photoHash,
  };
}

// MiniKit vote for a submission (used in Mini Apps)
export async function voteOnSubmissionMiniKit(submissionId: number, wldAmount: number = 1) {
  const { MiniKit } = await import('@worldcoin/minikit-js');
  const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
    transaction: [
      {
        address: CURRENT_NETWORK.pngFunChallenge,
        abi: PngFunChallengeABI,
        functionName: 'vote',
        args: [submissionId, ethers.parseEther(wldAmount.toString())],
      },
    ],
  });
  return { transactionId: (finalPayload as any).transactionId };
}

/**
 * Vote for a submission. Handles WLD approval then calls the contract.
 */
export async function voteForSubmission(
  submissionId: number,
  wldAmount: number = 1
) {
  const signer = await getSigner();
  if (!signer) throw new Error('No signer available');

  const contract = await getPngFunContractWithSigner();
  const wldContract = await getWLDContract();

  const voteAmountWei = ethers.parseEther(wldAmount.toString());

  // Approve WLD for the contract
  console.log('Approving WLD for vote...');
  const wldWithSigner = wldContract.connect(signer) as ethers.Contract;
  const approveTx = await wldWithSigner.approve(contract.target, voteAmountWei);
  await approveTx.wait();
  console.log('WLD approved');

  // Submit vote
  console.log('Submitting vote...');
  const tx = await contract.vote(submissionId, voteAmountWei);
  const receipt = await tx.wait();

  return { txHash: receipt.hash };
}

/**
 * Claim any pending winnings for the connected user.
 */
export async function claimWinnings() {
  const signer = await getSigner();
  if (!signer) throw new Error('No signer available');

  const contract = await getPngFunContractWithSigner();
  console.log('Claiming winnings...');
  const tx = await contract.claimWinnings();
  const receipt = await tx.wait();

  return { txHash: receipt.hash };
}

/**
 * Retrieve challenge details (read‑only).
 */
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
    finalized,
  };
}

/**
 * List all submissions for a given challenge.
 */
export async function getChallengeSubmissions(challengeId: number) {
  const contract = await getPngFunContract();
  const submissionIds = await contract.getChallengeSubmissions(challengeId);

  const submissions = await Promise.all(
    submissionIds.map(async (id: bigint) => {
      const [user, chId, photoHash, voteCount, totalWLDVoted, timestamp] =
        await contract.getSubmission(Number(id));
      return {
        id: Number(id),
        user,
        challengeId: Number(chId),
        photoHash,
        voteCount: Number(voteCount),
        totalWLDVoted: ethers.formatEther(totalWLDVoted),
        timestamp: Number(timestamp),
      };
    })
  );

  return submissions;
}

/**
 * Get statistics for a specific user address.
 */
export async function getUserStats(userAddress: string) {
  const contract = await getPngFunContract();
  const [totalWins, totalWLDEarned, currentStreak, lastWinTimestamp] =
    await contract.userStats(userAddress);
  const pendingWinnings = await contract.userBalances(userAddress);

  return {
    totalWins: Number(totalWins),
    totalWLDEarned: ethers.formatEther(totalWLDEarned),
    currentStreak: Number(currentStreak),
    pendingWinnings: ethers.formatEther(pendingWinnings),
  };
}

/**
 * Check whether a user has already voted on a submission.
 */
export async function hasUserVoted(
  submissionId: number,
  userAddress: string
) {
  const contract = await getPngFunContract();
  return await contract.hasUserVoted(submissionId, userAddress);
}
