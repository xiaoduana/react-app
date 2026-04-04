'use client'
import { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi'

import { Providers } from '@/app/components/providers'
import { SendEth } from '@/app/components/sendEth'
import TokenBalance from '@/app/components/tokenBalance'
import { ERC20Transfer } from '@/app/components/ERC20Transfer'

import { BalanceFormatter } from '@/utils/base'
export default function Home() {
  const { address, isConnected } = useAccount()        // 自动获取账户状态
  const { connect, connectors } = useConnect()        // 连接钱包
  const { disconnect } = useDisconnect()              // 断开连接
  const { data: balanceData, refetch } = useBalance({
    address: address,
    chainId: 11155111,  // Sepolia 的链 ID
  })   // 自动获取余额并缓存

  const [myBalance, setMyBalance] = useState<string | null>("loading...")
  const [myIsConnectedStatus, setMyIsConnectedStatus] = useState<boolean>(false)

  useEffect(() => {
    if (balanceData) {
      const formattedBalance = BalanceFormatter.format(balanceData.value, { decimals: balanceData.decimals, symbol: balanceData.symbol })
      setMyBalance(formattedBalance ?? "loading...")
    }
  }, [balanceData]);
  const handleRefresh = async () => {
    // 调用 refetch 方法手动刷新余额
    setMyBalance("loading...");
    const { data: result } = await refetch();
    if (result) {
      const formattedBalance = BalanceFormatter.format(result.value, { decimals: result.decimals, symbol: result.symbol })
      setMyBalance(formattedBalance ?? "loading...")
    }
  };

  useEffect(() => {
    setMyIsConnectedStatus(isConnected)
  }, [isConnected])

  const getComByAdress = () => {
    if (!address) return "未连接"
    return (<ERC20Transfer tokenAddress="0x7e134B3DF532e8426b21e08118D8ad57f9aC2269" tokenDecimals={18} />)
  }


  return (
    <Providers>
      {myIsConnectedStatus ? (
        <>
          <p>wagmi</p>
          <div>
            <p>
              1. 使用 交互库连接以太坊测试网，查询一个地址的余额。
              <span style={{ color: 'blue' }}>{myBalance}</span>
              <span onClick={handleRefresh}>刷新余额</span>
            </p>
          </div>
          <div>
            <p>
              2. 发送 ETH 到另一个地址
            </p>
            <SendEth isConnectedStatus={myIsConnectedStatus as any} onSendStatusChange={handleRefresh} />
          </div>
          <div>
            <p>
              3.调用一个 ERC-20 合约的 balanceOf 方法。
            </p>
            <TokenBalance contractAddress="0x7e134B3DF532e8426b21e08118D8ad57f9aC2269" address={address} funcName="balanceOf" />
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
            <div>
              {getComByAdress()}
            </div>
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
