'use client'
import { useState } from "react"
import { useAccount, useWriteContract } from "wagmi";
import { parseEther  } from 'viem'
import { stakeAbi as abi } from "../abi"
const targetContractAddress = "0xF136927bB54709e548fC77F7ee9947b5Ef3136ff"
export default function Home() {
  const [value, setValue] = useState('');
  const { address } = useAccount();
  const { data: unStakeHash, writeContract:unStakeContract, isPending: unStakePending, error: unStakeError } = useWriteContract();
  const { data: writeDrawHash, writeContract:writeDrawContract, isPending: writeDrawPending, error: writeDrawError } = useWriteContract();
  const withdraw = async () => {
    
    try {
      // 4. 调用合约的质押函数（假设函数名为 stake）
      writeDrawContract({
        address: targetContractAddress,
        abi: abi,
        functionName: 'withdraw', // 替换为实际的质押函数名
        args: [BigInt(0)], // 根据合约函数参数调整
      })
    } catch (error) {
      console.error("交易失败:", error);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      alert("请连接钱包后再进行操作");
      return;
    }
    try {
      // 4. 调用合约的质押函数（假设函数名为 stake）
      writeDrawContract({
        address: targetContractAddress,
        abi: abi,
        functionName: 'unstake', // 替换为实际的质押函数名
        args: [BigInt(0), parseEther(value)], // 根据合约函数参数调整
      })
    } catch (error) {
      console.error("交易失败:", error);
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="解除质押金额"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          step="0.01"
          type="number"
          required
        />
        <button type="submit" disabled={unStakePending}>
          {unStakePending ? '确认交易中...' : '发送'}
        </button>
        {unStakeError && <p style={{ color: 'red' }}>交易失败: {unStakeError.message}</p>}
        {unStakeHash && <p>交易成功，交易哈希: {unStakeHash}</p>}
      </form>
      <button className="p-4" disabled={writeDrawPending} onClick={withdraw}>
        <p>{writeDrawPending ? '确认交易中...' : '提取 ETH'}</p>
      </button>
      {writeDrawHash && <p>交易成功，交易哈希: {writeDrawHash}</p>}
      {writeDrawError && <p>交易失败: {writeDrawError.message}</p>}
    </div>

  );
}
