'use client'
import { useState } from "react"
import { ethers } from 'ethers'
export default function Home() {
  const handleTransfer = async () => {
    console.log("111")
  };

// 连接钱包
const connectWallet = async () => {
    // 1. 先检查是否已经有可用的账户（不弹窗）
    let accounts = await window.ethereum.request({ method: 'eth_accounts' });

    if (accounts.length > 0) {
        // 已有授权，直接使用
        console.log('已连接账户:', accounts[0]);
        return accounts[0];
    }

    // 2. 如果没有，再尝试请求连接，并捕获 4001 错误
    try {
        accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        console.log('新连接账户:', accounts[0]);
        return accounts[0];
    } catch (error) {
        // 捕获并明确区分错误类型
        if (error.code === 4001) {
            // 这种情况通常是用户主动拒绝了弹窗，或者是前面提到的“挂起”状态
            console.warn('连接请求被拒绝或挂起。请检查 MetaMask 插件是否有待处理的操作。');
            alert('请打开 MetaMask 插件，完成或取消之前的连接请求，然后刷新页面重试。');
        } else {
            console.error('连接钱包失败:', error);
        }
        throw error;
    }
};

  return (
    <div>
      <p>ethers</p>
      <div>
        <p>
          1. 使用 交互库连接以太坊测试网，查询一个地址的余额。
        </p>
      </div>
      <div>
        <p style={{ cursor: 'pointer', color: '#1677ff' }} onClick={handleTransfer}>
          2. 发送 ETH 到另一个地址
        </p>
      </div>
      <div>
        <p>
          3.调用一个 ERC-20 合约的 balanceOf 方法。
        </p>
      </div>
      <div>
        <p>
          4.监听 ERC-20 合约的 Transfer 事件
        </p>
      </div>
      <div>
        <p>
          5. 实现ERC20token的转账功能
        </p>
      </div>
      <button onClick={connectWallet}>
          连接钱包
        </button>
    </div>
  );
}
