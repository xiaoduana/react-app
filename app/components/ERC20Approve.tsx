"use client"
// ERC20Transfer.tsx
import { useState } from 'react'
import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits } from 'viem'

const address = "0x8C91C3685A31d4d2995e5285b72F24E91F4Ed08B";
// ERC20 标准 ABI（仅需 approve 和 decimals 部分）
const erc20Abi = [
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8' }],
  },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: 'remaining', type: 'uint256' }],
  },
] as const

// 示例代币地址（Sepolia 测试网 LINK）
interface ERC20TransferProps {
  tokenAddress: any
  tokenDecimals: number
}
export function ERC20Approve({ tokenAddress, tokenDecimals }: ERC20TransferProps) {
  const [toAddress, setToAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [allowance, setAllowance] = useState<bigint | undefined>(undefined)

  const {
    data: hash,
    writeContract,
    isPending,
    error
  } = useWriteContract()
  // 查询当前授权额度
  const { refetch } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [address, toAddress as `0x${string}`],
  });

  const handleRefetch = async () => {
    try {
      const result = await refetch();
      console.log("当前授权额度:", result);
      setAllowance(result.data);
    } catch (error) {
      console.error("获取授权额度失败:", error);
    }
  };
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
        functionName: 'approve',
        args: [toAddress as `0x${string}`, amountInWei],
      })
    } catch (err) {
      console.error('授权失败:', err)
    }
  }

  return (
    <form onSubmit={handleTransfer}>
      <div>
        <div>
          <label>授权地址：</label>
          <input
            type="text"
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
            placeholder="0x..."
            required
          />
        </div>
        <div onClick={handleRefetch}>
          当前授权额度：{allowance ? allowance.toString() : '0.0'}
        </div>
        <div>
          <label>授权数量：</label>
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
          {isPending ? '等待钱包确认...' : isConfirming ? '交易确认中...' : '授权'}
        </button>

        {hash && <div>交易哈希：{hash}</div>}
        {isConfirmed && <div>✅ 授权成功！</div>}
        {error && <div>❌ 错误：{error.message}</div>}
      </div>

    </form>
  )
}