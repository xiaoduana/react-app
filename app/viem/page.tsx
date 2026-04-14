'use client'

import { useState, useEffect } from "react"
import { createPublicClient, http, erc20Abi, formatEther, parseAbi } from 'viem';
import { mainnet } from 'viem/chains'

import { useAppStore } from '@/app/store/index'

import { ERC20TransferByViem } from '@/app/components/ERC20TransferByViem'
import { SendEthByViem } from '@/app/components/sendEthByViem'

import { connectWallet, BalanceFormatter } from '@/utils/base'
const tokenAddress = '0xc50cC31ec0E7A2f67Af1619CF399745b5a4F77A8';
const client = createPublicClient({
  chain: mainnet,
  transport: http(process.env.NEXT_PUBLIC_SEPOLIA),
})
export default function Home() {
  const [myBalance, setMyBalance] = useState<string | null>("loading...")
  const [address, setAddress] = useState<any>(null)
  const [contractBalance, setContractBalance] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const connectionStatus = useAppStore((state) => state.connectionStatus)

  const getBalance = async () => {
    console.log("查询地址:", address);
    if (!address) {
      console.log("钱包地址未获取");
      return;
    }
    // 2. 调用 getBalance 方法
    const balanceWei = await client.getBalance({
      address: address,
    });

    // 3. 将 Wei 转换为 Ether
    const balanceEther = formatEther(balanceWei);
    setMyBalance(balanceEther);
  }

  const getTokenBalance = async () => {
    if (!connectionStatus) {
      console.log("钱包未连接");
      return;
    }
    setContractBalance("loading...");
    // 读取 ERC-20 合约的 balanceOf 函数
    const balance = await client.readContract({
      address: tokenAddress,
      abi: erc20Abi,        // viem 内置的标准 ERC-20 ABI
      functionName: 'balanceOf',
      args: [address],
    });

    // 获取代币精度 (decimals)，用于格式化
    const decimals = await client.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'decimals',
    });

    const symbol = await client.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'symbol',
    });

    // 格式化输出，第二个参数是精度
    const formattedBalance = BalanceFormatter.format(balance, { decimals: Number(decimals), symbol: symbol });
    console.log(`DAI 余额: ${formattedBalance} DAI`);
    setContractBalance(formattedBalance ?? "查询失败");
  }

  // 2. 定义 ERC-20 的 Transfer 事件 ABI
  const abi = parseAbi(['event Transfer(address indexed from, address indexed to, uint256 value)']);

  // 3. 监听事件
  const unwatch = client.watchContractEvent({
    address: tokenAddress, // USDC 合约地址
    abi: abi,
    eventName: 'Transfer',
    onLogs: (logs) => {
      for (const log of logs) {
        const { from, to, value } = log.args;
        console.log(`[Viem 实时] 从 ${from} 转账 ${value?.toString()} 到 ${to}`);
        setLogs((prevLogs) => [...prevLogs, `从 ${from} 转账 ${value?.toString()} 到 ${to}`]);
      }
    },
  });

  useEffect(() => {
    getBalance()
  }, [address]);
  return (
    <div>
      <p>viem</p>
      <div className="margin-bottom-4">
        <p>
          1. 使用 交互库连接以太坊测试网，查询一个地址的余额{myBalance}。
        </p>
      </div>
      <div>
        <p>
          2. 发送 ETH 到另一个地址
        </p>
        <SendEthByViem address={address} />
      </div>
      <div>
        <p>
          3.调用一个 ERC-20 合约的 balanceOf 方法。
        </p>
        <span onClick={getTokenBalance}>获取余额{contractBalance}</span>
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
        <ERC20TransferByViem address={address} />
      </div>
    </div>
  );
}

