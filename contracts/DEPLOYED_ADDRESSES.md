# Contract Addresses

## World Chain Sepolia Testnet

Deployed on: 2025-11-23

### PngFunChallenge Contract
**Address:** `0x8FD73bCA4cA6EEE4A4a3797951F969a2088FD786`
**Explorer:** https://worldchain-sepolia.explorer.alchemy.com/address/0x8FD73bCA4cA6EEE4A4a3797951F969a2088FD786

### MockWLD Token (Test Token)
**Address:** `[TO BE DEPLOYED]`
**Note:** You need to deploy this BEFORE using PngFunChallenge

---

## Important Note

⚠️ **Did you deploy MockWLD first?**

The PngFunChallenge contract requires a WLD token address in its constructor. 

**If you haven't deployed MockWLD yet:**
1. Deploy `MockWLD.sol` first
2. Get its contract address
3. Then deploy `PngFunChallenge.sol` with MockWLD address as constructor parameter

**If PngFunChallenge was deployed without MockWLD:**
- You'll need to redeploy PngFunChallenge with the correct MockWLD address
- Or confirm which WLD address you used

---

## Next Steps

1. Update `.env.local` with contract addresses
2. Get contract ABIs from Remix
3. Test contract functions
4. Integrate with frontend
