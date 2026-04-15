'use client'
import { useState, useEffect } from "react"
import { useSwitchChain, useChainId } from 'wagmi';
import { ListBox, Select, Label, Key } from "@heroui/react";
import { WalletList } from "@/app/components/walletConfig/walletList";
import { useAppStore } from '@/app/store/index'
import { SUPPORTED_NETWORKS } from "@/JSON/netWork"

export function HeadBar() {
  const { switchChain, isPending } = useSwitchChain();
  const [selectedChain, setSelectedChain] = useState<Key | null>();

  const { connectionStatus, setWallet, chainId: storeChainId } = useAppStore()

  // 同步当前网络
  useEffect(() => {
    if (storeChainId) {
      setSelectedChain(storeChainId);
    }
  }, [storeChainId]);

  useEffect(() => {
    if (!connectionStatus) {
      setSelectedChain(null);
    }
  }, [connectionStatus])

  // 处理网络切换 - 使用 onChange
  const handleNetworkChange = (key: Key | null) => {
    console.log('选中的 key:', key);

    if (!key) return;

    const targetChainId = Number(key);
    if (isNaN(targetChainId)) return;

    if (targetChainId === storeChainId) {
      console.log('已经是当前网络');
      return;
    }

    console.log('切换到网络:', targetChainId);
    setSelectedChain(key);

    if (switchChain) {
      switchChain({ chainId: targetChainId });
    }

    const arr = SUPPORTED_NETWORKS.find(item => item.chainId === key)?.rpcUrls || []
    setWallet({
      chainId: targetChainId,
      rpcUrls: [...arr]
    })
  };
  return (
    <div className="flex justify-end items-center h-20 bg-blue-400 shadow">
      <Select
        className="w-[256px] mr-5"
        placeholder="请选择需要切换的网络"
        value={selectedChain}
        onChange={handleNetworkChange}  // ✅ 使用 onChange 替代 onSelectionChange
        isDisabled={isPending || !connectionStatus}
      >
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox aria-label="change chain">
            {SUPPORTED_NETWORKS.map((chain: any) => (
              <ListBox.Item
                key={chain.chainId}
                id={chain.chainId}
                textValue={chain.chainName}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex flex-col">
                    <Label>{chain.chainName}</Label>

                  </div>
                  <div>
                    {chain.chainId === storeChainId && (
                      <span className="text-xs text-green-500">当前网络</span>
                    )}
                  </div>
                </div>
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
      <WalletList />
    </div>
  );
}