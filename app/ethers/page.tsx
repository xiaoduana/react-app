'use client'
import { useState, useEffect } from "react"
import { ethers } from 'ethers'

import { SendEthByEthers } from '@/app/components/sendEthByEthers'
import { ERC20TransferByEthers } from '@/app/components/ERC20TransferByEthers'

import { connectWallet, BalanceFormatter, getContract } from '@/utils/base'
export default function Home() {

  const [myBalance, setMyBalance] = useState<string | null>("loading...")
  const [address, setAddress] = useState<string | null>(null)
  const [contractBalance, setContractBalance] = useState<string | null>(null)

  const getBalance = async () => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const balanceData = await provider.getBalance("0x8C91C3685A31d4d2995e5285b72F24E91F4Ed08B");
      console.log("balanceData", balanceData)
      const formattedBalance = BalanceFormatter.format(balanceData)
      setMyBalance(formattedBalance ?? "获取失败")
    }
  };

  const getWallerMsg = async () => {
    try {
      const account = await connectWallet();
      console.log('连接成功，账户地址:', account);
      setAddress(account);
    } catch (error) {
      console.error('连接钱包失败:', error);
    }
  };

  const handleRefresh = async () => {
    getBalance();
  }

  const handleGetContract = async () => {
    if (!address) {
      console.error("钱包地址未获取");
      return;
    }
    setContractBalance("loading...");
    await getContract({
      rpcUrl: "https://eth-sepolia.g.alchemy.com/v2/7_9-RkcEaiyusV_6I6cTx",
      contractAddress: "0x7e134b3df532e8426b21e08118d8ad57f9ac2269",
      walletAddress: address,
      abi: [
        "function balanceOf(address owner) view returns (uint256)"
      ],
      func: async (contract) => {
        console.log("合约实例666:", contract);
        // 调用合约方法查询余额
        const balanceWei = await contract.balanceOf(address);
        // USDT 精度为 6 位，所以用 formatUnits
        const balanceFormatted = ethers.formatUnits(balanceWei, 6);
        setContractBalance(balanceFormatted ?? "查询失败");
      }
    });
  };

  useEffect(() => {
    getWallerMsg();
    getBalance();
  }, []);


  return (
    <div>
      <p>ethers</p>
      <div className="margin-bottom-10">
        <p>
          1. 使用 交互库连接以太坊测试网，查询一个地址的余额{myBalance}。
        </p>
      </div>
      <div>
        <p>
          2. 发送 ETH 到另一个地址
        </p>
        <SendEthByEthers isConnectedStatus={!!address} onSendStatusChange={handleRefresh} />
      </div>
      <div>
        <p>
          3.调用一个 ERC-20 合约的 balanceOf 方法。
        </p>
        <span onClick={handleGetContract}>获取余额{contractBalance}</span>
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
        <ERC20TransferByEthers address={address} />
      </div>
      <button onClick={getWallerMsg}>
        连接钱包
      </button>
    </div >
  );
}
