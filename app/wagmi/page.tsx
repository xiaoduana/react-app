'use client'
import { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect, useBalance, useWatchContractEvent } from 'wagmi'

import { Providers } from '@/app/components/providers'
import { SendEth } from '@/app/components/sendEth'
import TokenBalance from '@/app/components/tokenBalance'
import { ERC20Transfer } from '@/app/components/ERC20Transfer'
const abi = [{
  type: 'event',
  name: 'Transfer',
  inputs: [
    { indexed: true, name: 'from', type: 'address' },
    { indexed: true, name: 'to', type: 'address' },
    { indexed: false, name: 'value', type: 'uint256' },
  ],
}];
const contractAddress = "0xc50cC31ec0E7A2f67Af1619CF399745b5a4F77A8";

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
  const [logs, setLogs] = useState<string[]>([])

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

  useWatchContractEvent({
    address: contractAddress,
    abi: abi,
    eventName: 'Transfer',
    onLogs(logs: any) {
      // logs 是最新批次的事件数组
      logs.forEach((log: any) => {
        const { from, to, value } = log.args;
        console.log(`[Wagmi] 检测到转账: ${from} 发送 ${value.toString()} 给 ${to}`);
        setLogs((prevLogs) => [...prevLogs, `${from} -> ${to} : ${value.toString()}`]);
      });
    }
  })

  useEffect(() => {
    setMyIsConnectedStatus(isConnected)
  }, [isConnected])

  const getComByAdress = () => {
    if (!address) return "未连接"
    return (<ERC20Transfer tokenAddress={contractAddress} tokenDecimals={18} />)
  }


  return (
    <Providers>
      {myIsConnectedStatus ? (
        <>
          <p>wagmi</p>
          <div className='mar1gin-bottom-10'>
            <p>
              1. 使用 交互库连接以太坊测试网，查询一个地址的余额。
              <span className='text-blue-500'>{myBalance}</span>
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
            <TokenBalance contractAddress={contractAddress} address={address} funcName="balanceOf" />
          </div>
          <div>
            <p>
              4.监听 ERC-20 合约的 Transfer 事件
            </p>
            <div>
              {logs.map((log, index) => (
                <p key={index}>{log}</p>
              ))}
            </div>
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
