import { StateCreator } from 'zustand'
import { AppState } from './types'

export const createWalletSlice: StateCreator<AppState, [], [], AppState> = (set, get, store) => ({
  connectionStatus: null,     // 初始值
  walletName: '',             // 初始值
  walletAdress: undefined,
  chainId: undefined,
  rpcUrls: [],

  setWallet: (data) => set((state) => ({
    ...state,
    ...data
  })),

  resetWallet: () => set({
    connectionStatus: null,
    walletName: '',
    walletAdress: undefined,
    chainId: undefined,
    rpcUrls: []
  }),
})