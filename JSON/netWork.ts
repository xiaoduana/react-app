import { env } from "process";

// 预设网络配置
export const SUPPORTED_NETWORKS = [
  {
    chainId: 1,
    chainName: 'Ethereum Mainnet',
    rpcUrls: [process.env.NEXT_PUBLIC_MAINNET],
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorerUrls: ['https://etherscan.io'],
  },
  {
    chainId: 56,
    chainName: 'BNB Smart Chain',
    rpcUrls: ['https://bsc-dataseed.binance.org'],
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
    blockExplorerUrls: ['https://bscscan.com'],
  },
  {
    chainId: 137,
    chainName: 'Polygon Mainnet',
    rpcUrls: ['https://polygon-rpc.com'],
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    blockExplorerUrls: ['https://polygonscan.com'],
  },
  {
    chainId: 11155111,
    chainName: 'Sepolia Testnet',
    rpcUrls: [process.env.NEXT_PUBLIC_SEPOLIA],
    nativeCurrency: {
      name: 'Sepolia ETH',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
  },
  {
    chainId: 42161,
    chainName: 'Arbitrum One',
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorerUrls: ['https://arbiscan.io'],
  },
] as const;
