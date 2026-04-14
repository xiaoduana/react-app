export interface WalletMsg {
  connectionStatus: boolean | null  // 连接状态
  walletName: string                 // 钱包名称
  walletAdress: `0x${string}` | undefined
}

export interface AppState extends WalletMsg {
  setWallet: (data: Partial<WalletMsg>) => void
  resetWallet: () => void
}