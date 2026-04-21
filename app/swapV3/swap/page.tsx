'use client'
import { useWriteContract, useReadContract } from "wagmi";
import { stakeAbi as abi } from "../abi"
import { BalanceFormatter } from '@/utils/base'
const targetContractAddress = "0xF136927bB54709e548fC77F7ee9947b5Ef3136ff"
const address = "0x8C91C3685A31d4d2995e5285b72F24E91F4Ed08B";
export default function Home() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { data: pendMetaNode } = useReadContract({
    address: targetContractAddress,
    abi: abi,
    functionName: 'pendingMetaNode',
    args: [BigInt(0), address], // 根据合约函数参数调整
  });

  const submitClaim = async () => {
    try {
      writeContract({
        address: targetContractAddress,
        abi: abi,
        functionName: 'claim',
        args: [BigInt(0)], // 根据合约函数参数调整
      });
    } catch (error) {
      console.error("交易失败:", error);
    }
  }


  return (
    <div>
      <div>可领取的奖励: {pendMetaNode && BalanceFormatter.format(pendMetaNode, { symbol: "MetaNode" })}</div>
      <button type="submit" onClick={submitClaim} disabled={isPending}>
        {isPending ? '确认交易中...' : '领取奖励'}
      </button>
      {error && <p style={{ color: 'red' }}>交易失败: {error.message}</p>}
      {hash && <p>交易成功，交易哈希: {hash}</p>}
    </div>
  );
}
