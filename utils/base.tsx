import { ethers } from 'ethers'
import { erc20Abi } from 'viem';  // viem 内置了 ERC-20 的 ABI
import { useAccount, useReadContract } from 'wagmi'
// 连接钱包
export const connectWallet = async () => {
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
  } catch (error: any) {
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
// 完整的余额格式化工具类
export class BalanceFormatter {
  // 标准格式化
  static format(balanceWei: any, options: { decimals?: number; useGrouping?: boolean; symbol?: string } = {}) {
    const {
      decimals = 4,
      useGrouping = true,
      symbol = 'ETH'
    } = options;

    const balanceEth = ethers.formatEther(balanceWei);
    const number = parseFloat(balanceEth);

    const formatted = number.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: useGrouping
    });

    return `${formatted} ${symbol}`;
  }

  // 简洁格式（自动精度）
  static formatCompact(balanceWei: ethers.BigNumberish) {
    const balanceEth = parseFloat(ethers.formatEther(balanceWei));

    if (balanceEth >= 1000) {
      return balanceEth.toFixed(0).toLocaleString() + ' ETH';
    } else if (balanceEth >= 1) {
      return balanceEth.toFixed(4) + ' ETH';
    } else if (balanceEth >= 0.001) {
      return balanceEth.toFixed(6) + ' ETH';
    } else {
      return balanceEth.toFixed(8) + ' ETH';
    }
  }

  // 仅数字，无单位
  static formatNumberOnly(balanceWei: ethers.BigNumberish, decimals = 4) {
    const balanceEth = ethers.formatEther(balanceWei);
    return parseFloat(balanceEth).toFixed(decimals);
  }
}
