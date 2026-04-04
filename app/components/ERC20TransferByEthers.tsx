"use client"
// ERC20Transfer.tsx
import { useState } from 'react'
import { ethers } from 'ethers'

// ERC20 标准 ABI（仅需 transfer 和 decimals 部分）
import { getSigner, getContract } from '@/utils/base'
export function ERC20TransferByEthers({ address }: { address: any }) {
  const [toAddress, setToAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [isPending, setIsPending] = useState(false);
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);


  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address) {
      console.error("钱包地址未获取");
      return;
    }
    setIsPending(true);
    // 获取签名器
    const signerObj = await getSigner();
    await getContract({
      rpcUrl: "https://eth-sepolia.g.alchemy.com/v2/7_9-RkcEaiyusV_6I6cTx",
      contractAddress: "0x7e134b3df532e8426b21e08118d8ad57f9ac2269",
      walletAddress: address,
      abi: [
        "function balanceOf(address owner) view returns (uint256)",
        "function transfer(address to, uint256 amount) returns (bool)"
      ],
      signerObj,
      func: async (contract: ethers.Contract) => {
        console.log("合约实例", contract);
        // 调用合约方法查询余额
        const balanceWei = await contract.balanceOf(address);
        // USDT 精度为 6 位，所以用 formatUnits
        const balanceFormatted = ethers.formatUnits(balanceWei, 6);
        if (balanceFormatted < amount) {
          console.error("余额不足");
          setIsPending(false);
          return;
        }
        const amountInWei = ethers.parseUnits(amount, 6);
        try {
          const tx = await contract.transfer(toAddress, amountInWei);
          console.log("交易已发送，哈希:", tx.hash);
          const receipt = await tx.wait();
          if (receipt.status === 1) {
            setTxStatus('✅ 转账成功!');
            setTxHash(tx.hash);
            // 清空表单
            setToAddress('');
            setAmount('');
          } else {
            setTxStatus('❌ 转账失败');
            setError('交易执行失败');
          }
        } catch (error) {
          console.error("交易失败:", error);
        }
        setIsPending(false);
      }
    });
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

      <button type="submit" disabled={isPending}>
        {isPending ? '交易确认中...' : '转账'}
      </button>
      {txHash && <div>交易哈希：{txHash}</div>}
      {txStatus && <div>{txStatus}</div>}
      {error && <div>{error}</div>}

    </form>
  )
}