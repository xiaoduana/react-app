import { createConfig, http } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'


export const config = createConfig({
  chains: [mainnet, sepolia],
  ssr: true, // 👈 关键：必须设置为 true
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
})