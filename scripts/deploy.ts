import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

// Manually load environment variables from .env.local
function loadEnv() {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const envConfig = fs.readFileSync(envPath, 'utf8');
      envConfig.split('\n').forEach((line) => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
          process.env[key] = value;
        }
      });
    }
  } catch (e) {
    console.warn('Could not load .env.local');
  }
}

loadEnv();

async function main() {
  console.log('Starting deployment...');

  // Configuration
  const RPC_URL = process.env.NEXT_PUBLIC_NETWORK === 'mainnet' 
    ? 'https://worldchain-mainnet.g.alchemy.com/public'
    : 'https://worldchain-sepolia.g.alchemy.com/public';
    
  const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
  
  // WLD Token Addresses
  const WLD_MAINNET = '0x2cfc85d8e48f8eab294be644d9e25c3030863003';
  const WLD_SEPOLIA = '0x8FD73bCA4cA6EEE4A4a3797951F969a2088FD786'; // MockWLD
  
  const WLD_ADDRESS = process.env.NEXT_PUBLIC_NETWORK === 'mainnet' ? WLD_MAINNET : WLD_SEPOLIA;

  if (!PRIVATE_KEY) {
    console.error('❌ DEPLOYER_PRIVATE_KEY not found in .env.local');
    process.exit(1);
  }

  // Connect to provider
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log(`Deploying from address: ${wallet.address}`);
  console.log(`Network: ${process.env.NEXT_PUBLIC_NETWORK || 'sepolia'}`);
  console.log(`WLD Token: ${WLD_ADDRESS}`);

  // Read artifacts
  const artifactsDir = path.join(process.cwd(), 'artifacts');
  const abiPath = path.join(artifactsDir, 'contracts_PngFunChallenge_sol_PngFunChallenge.abi');
  const binPath = path.join(artifactsDir, 'contracts_PngFunChallenge_sol_PngFunChallenge.bin');

  if (!fs.existsSync(abiPath) || !fs.existsSync(binPath)) {
    console.error('❌ Artifacts not found. Please run compilation first.');
    process.exit(1);
  }

  const abi = fs.readFileSync(abiPath, 'utf8');
  const bytecode = fs.readFileSync(binPath, 'utf8');

  // Deploy
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  
  try {
    console.log('Deploying contract...');
    const contract = await factory.deploy(WLD_ADDRESS);
    
    console.log(`Transaction hash: ${contract.deploymentTransaction()?.hash}`);
    console.log('Waiting for confirmation...');
    
    await contract.waitForDeployment();
    
    const address = await contract.getAddress();
    console.log(`✅ PngFunChallenge deployed to: ${address}`);
    
    console.log('\nIMPORTANT: Update lib/contracts/config.ts with this new address!');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
