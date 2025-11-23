# Web3 Integration Guide for png.fun

This guide shows how to integrate the PngFunChallenge smart contract with your existing Next.js application.

---

## Prerequisites

```bash
npm install ethers@^6.9.0
# or
npm install viem wagmi @tanstack/react-query
```

---

## 1. Setup Contract Configuration

Create a contract configuration file:

```typescript
// lib/contracts/config.ts

export const CONTRACTS = {
  sepolia: {
    mockWLD: '0x...', // Deploy MockWLD first
    pngFunChallenge: '0x...', // Then deploy PngFunChallenge
    chainId: 4801,
    rpcUrl: 'https://worldchain-sepolia.g.alchemy.com/public',
  },
  mainnet: {
    wld: '0x2cfc85d8e48f8eab294be644d9e25c3030863003',
    pngFunChallenge: '0x...', // Mainnet deployment
    chainId: 480,
    rpcUrl: 'https://worldchain-mainnet.g.alchemy.com/public',
  }
};

export const CURRENT_NETWORK = process.env.NEXT_PUBLIC_NETWORK === 'mainnet' 
  ? CONTRACTS.mainnet 
  : CONTRACTS.sepolia;
```

---

## 2. Contract ABIs

Save these after deploying your contracts:

```typescript
// lib/contracts/abis/PngFunChallenge.ts

export const PngFunChallengeABI = [
  // Add full ABI here after compiling contract
  // You can get this from Remix after compilation
  {
    "inputs": [{"internalType": "address", "name": "_wldToken", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "title", "type": "string"},
      {"internalType": "string", "name": "description", "type": "string"},
      {"internalType": "uint256", "name": "duration", "type": "uint256"},
      {"internalType": "uint256", "name": "prizePool", "type": "uint256"}
    ],
    "name": "createChallenge",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "challengeId", "type": "uint256"},
      {"internalType": "bytes32", "name": "photoHash", "type": "bytes32"}
    ],
    "name": "submitPhoto",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "submissionId", "type": "uint256"},
      {"internalType": "uint256", "name": "wldAmount", "type": "uint256"}
    ],
    "name": "vote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // ... add all other functions
] as const;

export const MockWLDABI = [
  {
    "inputs": [],
    "name": "faucet",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "spender", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // ... ERC20 standard functions
] as const;
```

---

## 3. Contract Helper Functions

Create utility functions for contract interactions:

```typescript
// lib/contracts/pngFunContract.ts

import { ethers } from 'ethers';
import { CURRENT_NETWORK } from './config';
import { PngFunChallengeABI, MockWLDABI } from './abis/PngFunChallenge';

// Initialize provider
export function getProvider() {
  return new ethers.JsonRpcProvider(CURRENT_NETWORK.rpcUrl);
}

// Get contract instance (read-only)
export function getPngFunContract() {
  const provider = getProvider();
  return new ethers.Contract(
    CURRENT_NETWORK.pngFunChallenge,
    PngFunChallengeABI,
    provider
  );
}

// Get contract instance with signer (for writing)
export function getPngFunContractWithSigner(signer: ethers.Signer) {
  return new ethers.Contract(
    CURRENT_NETWORK.pngFunChallenge,
    PngFunChallengeABI,
    signer
  );
}

export function getWLDContract() {
  const provider = getProvider();
  const wldAddress = process.env.NEXT_PUBLIC_NETWORK === 'mainnet'
    ? CURRENT_NETWORK.wld
    : CURRENT_NETWORK.mockWLD;
    
  return new ethers.Contract(wldAddress, MockWLDABI, provider);
}

export function getWLDContractWithSigner(signer: ethers.Signer) {
  const wldAddress = process.env.NEXT_PUBLIC_NETWORK === 'mainnet'
    ? CURRENT_NETWORK.wld
    : CURRENT_NETWORK.mockWLD;
    
  return new ethers.Contract(wldAddress, MockWLDABI, signer);
}

// Helper to get signer from MiniKit
export async function getSigner() {
  if (typeof window === 'undefined') return null;
  
  const provider = new ethers.BrowserProvider(window.ethereum);
  return await provider.getSigner();
}

// Hash a photo (for storing on-chain)
export function hashPhoto(photoDataUrl: string): string {
  // Remove data URL prefix
  const base64Data = photoDataUrl.split(',')[1];
  const bytes = ethers.toUtf8Bytes(base64Data);
  return ethers.keccak256(bytes);
}
```

---

## 4. Contract Interaction Functions

```typescript
// lib/contracts/interactions.ts

import { ethers } from 'ethers';
import { 
  getSigner, 
  getPngFunContract, 
  getPngFunContractWithSigner,
  getWLDContractWithSigner,
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
  
  const contract = getPngFunContractWithSigner(signer);
  const wldContract = getWLDContractWithSigner(signer);
  
  // Convert WLD to wei (18 decimals)
  const prizePoolWei = ethers.parseEther(prizePoolWLD.toString());
  const durationSeconds = durationHours * 3600;
  
  // Step 1: Approve WLD
  console.log('Approving WLD...');
  const approveTx = await wldContract.approve(contract.target, prizePoolWei);
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
  
  const challengeId = contract.interface.parseLog(event)?.args[0];
  
  return {
    challengeId: Number(challengeId),
    txHash: receipt.hash
  };
}

// Submit a photo to a challenge
export async function submitPhoto(challengeId: number, photoDataUrl: string) {
  const signer = await getSigner();
  if (!signer) throw new Error('No signer available');
  
  const contract = getPngFunContractWithSigner(signer);
  
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
  
  const submissionId = contract.interface.parseLog(event)?.args[0];
  
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
  
  const contract = getPngFunContractWithSigner(signer);
  const wldContract = getWLDContractWithSigner(signer);
  
  const voteAmountWei = ethers.parseEther(wldAmount.toString());
  
  // Step 1: Approve WLD
  console.log('Approving WLD for vote...');
  const approveTx = await wldContract.approve(contract.target, voteAmountWei);
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
  
  const contract = getPngFunContractWithSigner(signer);
  
  console.log('Claiming winnings...');
  const tx = await contract.claimWinnings();
  const receipt = await tx.wait();
  
  return {
    txHash: receipt.hash
  };
}

// Get challenge details
export async function getChallenge(challengeId: number) {
  const contract = getPngFunContract();
  
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
  const contract = getPngFunContract();
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
  const contract = getPngFunContract();
  
  const [totalWins, totalWLDEarned, currentStreak, pendingWinnings] = 
    await contract.getUserStats(userAddress);
  
  return {
    totalWins: Number(totalWins),
    totalWLDEarned: ethers.formatEther(totalWLDEarned),
    currentStreak: Number(currentStreak),
    pendingWinnings: ethers.formatEther(pendingWinnings)
  };
}

// Check if user has voted
export async function hasUserVoted(submissionId: number, userAddress: string) {
  const contract = getPngFunContract();
  return await contract.hasUserVoted(submissionId, userAddress);
}
```

---

## 5. Integration in UI Components

Example of how to use these functions in your components:

```typescript
// Example: components/challenge-submit.tsx

'use client';

import { useState } from 'react';
import { submitPhoto } from '@/lib/contracts/interactions';
import { useUser } from '@/components/minikit-provider';

export function ChallengeSubmit({ challengeId, onChainChallengeId }: { 
  challengeId: string; 
  onChainChallengeId: number;
}) {
  const [submitting, setSubmitting] = useState(false);
  const user = useUser();
  
  const handleSubmit = async (photoDataUrl: string) => {
    if (!user.walletAddress) {
      alert('Please connect wallet first');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // 1. Submit to blockchain
      const { submissionId, photoHash, txHash } = await submitPhoto(
        onChainChallengeId, 
        photoDataUrl
      );
      
      console.log('Blockchain submission successful:', { submissionId, txHash });
      
      // 2. Submit to database (with on-chain reference)
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId,
          userId: user.id,
          photoData: photoDataUrl,
          onChainSubmissionId: submissionId,
          photoHash,
          submissionTxHash: txHash
        })
      });
      
      if (!response.ok) throw new Error('Database submission failed');
      
      alert('Photo submitted successfully!');
      
    } catch (error) {
      console.error('Submission failed:', error);
      alert('Failed to submit photo. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <button onClick={() => handleSubmit()} disabled={submitting}>
      {submitting ? 'Submitting...' : 'Submit Photo'}
    </button>
  );
}
```

```typescript
// Example: components/vote-button.tsx

'use client';

import { useState } from 'react';
import { voteForSubmission } from '@/lib/contracts/interactions';

export function VoteButton({ 
  submissionId, 
  onChainSubmissionId 
}: { 
  submissionId: string;
  onChainSubmissionId: number;
}) {
  const [voting, setVoting] = useState(false);
  
  const handleVote = async () => {
    try {
      setVoting(true);
      
      // 1. Vote on blockchain
      const { txHash } = await voteForSubmission(onChainSubmissionId, 1);
      
      console.log('Blockchain vote successful:', txHash);
      
      // 2. Update database
      await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          voteTxHash: txHash,
          wldAmount: 1
        })
      });
      
      alert('Vote submitted!');
      
    } catch (error) {
      console.error('Vote failed:', error);
      alert('Failed to vote. Please try again.');
    } finally {
      setVoting(false);
    }
  };
  
  return (
    <button onClick={handleVote} disabled={voting}>
      {voting ? 'Voting...' : 'Vote (1 WLD)'}
    </button>
  );
}
```

---

## 6. API Route Updates

Update your API routes to handle blockchain data:

```typescript
// app/api/submissions/route.ts

export async function POST(req: NextRequest) {
  const { 
    challengeId, 
    userId, 
    photoData,
    onChainSubmissionId, // NEW
    photoHash,           // NEW
    submissionTxHash     // NEW
  } = await req.json();
  
  // Insert into database
  const { data, error } = await supabase
    .from('submissions')
    .insert({
      challenge_id: challengeId,
      user_id: userId,
      photo_url: photoData,
      on_chain_submission_id: onChainSubmissionId,
      photo_hash: photoHash,
      submission_tx_hash: submissionTxHash,
      sync_status: 'synced'
    })
    .select()
    .single();
  
  if (error) {
    console.error('Database insert failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ submission: data });
}
```

---

## 7. Testing Checklist

Before going live:

- [ ] Deploy MockWLD on Sepolia
- [ ] Get test WLD from faucet
- [ ] Deploy PngFunChallenge on Sepolia
- [ ] Update contract addresses in config
- [ ] Test creating a challenge
- [ ] Test submitting a photo
- [ ] Test voting
- [ ] Test finalizing challenge
- [ ] Test claiming winnings
- [ ] Verify all transactions on Worldscan

---

## 8. Environment Variables

Add to `.env.local`:

```bash
# Network
NEXT_PUBLIC_NETWORK=sepolia # or mainnet

# Contract Addresses (Sepolia)
NEXT_PUBLIC_MOCK_WLD_ADDRESS=0x...
NEXT_PUBLIC_PNG_FUN_CONTRACT_ADDRESS=0x...

# Contract Addresses (Mainnet)
NEXT_PUBLIC_WLD_ADDRESS=0x2cfc85d8e48f8eab294be644d9e25c3030863003
NEXT_PUBLIC_PNG_FUN_CONTRACT_MAINNET=0x...

# RPC (optional, using public by default)
NEXT_PUBLIC_WORLD_CHAIN_RPC=https://worldchain-sepolia.g.alchemy.com/public
```

---

## Resources

- Ethers.js Docs: https://docs.ethers.org/v6/
- World Chain Docs: https://docs.world.org/world-chain
- Remix IDE: https://remix.ethereum.org
- Worldscan (Sepolia): https://sepolia.worldscan.org

---

Ready to deploy! 🚀
