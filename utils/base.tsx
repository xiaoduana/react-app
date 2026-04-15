import { ethers } from 'ethers'

declare global {
  interface Window {
    ethereum: any;
  }
}

// 连接钱包
export const connectWallet = async () => {
  let msg = {};
  // 1. 先检查是否已经有可用的账户（不弹窗）
  let accounts = await window.ethereum.request({ method: 'eth_accounts' });

  if (accounts.length > 0) {
    // 已有授权，直接使用
    return accounts[0];
  }

  // 2. 如果没有，再尝试请求连接，并捕获 4001 错误
  try {
    accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    return accounts[0];
  } catch (error: any) {
    // 捕获并明确区分错误类型
    if (error.code === 4001) {
      // 这种情况通常是用户主动拒绝了弹窗，或者是前面提到的“挂起”状态
      alert('请打开 MetaMask 插件，完成或取消之前的连接请求，然后刷新页面重试。');
    } else {
      console.error('连接钱包失败:', error);
    }
    throw error;
  }
};

export const getSigner = async () => {
  // 1. 检查 MetaMask 是否已安装
  if (typeof window.ethereum !== 'undefined') {
    console.log('MetaMask 已安装!');

    // 2. 创建 BrowserProvider 实例
    // 这个 provider 会通过 MetaMask 与区块链交互[citation:2][citation:6]
    const provider = new ethers.BrowserProvider(window.ethereum);

    try {
      // 3. 请求用户授权连接账户
      // 这会弹出 MetaMask 的连接请求窗口[citation:1][citation:5]
      await provider.send("eth_requestAccounts", []);

      // 4. 获取一个 Signer 实例
      // Signer 代表了用户的钱包身份，可以用来签署交易[citation:10]
      const signer = await provider.getSigner();
      return signer;
    } catch (error) {
      console.error("用户拒绝了连接请求", error);
    }
  } else {
    console.log("请先安装 MetaMask 钱包插件!");
  }
}
interface GetContractParams {
  rpcUrl: string;
  contractAddress: string;
  walletAddress: string;
  abi: Array<any>;
  signerObj?: any, // 可选的签名器对象，如果需要发送交易则必须提供
  func?: (contract: ethers.Contract) => any; // 可选的回调函数，用于在获取合约实例后执行特定操作
  err?: (err: any) => any
}

export const getContract = async ({
  rpcUrl,
  contractAddress,
  walletAddress,
  abi,
  signerObj,
  func,
  err
}: GetContractParams) => {
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  // 需要查询的代币合约地址和 ABI（只需 balanceOf 函数）
  const tokenAddress = contractAddress;
  const tokenABI = abi;

  try {
    const code = await provider.getCode(tokenAddress);
    if (code === "0x") {
      err && err("地址不是合约！")
      return;
    }

    const tokenContract = new ethers.Contract(tokenAddress, tokenABI, signerObj || provider);
    console.log("-------合约实例:", tokenContract);
    try {
      func && func(tokenContract);
    } catch (error) {
      err && err(error)
      console.log(error)
    }

  } catch (error) {
    console.error("查询失败:", error);
  }
}

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
