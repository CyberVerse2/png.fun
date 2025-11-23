# Remix Deployment Guide

Step-by-step guide to deploy png.fun smart contracts on World Chain using Remix IDE.

---

## Prerequisites

1. **MetaMask installed** with World Chain Sepolia network added
2. **Test ETH** on World Chain Sepolia (for gas fees)
3. **Access to Remix IDE**: https://remix.ethereum.org

---

## Step 1: Add World Chain Sepolia to MetaMask

Click "Add Network" in MetaMask and enter:

```
Network Name: World Chain Sepolia
RPC URL: https://worldchain-sepolia.g.alchemy.com/public
Chain ID: 4801
Currency Symbol: ETH
Block Explorer: https://sepolia.worldscan.org
```

**Get Test ETH:**
1. Get Sepolia ETH from faucet: https://sepoliafaucet.com
2. Bridge to World Chain Sepolia: https://worldchain.org/bridge

---

## Step 2: Deploy MockWLD (Test Token)

### 2.1 Open Remix
Go to https://remix.ethereum.org

### 2.2 Create Contract File
1. In the File Explorer, click the "+" icon
2. Create `MockWLD.sol`
3. Copy the contract code from `/contracts/MockWLD.sol`

### 2.3 Compile Contract
1. Go to "Solidity Compiler" tab (icon with "S")
2. Select compiler version: `0.8.20` or higher
3. Click "Compile MockWLD.sol"
4. Ensure there are no errors

### 2.4 Deploy Contract
1. Go to "Deploy & Run Transactions" tab
2. Select Environment: **Injected Provider - MetaMask**
3. MetaMask will popup - select World Chain Sepolia
4. Select contract: **MockWLD**
5. Click **Deploy**
6. Confirm transaction in MetaMask
7. Wait for confirmation

### 2.5 Save Contract Address
After deployment, copy the contract address from the "Deployed Contracts" section.

**Example:** `0x1234...abcd`

Save this as `MOCK_WLD_ADDRESS`

### 2.6 Get Test WLD
In Remix, under "Deployed Contracts":
1. Expand your MockWLD contract
2. Find the `faucet` function
3. Click `faucet` button
4. Confirm transaction in MetaMask
5. You now have 100 test WLD!

---

## Step 3: Deploy PngFunChallenge Contract

### 3.1 Create Contract File
1. Create new file: `PngFunChallenge.sol`
2. Copy contract code from `/contracts/PngFunChallenge.sol`

### 3.2 Compile Contract
1. Go to "Solidity Compiler" tab
2. Compiler version: `0.8.20`
3. Click "Compile PngFunChallenge.sol"
4. Ensure no errors

### 3.3 Deploy Contract
1. Go to "Deploy & Run Transactions" tab
2. Environment: **Injected Provider - MetaMask**
3. Select contract: **PngFunChallenge**
4. In the constructor field, enter your MockWLD address:
   ```
   "0x1234...abcd"
   ```
   (Use the address from Step 2.5)
5. Click **Deploy**
6. Confirm transaction in MetaMask
7. Wait for confirmation

### 3.4 Save Contract Address
Copy the deployed PngFunChallenge address.

**Example:** `0x5678...efgh`

Save this as `PNG_FUN_CONTRACT_ADDRESS`

---

## Step 4: Test the Contracts

### 4.1 Approve WLD for Contract
Before creating a challenge, you need to approve the contract to spend your WLD.

In Remix, under MockWLD contract:
1. Find the `approve` function
2. Enter parameters:
   - `spender`: `0x5678...efgh` (PngFunChallenge address)
   - `amount`: `100000000000000000000` (100 WLD in wei)
3. Click **transact**
4. Confirm in MetaMask

### 4.2 Create a Test Challenge
In Remix, under PngFunChallenge contract:
1. Find the `createChallenge` function
2. Enter parameters:
   ```
   title: "Test Challenge"
   description: "Testing blockchain integration"
   duration: 86400 (24 hours in seconds)
   prizePool: 10000000000000000000 (10 WLD in wei)
   ```
3. Click **transact**
4. Confirm in MetaMask
5. Wait for confirmation

### 4.3 Verify Challenge Created
In Remix, under PngFunChallenge contract:
1. Find `challengeCounter` (should show 1)
2. Find `getChallenge` function
3. Enter `1` as challengeId
4. Click **call**
5. You should see your challenge details!

### 4.4 Submit a Test Photo
1. Generate a test photo hash:
   ```javascript
   // In browser console:
   const hash = ethers.keccak256(ethers.toUtf8Bytes("test-photo"));
   console.log(hash);
   ```
2. In PngFunChallenge contract, call `submitPhoto`:
   ```
   challengeId: 1
   photoHash: 0x... (hash from step 1)
   ```
3. Confirm transaction

### 4.5 Vote on Submission
1. First, approve more WLD (like step 4.1)
2. Call `vote`:
   ```
   submissionId: 1
   wldAmount: 1000000000000000000 (1 WLD in wei)
   ```
3. Confirm transaction

---

## Step 5: Verify Contracts on Worldscan

### 5.1 Go to Worldscan
Open https://sepolia.worldscan.org

### 5.2 Search Your Contract
Paste your `PNG_FUN_CONTRACT_ADDRESS` in search

### 5.3 Verify Contract
1. Click "Verify & Publish"
2. Select compiler: `0.8.20`
3. Paste contract code
4. If using multiple files, select "Standard JSON Input"
5. Submit for verification

---

## Step 6: Update Your Frontend

Add contract addresses to your `.env.local`:

```bash
NEXT_PUBLIC_NETWORK=sepolia
NEXT_PUBLIC_MOCK_WLD_ADDRESS=0x1234...abcd
NEXT_PUBLIC_PNG_FUN_CONTRACT_ADDRESS=0x5678...efgh
```

Restart your dev server:
```bash
npm run dev
```

---

## Step 7: Get Contract ABIs

### 7.1 In Remix
1. After compiling, go to "Solidity Compiler" tab
2. Click the "ABI" button under "Compilation Details"
3. Copy the entire ABI JSON

### 7.2 Save ABIs
Create `lib/contracts/abis/PngFunChallenge.ts`:

```typescript
export const PngFunChallengeABI = [
  // Paste the ABI here
] as const;
```

Do the same for MockWLD.

---

## Common Issues & Solutions

### Issue: Transaction Fails
- **Check**: Do you have enough ETH for gas?
- **Check**: Did you approve WLD tokens first?
- **Check**: Are you on the correct network?

### Issue: Cannot Find Contract
- **Check**: Did deployment transaction confirm?
- **Check**: Are you on World Chain Sepolia?
- **View**: Transaction hash on Worldscan

### Issue: "Insufficient Allowance"
- **Solution**: Call `approve` on WLD contract first
- **Amount**: Must be >= vote amount or prize pool

### Issue: "Already Submitted"
- **Reason**: Each user can only submit once per challenge
- **Solution**: Use a different wallet or create new challenge

---

## Gas Cost Reference

On World Chain Sepolia:
- Deploy MockWLD: ~0.002 ETH
- Deploy PngFunChallenge: ~0.005 ETH
- Create Challenge: ~0.001 ETH
- Submit Photo: ~0.0005 ETH
- Vote: ~0.0003 ETH

---

## Next Steps

After successful deployment:

1. ✅ Test all functions in Remix
2. ✅ Verify contracts on Worldscan
3. ✅ Update frontend with contract addresses
4. ✅ Create integration tests
5. ✅ Deploy to mainnet (when ready)

---

## Mainnet Deployment (Future)

When ready for production:

1. Add World Chain Mainnet to MetaMask:
   ```
   Network Name: World Chain
   RPC URL: https://worldchain-mainnet.g.alchemy.com/public
   Chain ID: 480
   Currency Symbol: ETH
   Block Explorer: https://worldscan.org
   ```

2. Use real WLD address in constructor:
   ```
   0x2cfc85d8e48f8eab294be644d9e25c3030863003
   ```

3. Get real ETH on World Chain

4. Deploy same way as testnet

5. **IMPORTANT**: Get contract audited before handling real funds!

---

## Resources

- Remix IDE: https://remix.ethereum.org
- World Chain Docs: https://docs.world.org/world-chain
- Worldscan (Sepolia): https://sepolia.worldscan.org
- Worldscan (Mainnet): https://worldscan.org
- MetaMask: https://metamask.io

---

**You're ready to deploy! 🚀**

Follow the steps carefully and test thoroughly before mainnet deployment.
