import { useEffect, useState } from 'react';
import { parseEther } from 'viem';
import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';

interface SendEthProps {
  isConnectedStatus: boolean | null;
  onSendStatusChange: () => void;
}
export function SendEth({ isConnectedStatus, onSendStatusChange }: SendEthProps) {
  const [to, setTo] = useState('');
  const [value, setValue] = useState('');

  // 1. 配置发送交易的方法
  const {
    data: hash,           // 交易哈希
    sendTransaction,
    isPending: isSending // 交易待签名/提交中
  } = useSendTransaction();

  // 2. 监听交易上链确认状态
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed
  } = useWaitForTransactionReceipt({ hash });

  // 3. 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    if (!isConnectedStatus) {
      alert('请先连接钱包');
      return;
    }
    e.preventDefault();
    sendTransaction({
      to: to as `0x${string}`,   // 目标地址
      value: parseEther(value),  // 金额 (ETH 转 Wei)
    });
  };
  useEffect(() => {
    console.log('交易确认状态ccc:', isConfirmed)
    onSendStatusChange();
  }, [isConfirmed]);

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="收款地址 (0x...)"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        required
      />
      <input
        placeholder="金额 (ETH)"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        step="0.01"
        type="number"
        required
      />
      <button type="submit" disabled={isSending}>
        {isSending ? '请确认交易...' : '发送'}
      </button>

      {/* 4. 状态展示 */}
      {hash && <div>交易哈希: {hash}</div>}
      {isConfirming && <div>确认中...</div>}
      {isConfirmed && <div>交易成功！</div>}
    </form>
  );
}