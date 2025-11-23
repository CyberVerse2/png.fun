# png.fun Smart Contracts

Smart contracts for the png.fun daily photo challenge platform on World Chain.

---

## 📁 Contracts

### PngFunChallenge.sol
Main contract for managing daily photo challenges, submissions, voting, and prize distribution.

**Features:**
- ✅ Create daily challenges with WLD prize pools
- ✅ Submit photos (stored as hashes on-chain)
- ✅ Vote on submissions with WLD tokens
- ✅ Automatic winner determination based on votes
- ✅ Prize distribution to winners
- ✅ User statistics tracking (wins, earnings, streaks)

### MockWLD.sol
Mock WLD token for testing on Sepolia testnet.

**Features:**
- ✅ ERC20 compatible
- ✅ Faucet function (100 WLD per call)
- ✅ Standard approve/transfer functions

---

## 🚀 Quick Start

### Option 1: Deploy via Remix (Easiest)
1. Open [Remix IDE](https://remix.ethereum.org)
2. Follow [`docs/REMIX_DEPLOYMENT.md`](../docs/REMIX_DEPLOYMENT.md)
3. Copy contract code from this folder
4. Deploy to World Chain Sepolia
5. Update `.env.local` with contract addresses

### Option 2: Deploy via Foundry (Advanced)
```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Deploy MockWLD
forge create MockWLD \
  --rpc-url https://worldchain-sepolia.g.alchemy.com/public \
  --private-key $PRIVATE_KEY

# Deploy PngFunChallenge
forge create PngFunChallenge \
  --rpc-url https://worldchain-sepolia.g.alchemy.com/public \
  --private-key $PRIVATE_KEY \
  --constructor-args <MOCK_WLD_ADDRESS>
```

---

## 📖 Documentation

- **Migration Strategy**: [`docs/MIGRATION_STRATEGY.md`](../docs/MIGRATION_STRATEGY.md)
- **Web3 Integration**: [`docs/WEB3_INTEGRATION.md`](../docs/WEB3_INTEGRATION.md)
- **Remix Deployment**: [`docs/REMIX_DEPLOYMENT.md`](../docs/REMIX_DEPLOYMENT.md)

---

## 🌐 Networks

### Sepolia Testnet (Current)
- **Chain ID**: 4801
- **RPC**: https://worldchain-sepolia.g.alchemy.com/public
- **Explorer**: https://sepolia.worldscan.org
- **WLD**: Deploy MockWLD.sol

### Mainnet (Future)
- **Chain ID**: 480
- **RPC**: https://worldchain-mainnet.g.alchemy.com/public
- **Explorer**: https://worldscan.org
- **WLD**: `0x2cfc85d8e48f8eab294be644d9e25c3030863003`

---

## 🔧 Contract Addresses

After deployment, update these in your `.env.local`:

### Sepolia Testnet
```bash
NEXT_PUBLIC_MOCK_WLD_ADDRESS=0x...
NEXT_PUBLIC_PNG_FUN_CONTRACT_ADDRESS=0x...
```

### Mainnet (when deployed)
```bash
NEXT_PUBLIC_WLD_ADDRESS=0x2cfc85d8e48f8eab294be644d9e25c3030863003
NEXT_PUBLIC_PNG_FUN_CONTRACT_MAINNET=0x...
```

---

## 🎯 Key Functions

### For Admins
```solidity
createChallenge(title, description, duration, prizePool)
finalizeChallenge(challengeId)
cancelChallenge(challengeId) // emergency only
```

### For Users
```solidity
submitPhoto(challengeId, photoHash)
vote(submissionId, wldAmount)
claimWinnings()
```

### View Functions
```solidity
getChallenge(challengeId)
getChallengeSubmissions(challengeId)
getSubmission(submissionId)
getUserStats(userAddress)
hasUserVoted(submissionId, userAddress)
```

---

## 💡 Usage Examples

### Create a Challenge (Owner)
```typescript
import { createChallenge } from '@/lib/contracts/interactions';

const result = await createChallenge(
  "Sunset Photography",
  "Capture the most beautiful sunset",
  24, // 24 hours
  10  // 10 WLD prize
);
```

### Submit a Photo
```typescript
import { submitPhoto } from '@/lib/contracts/interactions';

const result = await submitPhoto(
  1, // challengeId
  photoDataUrl
);
```

### Vote for a Submission
```typescript
import { voteForSubmission } from '@/lib/contracts/interactions';

const result = await voteForSubmission(
  1, // submissionId
  1  // 1 WLD
);
```

---

## 🧪 Testing

Before mainnet deployment:

1. ✅ Deploy to Sepolia testnet
2. ✅ Test all functions in Remix
3. ✅ Create multiple test challenges
4. ✅ Submit test photos from different accounts
5. ✅ Vote and finalize challenges
6. ✅ Verify all events are emitted correctly
7. ✅ Check gas costs
8. ✅ **Get security audit** (recommended for mainnet)

---

## ⚠️ Security Considerations

### Current Implementation
- ✅ Reentrancy protection (using Checks-Effects-Interactions pattern)
- ✅ Access control (owner-only functions)
- ✅ Input validation
- ✅ Safe math (Solidity 0.8+)

### Before Mainnet
- [ ] Professional security audit
- [ ] Add emergency pause functionality
- [ ] Add timelock for owner functions
- [ ] Consider upgradeability pattern
- [ ] Extensive testing with real funds (testnet)

---

## 📊 Gas Optimization

Current gas costs (Sepolia estimates):

| Function | Gas Cost | WLD Cost @ $5 |
|----------|----------|---------------|
| Create Challenge | ~200k | $0.02 |
| Submit Photo | ~100k | $0.01 |
| Vote | ~80k | $0.008 |
| Finalize | ~300k | $0.03 |

**Note**: World Chain has low gas fees, making micro-transactions viable!

---

## 🔄 Upgrade Path

Current contracts are **not upgradeable**. For future versions:

1. Deploy new contract
2. Migrate data (or keep old contracts running)
3. Update frontend to use new addresses
4. Notify users

**Alternative**: Implement proxy pattern for upgradeability

---

## 📝 License

MIT License - see contract headers

---

## 🤝 Contributing

If you find issues or want to improve the contracts:

1. Open an issue
2. Describe the problem/improvement
3. Submit a PR with tests

---

## 📞 Support

- Documentation: `/docs` folder
- World Chain Docs: https://docs.world.org/world-chain
- Remix: https://remix.ethereum.org

---

**Ready to deploy? Start with [`docs/REMIX_DEPLOYMENT.md`](../docs/REMIX_DEPLOYMENT.md)! 🚀**
