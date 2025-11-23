export const CONTRACTS = {
  sepolia: {
    mockWLD: '0x8FD73bCA4cA6EEE4A4a3797951F969a2088FD786',
    pngFunChallenge: '0x43bd53c3e601d9760e71dDc5dFB76E786CE5d671',
    chainId: 4801,
    rpcUrl: 'https://worldchain-sepolia.g.alchemy.com/public',
  },
  mainnet: {
    wld: '0x2cfc85d8e48f8eab294be644d9e25c3030863003',
    pngFunChallenge: '0xF29d3AEaf0cCD69F909FD999AebA1033C6859eAF', // Mainnet deployment
    chainId: 480,
    rpcUrl: 'https://worldchain-mainnet.g.alchemy.com/public',
  }
};

export const CURRENT_NETWORK = process.env.NEXT_PUBLIC_NETWORK === 'mainnet' 
  ? CONTRACTS.mainnet 
  : CONTRACTS.sepolia;
