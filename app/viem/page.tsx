'use client'

import { useState, useEffect } from "react"
import { createPublicClient, http, erc20Abi, formatUnits, formatEther } from 'viem';
import { mainnet } from 'viem/chains'

import { ERC20TransferByViem } from '@/app/components/ERC20TransferByViem'

import { connectWallet, BalanceFormatter } from '@/utils/base'
const tokenAddress = '0x7e134b3df532e8426b21e08118d8ad57f9ac2269';
const client = createPublicClient({
  chain: mainnet,
  transport: http("https://eth-sepolia.g.alchemy.com/v2/7_9-RkcEaiyusV_6I6cTx"),
})
export default function Home() {
  const [myBalance, setMyBalance] = useState<string | null>("loading...")
  const [address, setAddress] = useState<any>(null)
  const [contractBalance, setContractBalance] = useState<string | null>(null)

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
    console.log("查询地址:", address);
    if (!address) {
      console.log("钱包地址未获取");
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

    // 格式化输出，第二个参数是精度
    const formattedBalance = formatUnits(balance, decimals);
    console.log(`DAI 余额: ${formattedBalance} DAI`);
    setContractBalance(formattedBalance ?? "查询失败");
  }

  const getWallerMsg = async () => {
    try {
      const account = await connectWallet();
      console.log('连接成功，账户地址:', account);
      setAddress(account);
    } catch (error) {
      console.error('连接钱包失败:', error);
    }
  };

  useEffect(() => {
    getWallerMsg();
  }, []);

  useEffect(() => {
    getBalance()
  }, [address]);
  return (
    <div>
      <p>viem</p>
      <div>
        <p>
          1. 使用 交互库连接以太坊测试网，查询一个地址的余额{myBalance}。
        </p>
      </div>
      <div>
        <p>
          2. 发送 ETH 到另一个地址
        </p>
        <ERC20TransferByViem />
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
      </div>
      <div>
        <p>
          5. 实现ERC20token的转账功能
        </p>
      </div>
      <button onClick={getWallerMsg}>
        连接钱包
      </button>
    </div>
  );
}

