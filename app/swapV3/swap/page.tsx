'use client'
import { useState, useEffect, useMemo, useCallback } from "react";
import { useWriteContract, useReadContract } from "wagmi";
import {
  Modal,
  Button,
  Input,
  Select,
  ListBox,
  Card,
  Spinner,
  Key
} from "@heroui/react";
import { swapRouter as abi } from "../abi";

// 合约地址
const NONFUNGIBLE_POSITION_MANAGER = "0xbe766Bf20eFfe431829C5d5a2744865974A0B610";

// Token 配置
const TOKEN_CONFIG: Record<
  string,
  { symbol: string; decimals: number; name: string; logo?: string }
> = {
  "0x4798388e3adE569570Df626040F07DF71135C48E": {
    symbol: "MNTA",
    decimals: 18,
    name: "MNTokenA",
  },
  "0x5A4eA3a013D42Cfd1B1609d19f6eA998EeE06D30": {
    symbol: "MNTB",
    decimals: 6,
    name: "MNTokenB",
  },
  "0x86B5df6FF459854ca91318274E47F4eEE245CF28": {
    symbol: "MNTokenC",
    decimals: 6,
    name: "MNTokenC",
  },
  "0x7af86B1034AC4C925Ef5C3F637D1092310d83F03": {
    symbol: "MNTokenD",
    decimals: 18,
    name: "MNTokenD",
  },
};
export default function Home() {
  const [token0Address, setToken0Address] = useState<string>("");
  const [token1Address, setToken1Address] = useState<string>("");
  const [amount0, setAmount0] = useState<string>("");
  const [amount1, setAmount1] = useState<string>("");

  // 获取可用的 token 列表
  const availableTokens = useMemo(() => {
    return Object.entries(TOKEN_CONFIG).map(([address, info]) => ({
      address,
      symbol: info.symbol,
      decimals: info.decimals,
    }));
  }, []);

  const submit = () => {
    console.log("----")
  }

  return (
    <div>
      <div className="font-medium mb-2">Swap</div>
      <Card className="w-full" variant="secondary">
        <Card.Content className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="w-6/12 mr-10">
              <Input
                type="number"
                value={amount0}
                onChange={(e) => setAmount0(e.target.value)}
                placeholder="0.0"
                className="w-full"
                disabled={!token0Address}
              />
            </div>
            <div className="w-5/12 text-right font-medium">
              <Select
                className="flex-1"
                placeholder="选择代币"
                defaultValue={token0Address ? token0Address : ""}
                value={token0Address}
                onChange={(key: Key | null) => {
                  setToken0Address(key + "");
                }}
              >
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {availableTokens.map((token) => (
                      <ListBox.Item key={token.address} id={token.address} textValue={token.symbol}>
                        <div className="flex items-center gap-2">
                          <span>{token.symbol}</span>
                        </div>
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="w-6/12 mr-10">
              <Input
                type="number"
                value={amount1}
                onChange={(e) => setAmount1(e.target.value)}
                placeholder="0.0"
                className="w-full"
                disabled={!token1Address}
              />
            </div>
            <div className="w-5/12 text-right font-medium">
              <Select
                className="flex-1"
                placeholder="选择代币"
                defaultValue={token1Address ? token1Address : ""}
                value={token1Address}
                onChange={(key) => {
                  setToken1Address(key + "");
                }}
              >
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {availableTokens
                      .filter((t) => t.address !== token0Address)
                      .map((token) => (
                        <ListBox.Item key={token.address} id={token.address} textValue={token.symbol}>
                          {token.symbol}
                        </ListBox.Item>
                      ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>
          </div>
        </Card.Content>
      </Card>
      <Button
        className="w-full"
        onPress={submit}
        variant="primary"
      >
        确定
      </Button>
    </div>
  );
}
