import { ethers } from 'ethers'

export async function transfer(address: string, privateKey: string, to: string, amount: string) {
  // 1. 连接网络
  const provider = new ethers.JsonRpcProvider(address)
  try {

    // 2. 尝试获取网络信息，这是验证连接的第一步
    const network = await provider.getNetwork();
    console.log(`✅ 连接成功！`);
    console.log(`   网络名称: ${network.name}`);
    console.log(`   链 ID (Chain ID): ${network.chainId}`); // 主网是 1，Sepolia 测试网是 11155111

    // 3. 再试一下获取最新区块号
    const blockNumber = await provider.getBlockNumber();
    console.log(`   最新区块: ${blockNumber}`);
  } catch (error) {
    if (error && typeof error === 'object' && 'message' in error) {
      console.error(`❌ 连接失败: ${(error as { message: string }).message}`);
    } else {
      console.error('❌ 连接失败:', error);
    }
    // 常见错误：地址无效、网络不通、被限流等
  }

  console.log('连接到以太坊网络成功', provider)
  // 3. 发送交易 (需要私钥)
  const wallet = new ethers.Wallet(privateKey, provider)
  const tx = await wallet.sendTransaction({
    to: '0x...',
    value: ethers.parseEther(amount)
  })
  console.log('交易已发送，等待确认...', tx.hash)
  const result = await tx.wait()
  return result
}