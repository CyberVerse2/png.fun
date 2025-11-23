import { ethers } from 'ethers';

declare global {
  interface Window {
    ethereum?: any;
  }
}

import { CURRENT_NETWORK } from './config';
import { MockWLDABI } from './abis/MockWLD';
import { PngFunChallengeABI } from '@/lib/contracts/abis/PngFunChallenge';

// Initialize provider
export function getProvider() {
  if (typeof window !== 'undefined' && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  return new ethers.JsonRpcProvider(CURRENT_NETWORK.rpcUrl);
}

// Get contract instance (read-only)
export async function getPngFunContract() {
  const provider = getProvider();
  // If provider is BrowserProvider, we need to get signer or provider
  const runner = provider instanceof ethers.BrowserProvider ? await provider.getSigner() : provider;
  
  return new ethers.Contract(
    CURRENT_NETWORK.pngFunChallenge,
    PngFunChallengeABI,
    runner
  );
}

// Get contract instance with signer (for writing)
export async function getPngFunContractWithSigner() {
  const provider = getProvider();
  if (!(provider instanceof ethers.BrowserProvider)) {
    throw new Error("No wallet connected");
  }
  const signer = await provider.getSigner();
  return new ethers.Contract(
    CURRENT_NETWORK.pngFunChallenge,
    PngFunChallengeABI,
    signer
  );
}

export async function getWLDContract() {
  const provider = getProvider();
  const runner = provider instanceof ethers.BrowserProvider ? await provider.getSigner() : provider;

  const wldAddress = 'wld' in CURRENT_NETWORK
    ? CURRENT_NETWORK.wld
    : CURRENT_NETWORK.mockWLD;
    
  return new ethers.Contract(wldAddress, MockWLDABI, runner);
}

// Helper to get signer
export async function getSigner() {
  if (typeof window === 'undefined' || !window.ethereum) return null;
  const provider = new ethers.BrowserProvider(window.ethereum);
  return await provider.getSigner();
}

// Hash a photo (for storing on-chain)
export function hashPhoto(photoDataUrl: string): string {
  // Remove data URL prefix if present
  const base64Data = photoDataUrl.includes(',') ? photoDataUrl.split(',')[1] : photoDataUrl;
  const bytes = ethers.toUtf8Bytes(base64Data);
  return ethers.keccak256(bytes);
}
export { CURRENT_NETWORK, PngFunChallengeABI };

