'use client'
import { useState, useEffect } from "react"
import { useSwitchChain, useChainId } from 'wagmi';
import { ListBox, Select, Label, Key } from "@heroui/react";
import { WalletList } from "@/app/components/walletConfig/walletList";
import { useAppStore } from '@/app/store/index'

export function HeadBar() {
  const chainId = useChainId();
  const { chains, switchChain, isPending } = useSwitchChain();
  const [selectedChain, setSelectedChain] = useState<Key | null>(chainId);

  // 订阅 connectionStatus
  const connectionStatus = useAppStore((state) => state.connectionStatus)

  // 同步当前网络
  useEffect(() => {
    if (chainId) {
      setSelectedChain(chainId);
    }
    // to do
  }, [chainId]);

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

    if (targetChainId === chainId) {
      console.log('已经是当前网络');
      return;
    }

    console.log('切换到网络:', targetChainId);
    setSelectedChain(key);

    if (switchChain) {
      switchChain({ chainId: targetChainId });
    }
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
            {chains.map((chain) => (
              <ListBox.Item
                key={chain.id}
                id={chain.id}
                textValue={chain.name}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex flex-col">
                    <Label>{chain.name}</Label>

                  </div>
                  <div>
                    {chain.id === chainId && (
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