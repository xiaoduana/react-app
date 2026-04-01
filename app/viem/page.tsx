'use client'

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
  transport: http('https://rpc.sepolia.org') // RPC 节点地址
})


// 3. 创建 Wallet Client 用于写数据 (连接 MetaMask)
const walletClient = createWalletClient({
  chain: mainnet,
  transport: custom(typeof window !== 'undefined' && window.ethereum ? window.ethereum : undefined) // 使用浏览器注入的钱包
})
export default function Home() {
  const handleGetBalance = async () => {
    const balance = await publicClient.getBalance({ address: '0x8C91C3685A31d4d2995e5285b72F24E91F4Ed08B' })
    console.log('Balance:', balance)
  }
  return (
    <div>
      <p>viem</p>
      <div>
        <p style={{ cursor: 'pointer', color: '#1677ff' }} onClick={handleGetBalance}>
          1. 使用 交互库连接以太坊测试网，查询一个地址的余额。
        </p>
      </div>
      <div>
        <p>
          2. 发送 ETH 到另一个地址
        </p>
      </div>
      <div>
        <p>
          3.调用一个 ERC-20 合约的 balanceOf 方法。
        </p>
      </div>
      <div>
        <p>
          4.监听 ERC-20 合约的 Transfer 事件
        </p>
      </div>
      <div>
        <p>
          5. 实现ERC20token的转账功能
        </p>
      </div>
    </div>
  );
}

