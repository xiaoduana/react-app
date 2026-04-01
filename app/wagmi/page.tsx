'use client'
import { useAccount, useConnect, useDisconnect, useBalance, useWriteContract } from 'wagmi'
import { Providers } from '@/app/components/providers'
export default function Home() {
  const { address, isConnected } = useAccount()        // 自动获取账户状态
  const { connect, connectors } = useConnect()        // 连接钱包
  const { disconnect } = useDisconnect()              // 断开连接
  const { data: balance } = useBalance({ address })   // 自动获取余额并缓存
  const { writeContract, isPending } = useWriteContract() // 写入合约
  return (
    <Providers>
      <p>wagmi</p>
      {isConnected ? (
        <>
          <div>
            <p>
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
          <button onClick={() => disconnect()}>断开</button>
        </>
      ) : (
        <button onClick={() => connect({ connector: connectors[0] })}>
          连接钱包
        </button>
      )}

    </Providers>
  );
}
