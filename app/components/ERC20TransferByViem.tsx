import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { useState } from 'react';

export function ERC20TransferByViem() {
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');

  const {
    sendTransaction,
    data: hash,
    isPending,
    error,
  } = useSendTransaction();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed
  } = useWaitForTransactionReceipt({
    hash,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      sendTransaction({
        to: toAddress as `0x${string}`,
        value: parseEther(amount),
      });
    } catch (err) {
      console.error('发送失败:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="接收地址 (0x...)"
        value={toAddress}
        onChange={(e) => setToAddress(e.target.value)}
        required
      />

      <input
        type="number"
        placeholder="ETH 数量"
        step="0.01"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
      />

      <button type="submit" disabled={isPending || isConfirming}>
        {isPending ? '等待确认...' : '发送 ETH'}
      </button>

      {hash && (
        <div>
          <p>交易哈希: {hash}</p>
          {isConfirming && <p>确认中...</p>}
          {isConfirmed && <p>✅ 交易成功！</p>}
        </div>
      )}

      {error && <p style={{ color: 'red' }}>错误: {error.message}</p>}
    </form>
  );
}