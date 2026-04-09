'use client'
import { useState } from "react"

import { useAccount, useWriteContract, useReadContract } from "wagmi";
import { parseEther } from 'viem'

import { stakeAbi as abi } from "../abi"
import { BalanceFormatter } from '@/utils/base'

const targetContractAddress = "0xF136927bB54709e548fC77F7ee9947b5Ef3136ff"

export default function Home() {
  const [value, setValue] = useState('');
  const [stakedDataAddress, setStakedDataAddress] = useState<`0x${string}` | undefined>(undefined);
  const [totalStaked, setTotalStaked] = useState<bigint | undefined>(undefined);
  const { address } = useAccount();
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const { refetch } = useReadContract({
    address: targetContractAddress,
    abi: abi,
    functionName: 'stakingBalance',
    args: [BigInt(0), stakedDataAddress as `0x${string}`], // 根据合约函数参数调整
  })


  const handleGetTotalStaked = async () => {
    try {
      const result = await refetch();
      console.log("总质押金额:", result);
      setTotalStaked(result.data);
    } catch (error) {
      console.error("获取总质押金额失败:", error);
    }
  };

  // 3. 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      alert("请连接钱包后再进行操作");
      return;
    }
    try {
      // 调用合约的质押函数
      writeContract({
        address: targetContractAddress,
        abi: abi,
        functionName: 'depositETH', // 替换为实际的质押函数名
        value: parseEther(value), // 发送的以太数量
        args: [], // 根据合约函数参数调整
      })
    } catch (error) {
      console.error("交易失败:", error);
    }
  };


  return (
    <div>
      <div>
        <div>钱包转账</div>
        <div>当前链接地址: {address}</div>
        <form onSubmit={(e) => handleSubmit(e)}>
          <input
            placeholder="质押金额"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            step="0.01"
            type="number"
            required
          />
          <button type="submit" disabled={isPending}>
            {isPending ? '确认交易中...' : '发送ETH'}
          </button>
          {error && <p style={{ color: 'red' }}>交易失败: {error.message}</p>}
          {hash && <p>交易成功，交易哈希: {hash}</p>}
        </form>
        <div>
          <input
            placeholder="查询质押金额地址"
            value={stakedDataAddress ?? ''}
            onChange={(e) => setStakedDataAddress(e.target.value as `0x${string}`)}
            type="text"
            required
          />
          <p onClick={handleGetTotalStaked}>总质押金额: {totalStaked && BalanceFormatter.format(totalStaked, { symbol: "" })}</p>
        </div>
      </div>

    </div>
  );
}

