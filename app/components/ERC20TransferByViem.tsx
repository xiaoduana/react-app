"use client";
import { useState } from "react"
import { createPublicClient, createWalletClient, custom, http, erc20Abi, parseUnits, formatUnits } from 'viem';
import { mainnet, sepolia } from 'viem/chains'
const tokenAddress = '0xc50cC31ec0E7A2f67Af1619CF399745b5a4F77A8';
const client = createPublicClient({
  chain: mainnet,
  transport: http(process.env.NEXT_PUBLIC_SEPOLIA),
})
const TOKEN_ABI = [{
  name: 'transfer',
  type: 'function',
  inputs: [
    { name: 'to', type: 'address' },
    { name: 'amount', type: 'uint256' }
  ],
  outputs: [{ type: 'bool' }]
}];
interface SendEthProps {
  address: any;
}

export function ERC20TransferByViem({ address }: SendEthProps) {
  const [to, setTo] = useState('');
  const [value, setValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [hash, setHash] = useState<string | null>(null);

  const getTokenBalance = async () => {
    // 读取 ERC-20 合约的 balanceOf 函数
    const balance = await client.readContract({
      address: tokenAddress,
      abi: erc20Abi,        // viem 内置的标准 ERC-20 ABI
      functionName: 'balanceOf',
      args: [address],
    });
    // 获取代币精度 (decimals)，用于格式化
    const decimals = await client.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'decimals',
    });
    const balanceFormatted = formatUnits(balance, Number(decimals));
    return { balance: balanceFormatted, decimals };
  }

  // 3. 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      alert('请先连接钱包');
      return;
    }
    setIsSending(true);
    const { balance, decimals } = await getTokenBalance();
    if (parseFloat(balance) < parseFloat(value)) {
      alert('余额不足');
      return;
    }

    const walletClient = createWalletClient({
      chain: sepolia,
      transport: custom(window.ethereum)
    });
    const amount = parseUnits(value, Number(decimals));
    // 4. 发起交易 (钱包会弹出确认窗口)
    const hash = await walletClient.writeContract({
      address: tokenAddress,
      abi: TOKEN_ABI,
      functionName: 'transfer',
      args: [to, amount],
      account: address, // 当前连接的账户
    });

    console.log('交易已发送，Hash:', hash);
    setHash(hash);
    setIsSending(false);
  };


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
        {isSending ? '确认交易中...' : '发送'}
      </button>

      {/* 4. 状态展示 */}
      {hash && <div>交易哈希: {hash}</div>}
    </form>
  );
}