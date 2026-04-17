'use client'
import { Selection } from 'react-aria-components';
import { useState, useEffect } from "react"
import { PowerIcon, CheckIcon } from "@heroicons/react/24/outline";
import { Button, Modal, useOverlayState, Description, Label, ListBox, Avatar } from "@heroui/react";
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useAppStore } from '@/app/store/index'

export function WalletList() {
  const [walletList] = useState([
    {
      name: "MetaMask",
      des: "连接MetaMask钱包",
      icon: ""
    },
    {
      name: "OKX Wallet",
      des: "连接OKX钱包",
      icon: ""
    },
    {
      name: "Phantom",
      des: "连接Phantom钱包",
      icon: ""
    }
  ]);
  const { connectionStatus, walletName, setWallet } = useAppStore()
  const [walletMap, setWalletMap] = useState<Record<string, any>>({})
  const [selectedWallet, setSelectedWallet] = useState<Selection>(new Set());
  const [isOpen, setIsOpen] = useState(false);
  const state = useOverlayState();
  const { connect, connectors } = useConnect()        // 连接钱包
  const { disconnect } = useDisconnect()              // 断开连接
  const { address, isConnected } = useAccount()        // 自动获取账户状态

  const toggleModal = () => {
    if (connectionStatus) {
      disconnect()
      setWallet({
        connectionStatus: false,
        walletName: "未连接钱包",
        walletAdress: undefined
      })
    } else {
      setIsOpen(true)
    }
  }

  const connectWallet = () => {
    if (!walletMap[Array.from(selectedWallet)[0]]) {
      alert("请检查是否安装对应钱包插件")
    }
    connect({ connector: walletMap[Array.from(selectedWallet)[0]] })
    setWallet({
      connectionStatus: true,
      walletName: Array.from(selectedWallet)[0] + "",
      walletAdress: address
    })
    state.close()
  }


  useEffect(() => {
    if (!connectors) return;
    const map: Record<string, any> = {};
    connectors.forEach(connector => {
      map[connector.name] = connector;
    });
    setWalletMap(map);
  }, [connectors]); // 依赖 connectors，当它变化时重新构建

  useEffect(() => {
    if (address && isConnected) {
      setWallet({
        connectionStatus: true,
        walletAdress: address
      })
    }
  }, [address, isConnected]);

  return (
    <div>
      {connectionStatus && <span className="mr-10">{walletName ? `已连接"${walletName}"钱包"` : walletName}</span>}
      <Button variant="secondary" className="mr-10" onPress={toggleModal}>
        {connectionStatus ? "断开钱包连接" : "连接钱包"}<PowerIcon className="w-5 h-5" />
      </Button>

      <Modal.Backdrop isOpen={isOpen} onOpenChange={setIsOpen}>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-90">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>选择钱包</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <ListBox aria-label="Users" className="w-full" selectionMode="single" selectedKeys={selectedWallet} onSelectionChange={setSelectedWallet}>
                {
                  walletList.map(item => {
                    return (
                      <ListBox.Item key={item.name} id={item.name} textValue={item.name}>
                        <Avatar size="sm">
                          <Avatar.Image
                            alt="Bob"
                            src={walletMap[item.name]?.icon}
                          />
                          <Avatar.Fallback>B</Avatar.Fallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <Label>{item.name}</Label>
                          <Description>{item.des}</Description>
                        </div>
                        <ListBox.ItemIndicator>
                          {({ isSelected }) =>
                            isSelected ? <CheckIcon /> : null
                          }
                        </ListBox.ItemIndicator>
                      </ListBox.Item>
                    )
                  })
                }
              </ListBox>
            </Modal.Body>
            <Modal.Footer>
              <Button className="w-full" slot="close" onClick={connectWallet}>
                确认连接
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div >
  )
}