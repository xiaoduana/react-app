'use client'
import { transfer } from "@/utils/ethers"
export default function Home() {
  const handleTransfer = () => {
    const res = transfer('https://rpc.sepolia.org', 'dhx', "0x8C91C3685A31d4d2995e5285b72F24E91F4Ed08B", "0.01")
    console.log(res)
  }

  return (
    <div>
      <p>ethers</p>
      <div>
        <p>
          1. 使用 交互库连接以太坊测试网，查询一个地址的余额。
        </p>
      </div>
      <div>
        <p style={{ cursor: 'pointer', color: '#1677ff' }} onClick={handleTransfer}>
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
