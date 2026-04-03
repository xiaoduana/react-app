"use client"
import { useState, useEffect } from 'react'
import { erc20Abi } from 'viem';  // viem 内置了 ERC-20 的 ABI
import { useReadContract } from 'wagmi'
import { BalanceFormatter } from '@/utils/base'
interface TokenBalanceProps {
  contractAddress: any; // ERC-20 合约地址
  address: any; // 钱包地址
  funcName: any; // 要调用的方法名
}
export default function TokenBalance({ contractAddress, address, funcName }: TokenBalanceProps) {
  const [shouldFetch, setShouldFetch] = useState(false);
  const [myBalance, setMyBalance] = useState<string | null>("loading...")
  const {
    data: balanceData,        // 余额数据（BigInt 类型）
    error = null,                // 错误信息
    refetch               // 手动刷新函数
  } = useReadContract({
    abi: erc20Abi,
    address: contractAddress,
    functionName: funcName,
    args: [address],
    query: {
      enabled: shouldFetch && !!address, // 点击按钮后才启用
    },
  });
  useEffect(() => {
    console.log("balanceData", balanceData)
    if (balanceData) {
      const formattedBalance = BalanceFormatter.format(balanceData)
      setMyBalance(formattedBalance ?? "loading...")
    } else {
      setMyBalance(`查询失败: ${error ? error.message : "未知错误"}`);
    }
  }, [balanceData]);
  const handleGetBalance = () => {
    setShouldFetch(true);  // 触发查询
    // 或者直接调用 refetch()
  };
  const handleRefresh = async () => {
    setMyBalance("loading...");
    const { data: result } = await refetch();
    console.log("refetch result", result)
    if (result) {
      const formattedBalance = BalanceFormatter.format(result)
      setMyBalance(formattedBalance)
    } else {
      setMyBalance("查询失败");
    }
  };
  const getStatusText = () => {
    if (!shouldFetch) return "请点击按钮获取余额";
    if (myBalance) return myBalance;
    if (error) return `查询失败: ${error.message}`;
  };
  return (
    <div>
      <button style={{ color: "red" }} onClick={handleGetBalance}>获取余额</button>
      <button style={{ color: "blue" }} onClick={handleRefresh}>刷新余额</button>
      <div>{getStatusText()}</div>
    </div>
  );
}
