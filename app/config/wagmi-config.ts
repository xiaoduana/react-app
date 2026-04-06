import { createConfig, http } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors';

export const config = createConfig({
  chains: [mainnet, sepolia],
  ssr: true, // 👈 关键：必须设置为 true
  multiInjectedProviderDiscovery: true, 
  connectors: [
    injected(), // 使用 injected 连接器即可，它会自动发现所有钱包
    // ... 如果需要 WalletConnect 等其他连接器，可以继续添加
  ],
  transports: {
    [mainnet.id]: http(process.env.NEXT_PUBLIC_MAINNET),
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA),
  },
})