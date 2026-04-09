'use client'
import { useEffect, useState, useRef } from "react"
import { useAccount, useWriteContract, useBlockNumber } from "wagmi";
import { parseEther } from 'viem'
import { stakeAbi as abi } from "../abi"
const targetContractAddress = "0xF136927bB54709e548fC77F7ee9947b5Ef3136ff"
export default function Home() {
  const [value, setValue] = useState('');

  const [targetBlock, setTargetBlock] = useState<bigint | null>(null);
  const [unStake, setUnStake] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);

  const [dealTime, setDealTime] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { address } = useAccount();

  const { data: unStakeHash, writeContract: unStakeContract, isPending: unStakePending, error: unStakeError } = useWriteContract();
  const { data: writeDrawHash, writeContract: writeDrawContract, isPending: writeDrawPending, error: writeDrawError } = useWriteContract();

  const { data: currentBlock } = useBlockNumber({ watch: true });


  const withdraw = async () => {
    if (!targetBlock || dealTime > 0) {
      alert("请先等待质押金额解锁完成")
      return;
    }
    try {
      // 调用合约的质押函数
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

  const getCurrentBlockNumber = () => {
    if (currentBlock) {
      const targetBlockNumber = currentBlock + BigInt(20); // 监听未来的区块
      setTargetBlock(targetBlockNumber);
      setIsWaiting(true);
      setDealTime(20 * 12)
      console.log(`当前区块: ${currentBlock}, 监听目标区块: ${targetBlockNumber}`);
    }
  };

  useEffect(() => {
    if (dealTime > 0) {
      timerRef.current = setInterval(() => {
        setDealTime(prevTime => {
          if (prevTime <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentBlock]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      alert("请连接钱包后再进行操作");
      return;
    }
    setUnStake(true)
    try {
      // 4. 调用合约的质押函数
      unStakeContract({
        address: targetContractAddress,
        abi: abi,
        functionName: 'unstake', // 替换为实际的质押函数名
        args: [BigInt(0), parseEther(value)], // 根据合约函数参数调整
      })
      setUnStake(false)
      getCurrentBlockNumber()
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
          {unStakePending ? '确认交易中...' : '解除质押'}
        </button>
        {unStakeError && <p style={{ color: 'red' }}>交易失败: {unStakeError.message}</p>}
        {unStakeHash && <p>交易成功，交易哈希: {unStakeHash}</p>}
      </form>
      <div>
        <button disabled={isWaiting}>
          目标区块{targetBlock}-当前区块{currentBlock}-约剩余时间{dealTime}
        </button>
      </div>


      <button disabled={writeDrawPending} onClick={withdraw}>
        <p>{writeDrawPending ? '确认交易中...' : '提取 ETH'}</p>
      </button>

      {writeDrawHash && <p>交易成功，交易哈希: {writeDrawHash}</p>}
      {writeDrawError && <p>交易失败: {writeDrawError.message}</p>}
    </div >

  );
}
