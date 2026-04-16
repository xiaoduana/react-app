'use client'
import { useEffect, useState } from "react"
import { useWriteContract, useReadContract, useBlockNumber } from "wagmi";
import { parseEther } from 'viem'
import { stakeAbi as abi } from "../abi"
import { useAppStore } from '@/app/store/index'
import { BalanceFormatter } from '@/utils/base'
const targetContractAddress = "0xF136927bB54709e548fC77F7ee9947b5Ef3136ff"
export default function Home() {
  const { connectionStatus, walletAdress, setWallet, targetBlock } = useAppStore()
  const [value, setValue] = useState('');
  const [requestAmount, setRequestAmount] = useState("")
  const [pendingAmount, setPendingAmount] = useState("")

  const { data: unStakeHash, writeContract: unStakeContract, isPending: unStakePending, error: unStakeError } = useWriteContract();
  const { data: writeDrawHash, writeContract: writeDrawContract, isPending: writeDrawPending, error: writeDrawError } = useWriteContract();
  const { data: currentBlock } = useBlockNumber({ watch: true });

  const withdraw = async () => {
    if (Number(currentBlock) < targetBlock) {
      alert("还未达到指定锁定区块高度，请稍后再试")
      return
    }
    if (Number(pendingAmount) <= 0) {
      alert('暂无可提取金额，请稍后再试')
      return
    }
    if (requestAmount > pendingAmount) {
      alert('申请金额还未全部解锁，请稍后再试')
      return
    }
    try {
      // 调用合约的质押函数
      writeDrawContract({
        address: targetContractAddress,
        abi: abi,
        functionName: 'withdraw', // 替换为实际的质押函数名
        args: [BigInt(0)], // 根据合约函数参数调整
      })
      setRequestAmount("")
      setPendingAmount("")
    } catch (error) {
      console.error("交易失败:", error);
    }
  }

  const { data: poolData } = useReadContract({
    address: targetContractAddress,
    abi: abi,
    functionName: 'pool',
    args: [BigInt(0)], // 根据合约函数参数调整
  })
  const blockHeight = poolData ? Number(poolData[6]) : 0

  const { refetch: withdrawAmountRefetch } = useReadContract({
    address: targetContractAddress,
    abi: abi,
    functionName: 'withdrawAmount',
    args: [BigInt(0), walletAdress as `0x${string}`], // 根据合约函数参数调整
  })

  const getAmount = async () => {
    const { data } = await withdrawAmountRefetch()
    const r = data ? data[0] : ""
    setRequestAmount(BalanceFormatter.format(BigInt(r)))
    const p = data ? data[0] : ""
    setPendingAmount(BalanceFormatter.format(BigInt(p)))
  }

  useEffect(() => {
    getAmount()
  }, [currentBlock])

  useEffect(() => {
    if (unStakeHash) {
      setWallet({
        targetBlock: Number(currentBlock) + blockHeight
      })
    }
  }, [unStakeHash])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectionStatus) {
      alert("请连接钱包后再进行操作");
      return;
    }
    try {
      // 4. 调用合约的质押函数
      unStakeContract({
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
          {unStakePending ? '确认交易中...' : '解除质押'}
        </button>
        {unStakeError && <p style={{ color: 'red' }}>交易失败: {unStakeError.message}</p>}
        {unStakeHash && <p>交易成功，交易哈希: {unStakeHash}</p>}
      </form>
      {
        unStakeHash && <div>
          <p>当前区块{Number(currentBlock)}</p>
          <p>目标解锁区块{targetBlock}</p>
        </div>
      }
      {requestAmount && <div>
        <p>用户申请解押的总金额{requestAmount}</p>
        <p>已经解锁、可以立即提取的金额{pendingAmount}</p>
      </div>}


      <button disabled={writeDrawPending} onClick={withdraw}>
        <p>{writeDrawPending ? '确认交易中...' : '提取 ETH'}</p>
      </button>

      {writeDrawHash && <p>交易成功，交易哈希: {writeDrawHash}</p>}
      {writeDrawError && <p>交易失败: {writeDrawError.message}</p>}
    </div >

  );
}
