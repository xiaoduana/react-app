
// 声明 window.ethereum 类型
declare global {
  interface Window {
    ethereum?: any;
  }
}

import { createPublicClient, http, createWalletClient, custom } from 'viem'
import { mainnet } from 'viem/chains'

// 1. 创建 Public Client 用于读数据
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http('https://rpc.xxx.com') // RPC 节点地址
})

// 2. 查询余额
const balance = await publicClient.getBalance({ address: '0x...' })

// 3. 创建 Wallet Client 用于写数据 (连接 MetaMask)
const walletClient = createWalletClient({
  chain: mainnet,
  transport: custom(typeof window !== 'undefined' && window.ethereum ? window.ethereum : undefined) // 使用浏览器注入的钱包
})