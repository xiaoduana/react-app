"use client"
// ERC20Transfer.tsx
import { useState } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits } from 'viem'

// ERC20 标准 ABI（仅需 transfer 和 decimals 部分）
const erc20Abi = [
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8' }],
  },
] as const

// 示例代币地址（Sepolia 测试网 LINK）
interface ERC20TransferProps {
  tokenAddress: any
  tokenDecimals: number
}
export function ERC20Transfer({ tokenAddress, tokenDecimals }: ERC20TransferProps) {
  const [toAddress, setToAddress] = useState('')
  const [amount, setAmount] = useState('')

  const {
    data: hash,
    writeContract,
    isPending,
    error
  } = useWriteContract()

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash })

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // 将用户输入的金额转换为带小数位的 BigInt
      const amountInWei = parseUnits(amount, tokenDecimals)

      writeContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [toAddress as `0x${string}`, amountInWei],
      })
    } catch (err) {
      console.error('转账失败:', err)
    }
  }

  return (
    <form onSubmit={handleTransfer}>
      <div>
        <label>接收地址：</label>
        <input
          type="text"
          value={toAddress}
          onChange={(e) => setToAddress(e.target.value)}
          placeholder="0x..."
          required
        />
      </div>

      <div>
        <label>转账数量：</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          step="any"
          placeholder="0.0"
          required
        />
      </div>

      <button type="submit" disabled={isPending || isConfirming}>
        {isPending ? '等待钱包确认...' : isConfirming ? '交易确认中...' : '转账'}
      </button>

      {hash && <div>交易哈希：{hash}</div>}
      {isConfirmed && <div>✅ 转账成功！</div>}
      {error && <div>❌ 错误：{error.message}</div>}
    </form>
  )
}