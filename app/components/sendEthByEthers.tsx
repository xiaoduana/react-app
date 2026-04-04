import { useState } from 'react';
import { ethers } from 'ethers'
import { getSigner } from '@/utils/base'
interface SendEthProps {
  isConnectedStatus: boolean | null;
  onSendStatusChange: () => void;
}
export function SendEthByEthers({ isConnectedStatus, onSendStatusChange }: SendEthProps) {
  const [to, setTo] = useState('');
  const [value, setValue] = useState('');
  const [hash, setHash] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const sendTransaction = async (e: React.FormEvent) => {
    setIsLoading(true);
    if (!isConnectedStatus) {
      alert('请先连接钱包');
      return;
    }
    e.preventDefault();
    try {
      const tx = {
        to: to,                       // 接收方地址
        value: ethers.parseEther(value) // 发送金额，转换为 Wei
      };

      // 弹出 MetaMask 交易确认窗口，等待用户确认
      const signer = await getSigner();
      if (!signer) {
        alert('请先连接钱包');
        return;
      }
      const transactionResponse = await signer.sendTransaction(tx);
      console.log("交易已广播，哈希:", transactionResponse.hash);

      // 可选：等待交易被链上确认 (通常等待 1 个区块确认)
      const receipt = await transactionResponse.wait();
      console.log("交易已确认，所在区块:", receipt?.blockNumber);
      setIsLoading(false);

      onSendStatusChange();

    } catch (error) {
      console.error("交易发送失败:", error);
      setErrorMsg("交易发送失败，请检查控制台日志获取详情。");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={sendTransaction}>
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
      <button type="submit" disabled={isLoading}>
        {isLoading ? '交易确认中...' : '发送'}
      </button>

      {/* 4. 状态展示 */}
      {hash && <div>交易哈希: {hash}</div>}
      {errorMsg && <div>{errorMsg}</div>}
      {hash && !errorMsg && <div>交易成功！</div>}
    </form>
  );
}