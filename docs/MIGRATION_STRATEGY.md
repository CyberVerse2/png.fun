# Migration Strategy: Database to Hybrid (Off-Chain + On-Chain)

## Overview
This document outlines the strategy for migrating png.fun from a pure database architecture to a hybrid model where critical financial and voting logic lives on-chain while maintaining off-chain storage for user profiles and media.

---

## Phase 1: Preparation (Current → Week 1)

### 1.1 Deploy Smart Contracts
- [ ] Deploy `MockWLD.sol` on World Chain Sepolia testnet
- [ ] Deploy `PngFunChallenge.sol` on World Chain Sepolia
- [ ] Verify contracts on Worldscan
- [ ] Test all contract functions via Remix/Etherscan

### 1.2 Set Up Web3 Infrastructure
- [ ] Install dependencies: `ethers`, `wagmi`, `viem`
- [ ] Create contract ABIs folder
- [ ] Set up Web3 provider (Alchemy/Infura for World Chain)
- [ ] Create contract interaction utilities

### 1.3 Database Updates
- [ ] Add `contract_address` column to `challenges` table
- [ ] Add `on_chain_submission_id` column to `submissions` table
- [ ] Add `on_chain_tx_hash` columns for tracking transactions
- [ ] Add `sync_status` enum ('pending', 'synced', 'failed')

```sql
-- Migration file: 007_add_blockchain_fields.sql
ALTER TABLE challenges ADD COLUMN contract_address TEXT;
ALTER TABLE challenges ADD COLUMN on_chain_challenge_id INTEGER;
ALTER TABLE challenges ADD COLUMN creation_tx_hash TEXT;

ALTER TABLE submissions ADD COLUMN on_chain_submission_id INTEGER;
ALTER TABLE submissions ADD COLUMN submission_tx_hash TEXT;

ALTER TABLE votes ADD COLUMN vote_tx_hash TEXT;
ALTER TABLE votes ADD COLUMN sync_status TEXT DEFAULT 'pending' 
  CHECK (sync_status IN ('pending', 'synced', 'failed'));
```

---

## Phase 2: Parallel Operation (Week 2-3)

### 2.1 Dual-Write Strategy
Run both systems in parallel:
- **Write to database** (existing flow)
- **Write to blockchain** (new flow)
- **Read from database** (for now - faster)

### 2.2 Challenge Creation Flow
```
Admin creates challenge
  ├─> Write to Supabase (existing)
  ├─> Approve WLD tokens
  └─> Call contract.createChallenge()
        ├─> Wait for confirmation
        ├─> Store tx hash in DB
        └─> Update on_chain_challenge_id
```

### 2.3 Submission Flow
```
User submits photo
  ├─> Upload to storage (existing)
  ├─> Hash photo with IPFS/keccak256
  ├─> Write to Supabase (existing)
  └─> Call contract.submitPhoto(challengeId, photoHash)
        ├─> Wait for confirmation
        └─> Store submission_tx_hash
```

### 2.4 Voting Flow
```
User votes on photo
  ├─> Approve WLD tokens (1 WLD per vote)
  ├─> Call contract.vote(submissionId, 1e18)
  │     ├─> Transfer WLD to contract
  │     └─> Update on-chain vote counts
  ├─> Wait for confirmation
  └─> Write to Supabase for redundancy
```

### 2.5 Finalization Flow
```
Cron job at challenge end
  ├─> Call contract.finalizeChallenge(challengeId)
  │     ├─> Contract determines winner
  │     ├─> Awards prize pool
  │     └─> Updates user stats
  ├─> Read winner from contract
  └─> Update Supabase with results
```

---

## Phase 3: Verification & Monitoring (Week 3-4)

### 3.1 Data Consistency Checks
Create monitoring scripts to ensure:
- Database vote counts match on-chain votes
- Challenge winners match between systems
- User balances are consistent

```javascript
// Example consistency check
async function verifyChallenge(challengeId) {
  const dbChallenge = await supabase
    .from('challenges')
    .select('*')
    .eq('id', challengeId)
    .single();
    
  const onChainId = dbChallenge.on_chain_challenge_id;
  const contractChallenge = await contract.getChallenge(onChainId);
  
  // Compare data
  assert(dbChallenge.winner_wallet === contractChallenge.winner);
  assert(dbChallenge.prize_pool === contractChallenge.prizePool);
}
```

### 3.2 Sync Failures
Handle failed blockchain transactions:
- Retry mechanism for failed txs
- Admin dashboard to view sync status
- Manual intervention for stuck transactions

---

## Phase 4: Gradual Migration (Week 4-6)

### 4.1 Make Blockchain Primary
- **Week 4**: Voting must go through blockchain (no DB-only votes)
- **Week 5**: Submissions must be on-chain
- **Week 6**: Challenges are blockchain-first

### 4.2 Database Becomes Cache
- Read from blockchain for critical data
- Use database for:
  - User profiles (username, avatar)
  - Photo URLs
  - UI performance (caching)
  - Analytics

### 4.3 Leaderboard Updates
```javascript
// Read from blockchain, cache in database
async function updateLeaderboard() {
  const users = await getAllUsers();
  
  for (const user of users) {
    const onChainStats = await contract.getUserStats(user.wallet_address);
    
    // Update database cache
    await supabase
      .from('users')
      .update({
        total_wins: onChainStats.totalWins,
        total_wld_earned: onChainStats.totalWLDEarned,
        current_streak: onChainStats.currentStreak,
        last_synced: new Date()
      })
      .eq('wallet_address', user.wallet_address);
  }
}
```

---

## Phase 5: Full Hybrid (Week 6+)

### 5.1 Final Architecture

```
┌─────────────────────────────────────────┐
│         Smart Contract (On-Chain)       │
│  ✓ Challenges (prize pools)            │
│  ✓ Submissions (hashes)                │
│  ✓ Voting (WLD transfers)              │
│  ✓ Rankings & Winners                  │
│  ✓ User Stats & Balances               │
└─────────────────────────────────────────┘
                    ↕️
┌─────────────────────────────────────────┐
│         API Layer (Backend)             │
│  ✓ Contract interaction helpers        │
│  ✓ Transaction signing                 │
│  ✓ Event listening                     │
│  ✓ Data synchronization                │
└─────────────────────────────────────────┘
                    ↕️
┌─────────────────────────────────────────┐
│         Supabase (Off-Chain Cache)      │
│  ✓ User profiles                       │
│  ✓ Photo URLs (or IPFS links)         │
│  ✓ Onboarding status                   │
│  ✓ UI cache for performance            │
│  ✓ Notifications                       │
└─────────────────────────────────────────┘
```

### 5.2 Data Flow Examples

**Challenge Creation:**
1. Admin calls API endpoint
2. API approves WLD & calls `contract.createChallenge()`
3. Transaction confirmed
4. API writes to Supabase with `on_chain_challenge_id`
5. Frontend reads from Supabase (cached data)

**Voting:**
1. User clicks vote in UI
2. Frontend calls `contract.vote()` via wallet
3. User approves WLD transaction
4. Transaction confirmed
5. API listens for `Voted` event
6. API updates Supabase cache
7. UI refreshes to show new vote count

**Leaderboard:**
1. Cron job runs every 10 minutes
2. Reads all user stats from contract
3. Updates Supabase cache
4. Frontend always reads from fast database
5. Shows "Last updated: X mins ago"

---

## Phase 6: Mainnet Deployment (Week 8+)

### 6.1 Pre-Deployment Checklist
- [ ] All contract functions tested thoroughly
- [ ] Security audit completed (recommended)
- [ ] Emergency pause functionality tested
- [ ] Backup plan for contract upgrades
- [ ] Monitor gas costs

### 6.2 Mainnet Migration
1. Deploy contracts to World Chain Mainnet
2. Update frontend with mainnet contract addresses
3. Use real WLD token: `0x2cfc85d8e48f8eab294be644d9e25c3030863003`
4. Announce to users (new system, better transparency)
5. Monitor closely for first week

### 6.3 Post-Deployment
- Set up block explorer monitoring
- Create admin dashboard for contract management
- Implement automated prize distribution
- Set up alerts for failed transactions

---

## Rollback Plan

If issues arise during migration:

1. **Can pause contract** (add pausable functionality)
2. **Database still has all data** (fallback)
3. **Funds can be withdrawn** by owner (emergency)
4. **Revert frontend** to database-only mode
5. **Investigate and fix** issues
6. **Resume migration** when ready

---

## Cost Estimates

### Gas Costs (World Chain Sepolia - Test)
- Create Challenge: ~0.001 ETH
- Submit Photo: ~0.0005 ETH
- Vote: ~0.0003 ETH
- Finalize Challenge: ~0.002 ETH

### Gas Costs (World Chain Mainnet - Estimate)
Similar to above, but with real ETH. World Chain has low gas fees.

### Monthly Costs (100 daily users)
- ~30 challenges/month: 0.03 ETH
- ~3000 submissions/month: 1.5 ETH
- ~10000 votes/month: 3 ETH
- **Total**: ~4.5 ETH/month (~$15K at current prices)

💡 **Optimization**: Batch operations or use Layer 2 scaling

---

## Benefits of Hybrid Approach

### ✅ Transparency
- All votes are public & verifiable
- Prize distribution is automated & trustless
- No admin can cheat the system

### ✅ Security
- Funds are locked in contract
- Winners determined by code
- Immutable vote records

### ✅ Performance
- Database caching keeps UI fast
- Blockchain ensures data integrity
- Best of both worlds

### ✅ User Experience
- World App makes blockchain invisible
- MiniKit handles signing seamlessly
- Users don't need to understand blockchain

---

## Next Steps

1. **Deploy to Sepolia** (this week)
2. **Test all flows** (next week)
3. **Internal testing** with small prize pools
4. **Public beta** with limited users
5. **Full production** on mainnet

---

## Resources

- World Chain Docs: https://docs.world.org/world-chain
- Contract Source: `/contracts/PngFunChallenge.sol`
- Integration Guide: `/docs/WEB3_INTEGRATION.md`
- API Examples: `/docs/API_EXAMPLES.md`

---

Last Updated: 2025-11-23
