'use client'

import { createPublicClient, http, createWalletClient, custom } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})
export default function Home() {
  const handleGetBalance = async () => {
    const blockNumber = await client.getBlockNumber() 
    console.log('blockNumber:', blockNumber)
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

