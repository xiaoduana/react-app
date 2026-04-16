import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createWalletSlice } from './wallet'
import { AppState } from './types'

export const useAppStore = create<AppState>()(
  persist(
    (set, get, store) => ({
      ...createWalletSlice(set, get, store),
    }),
    {
      name: 'app-storage',                           // localStorage 的 key
      storage: createJSONStorage(() => localStorage), // 使用 localStorage
      partialize: (state) => ({                       // 只持久化部分字段
        connectionStatus: state.connectionStatus,
        walletName: state.walletName,
        walletAdress: state.walletAdress,
        chainId: state.chainId,
        rpcUrls: state.rpcUrls,
        targetBlock: state.targetBlock
        // 不持久化 setWallet 和 resetWallet 函数
      }),
    }
  )
)