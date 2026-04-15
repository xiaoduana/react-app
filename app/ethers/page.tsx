'use client'
import { useState, useEffect } from "react"
import { ethers } from 'ethers'

import { SendEthByEthers } from '@/app/components/sendEthByEthers'
import { ERC20TransferByEthers } from '@/app/components/ERC20TransferByEthers'

import { useAppStore } from '@/app/store/index'

import { BalanceFormatter, getContract } from '@/utils/base'
export default function Home() {
  const { connectionStatus, walletAdress, chainId, rpcUrls } = useAppStore()

  const [myBalance, setMyBalance] = useState<string | null>("loading...")
  const [contractBalance, setContractBalance] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const getBalance = async () => {
    if (window.ethereum && walletAdress) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const balanceData = await provider.getBalance(walletAdress);
      console.log("balanceData", balanceData)
      const formattedBalance = BalanceFormatter.format(balanceData)
      setMyBalance(formattedBalance ?? "获取失败")
    }
  };

  useEffect(() => { getBalance(); }, [chainId])

  const handleRefresh = async () => {
    getBalance();
  }

  const handleGetContract = async () => {
    if (!walletAdress) {
      console.error("钱包地址未获取");
      return;
    }
    setContractBalance("loading...");
    await getContract({
      rpcUrl: rpcUrls[0]!,
      contractAddress: "0xc50cC31ec0E7A2f67Af1619CF399745b5a4F77A8",
      walletAddress: walletAdress,
      abi: [
        "function balanceOf(address owner) view returns (uint256)",
        "function symbol() view returns (string)",
        "function decimals() view returns (uint8)"
      ],
      func: async (contract) => {
        console.log("合约实例666:", contract);
        // 调用合约方法查询余额
        const balanceWei = await contract.balanceOf(walletAdress);
        const sysmbol = await contract.symbol();
        const decimals = await contract.decimals();
        console.log("查询到的余额（Wei）:", balanceWei.toString(), "符号:", sysmbol);
        const balanceFormatted = BalanceFormatter.format(balanceWei, { decimals: Number(decimals), symbol: sysmbol });
        setContractBalance(balanceFormatted ?? "查询失败");
      },
      err(err) {
        alert(err)
        setContractBalance("查询失败");
      }
    });
  };

  const getLogs = async () => {
    // 1. 连接 Provider (建议使用 WebSocketProvider 以保证实时性)
    const provider = new ethers.WebSocketProvider('https://eth-sepolia.g.alchemy.com/v2/7_9-RkcEaiyusV_6I6cTx');

    // 2. 定义 ABI (仅定义需要的事件即可)
    const abi = [
      "event Transfer(address indexed from, address indexed to, uint256 value)"
    ];

    // 3. 实例化合约
    const contractAddress = "0xc50cC31ec0E7A2f67Af1619CF399745b5a4F77A8";
    const contract = new ethers.Contract(contractAddress, abi, provider);

    // 4. 监听事件
    contract.on("Transfer", (from, to, value, event) => {
      // 注意：value 是 BigNumber/BigInt 类型，需要 format 展示
      console.log(`[Ethers 实时] ${from} -> ${to} : ${value.toString()}`);
      setLogs((prevLogs) => [...prevLogs, `${from} -> ${to} : ${value.toString()}`]);
      // 打印交易哈希
      console.log(`Tx Hash: ${event.transactionHash}`);
    });
  }


  useEffect(() => {
    getBalance();
    getLogs();
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
        <SendEthByEthers isConnectedStatus={connectionStatus} onSendStatusChange={handleRefresh} />
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
        <ERC20TransferByEthers address={walletAdress} />
      </div>
    </div >
  );
}
