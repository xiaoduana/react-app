'use client'
import { useState } from "react"

import { useAccount, useWriteContract, useReadContract, useBlockNumber  } from "wagmi";
import { parseEther  } from 'viem'

import {stakeAbi as abi} from "../abi"
import { BalanceFormatter } from '@/utils/base'
const targetContractAddress = "0xF136927bB54709e548fC77F7ee9947b5Ef3136ff"

export default function Home() {
  const [targetBlock, setTargetBlock] = useState<bigint | null>(null);
  const [isWaiting, setIsWaiting] = useState(false);
  const [value, setValue] = useState('');
  
  const { address } = useAccount();

  const {data: hash,writeContract, isPending, error} = useWriteContract();
  const {data: hash1,writeContract: writeContract1, isPending: isPending1, error: error1} = useWriteContract();

  const { data: currentBlock } = useBlockNumber({ watch: true });


  const {data: totalStaked, refetch} = useReadContract({
    address: targetContractAddress,
    abi: abi,
    functionName: 'stakingBalance', // 替换为实际的查询函数名
    args: [BigInt(0), address as `0x${string}`], // 根据合约函数参数调整
  })

  const handleGetTotalStaked = async () => {
    try {
      const result = await refetch();
      console.log("总质押金额:", result.data);
    } catch (error) {
      console.error("获取总质押金额失败:", error);
    }
  };
  
  const getCurrentBlockNumber = () => {
    if (currentBlock) {
        const targetBlockNumber = currentBlock + BigInt(20); // 监听未来的区块
        setTargetBlock(targetBlockNumber);
        setIsWaiting(true);
        console.log(`当前区块: ${currentBlock}, 监听目标区块: ${targetBlockNumber}`);
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
      // 4. 调用合约的质押函数（假设函数名为 stake）
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
      <form onSubmit={handleSubmit}>
        <input
          placeholder="质押金额"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          step="0.01"
          type="number"
          required
        />
        <button type="submit" disabled={isPending}>
          {isPending ? '确认交易中...' : '发送'}
        </button>
        {error && <p style={{ color: 'red' }}>交易失败: {error.message}</p>}
        {hash && <p>交易成功，交易哈希: {hash}</p>}
      </form>
      <div>
        <p>总质押金额: {totalStaked && BalanceFormatter.format(totalStaked)}</p>
        <button onClick={handleGetTotalStaked}>刷新总质押金额</button>
      </div>
      <div>
        <button onClick={getCurrentBlockNumber} disabled={isWaiting}>
          {isWaiting ? `等待区块 ${targetBlock}...` : '监听未来区块'}
        </button>
      </div>
    </div>
  );
}

