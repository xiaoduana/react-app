"use client";
import { createWalletClient, custom, getAddress } from 'viem';
import { mainnet, sepolia } from 'viem/chains'
import { parseEther } from 'viem';
import { useState } from 'react';
export function SendEthByViem({ address }: { address: any }) {
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [hash, setHash] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    console.log("发送地址:", toAddress);
    console.log("发送金额:", amount);
    console.log("当前地址:", address);
    if (!address) {
      alert('请先连接钱包');
      return;
    }
    e.preventDefault();
    setIsPending(true);
    try {
      // 创建 Wallet Client，使用浏览器钱包作为 transport
      const walletClient = createWalletClient({
        chain: sepolia,  // 根据你的网络选择 mainnet/sepolia 等
        transport: custom(window.ethereum)
      });

      // 发送交易 - 关键点：使用 sendTransaction 而不是 writeContract
      const hash = await walletClient.sendTransaction({
        to: getAddress(toAddress),           // 接收地址
        value: parseEther(amount),        // 转账金额（ETH → Wei）
        account: address,
      });

      setHash(hash);
      console.log('交易已发送，Hash:', hash);
      setIsPending(false);

      // 可选：等待交易确认
      // const receipt = await publicClient.waitForTransactionReceipt({ hash });

    } catch (err) {
      console.error('转账失败:', err);
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

      <button type="submit" disabled={isPending}>
        {isPending ? '等待确认...' : '发送 ETH'}
      </button>

      {hash && (
        <div>
          <p>交易哈希: {hash}</p>
        </div>
      )}
    </form>
  );
}