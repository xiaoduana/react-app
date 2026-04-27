'use client'
import { useState, useEffect, useMemo } from "react";
import { useReadContract } from "wagmi";
import { simulateContract, writeContract, waitForTransactionReceipt } from '@wagmi/core';
import { config } from '@/app/config/wagmi-config'; // 需要导入配置
import { parseUnits, formatUnits, erc20Abi } from "viem";
import { useAppStore } from '@/app/store/index';
import {
  Button,
  Input,
  Select,
  ListBox,
  Card,
  Key
} from "@heroui/react";
import { swapRouter as abi, poolAbi } from "../abi";

// 合约地址
const ROUTER_SWAP_ADRESS = "0xD2c220143F5784b3bD84ae12747d97C8A36CeCB2";

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
    symbol: "MNTC",
    decimals: 6,
    name: "MNTokenC",
  },
  "0x7af86B1034AC4C925Ef5C3F637D1092310d83F03": {
    symbol: "MNTD",
    decimals: 18,
    name: "MNTokenD",
  },
};
export default function Home() {
  const { walletAdress } = useAppStore();

  const [token0Address, setToken0Address] = useState<string>("");
  const [token1Address, setToken1Address] = useState<string>("");
  const [amount0, setAmount0] = useState<string>("");
  const [amount1, setAmount1] = useState<string>("");

  const {
    data: poolsData,
  } = useReadContract({
    address: "0xddC12b3F9F7C91C79DA7433D8d212FB78d609f7B",
    abi: poolAbi,
    functionName: 'getAllPools',
  });
  const poolInfo = useMemo(() => {
    if (!poolsData) return []
    return poolsData.reduce((acc: any, cur: any) => {
      const key = cur.token0 + cur.token1;
      if (!acc[key]) {
        // 初始化：用数组存储，第一个元素是最大 tick
        acc[key] = [[cur.tick, cur.index]];
      } else {
        const currentMaxTick = acc[key][0][0];
        // 永远把最大tick添加到首位
        if (cur.tick > currentMaxTick) {
          acc[key].unshift([cur.tick, cur.index]);
        }
      }
      return acc;
    }, {})
  }, [poolsData])

  // 获取可用的 token 列表
  const availableTokens = useMemo(() => {
    return Object.entries(TOKEN_CONFIG).map(([address, info]) => ({
      address,
      symbol: info.symbol,
      decimals: info.decimals,
    }));
  }, []);

  // 检查 token 授权
  const { data: allowance0, refetch: refetchAllowance0 } = useReadContract({
    address: token0Address as `0x${string}`,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [walletAdress as `0x${string}`],
    query: { enabled: !!token0Address && !!walletAdress },
  });

  const { data: allowance1, refetch: refetchAllowance1 } = useReadContract({
    address: token1Address as `0x${string}`,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [walletAdress as `0x${string}`],
    query: { enabled: !!token1Address && !!walletAdress },
  });

  useEffect(() => {
    refetchAllowance0()
  }, [token0Address])
  useEffect(() => {
    refetchAllowance1()
  }, [token1Address])

  const quote = async (funcName: any, type: string) => {
    if (!token0Address || !token1Address) {
      console.error("Token addresses missing");
      return;
    }

    // 安全获取 indexPath
    const poolKey = token0Address + token1Address;
    const pool = poolInfo[poolKey];
    const indexPath = pool?.[0]?.[1] ?? 0;

    // 安全处理 amount0
    let amountIn: bigint;
    try {
      amountIn = typeof amount0 === 'bigint' ? amount0 : BigInt(amount0);
    } catch (e) {
      console.error("Invalid amount0:", amount0);
      return;
    }
    const amountOutMin = parseUnits('250', 6)
    const sqrtPriceLimit = BigInt(0);
    console.log({
      tokenIn: token0Address,
      token1Address,
      indexPath,
      amountIn: amountIn.toString(),
      sqrtPriceLimit: sqrtPriceLimit.toString()
    });

    let params: any;
    if (type === "quote") {
      params = {
        tokenIn: token0Address,
        tokenOut: token1Address,
        indexPath: [indexPath],
        amountIn,
        sqrtPriceLimitX96: sqrtPriceLimit
      };
    } else {
      params = {
        tokenIn: token0Address,
        tokenOut: token1Address,
        indexPath: [indexPath],
        recipient: walletAdress,
        deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 20),
        amountIn: amountIn,
        amountOutMinimum: amountOutMin,
        sqrtPriceLimitX96: sqrtPriceLimit
      };
    }

    try {
      // writeContract({
      //   address: ROUTER_SWAP_ADRESS as `0x${string}`,
      //   abi: abi,
      //   functionName: funcName,
      //   args: [params],
      // });

      // 先模拟调用，检查是否会失败
      const { request } = await simulateContract(config, {
        address: ROUTER_SWAP_ADRESS as `0x${string}`,
        abi: abi,
        functionName: funcName,
        args: [params],
        account: walletAdress as `0x${string}`,
      });

      // console.log("模拟成功，准备发送交易");

      // 2. 发送交易（弹出钱包）
      const hash = await writeContract(config, {
        address: ROUTER_SWAP_ADRESS as `0x${string}`,
        abi: abi,
        functionName: funcName,
        args: [params],
        account: walletAdress as `0x${string}`,
      });
      console.log("Transaction hash:", hash);

      // 可选：等待确认
      const receipt = await waitForTransactionReceipt(config, { hash });
      console.log("交易已确认:", receipt);

      return hash;
    } catch (error) {
      console.error("Write contract failed:", error);
    }
  }

  useEffect(() => {
    if (amount0 || amount1) {
      let type = ""
      if (amount0) {
        type = "quoteExactInput"
      } else {
        type = "quoteExactOutput"
      }
      quote(type, "quote")
    }

  }, [amount0, amount1])

  const submit = () => {
    if (amount0 || amount1) {
      let type = ""
      if (amount0) {
        type = "exactInput"
      } else {
        type = "exactOutput"
      }
      quote(type, "exact")
    }
  }

  return (
    <div>
      <div className="font-medium mb-2">Swap</div>
      <Card className="w-full" variant="secondary">
        <Card.Content className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="w-5/12 mr-10">
              <Input
                type="number"
                value={amount0}
                onChange={(e) => setAmount0(e.target.value)}
                placeholder="0.0"
                className="w-full"
                disabled={!token0Address}
              />
            </div>
            <div className="w-4/12 text-right font-medium">
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
            <div className="w-3/12 ml-10">
              balanceOf:{allowance0 ?? 0}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="w-5/12 mr-10">
              <Input
                type="number"
                value={amount1}
                onChange={(e) => setAmount1(e.target.value)}
                placeholder="0.0"
                className="w-full"
                disabled={!token1Address}
              />
            </div>
            <div className="w-4/12 text-right font-medium">
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
            <div className="w-3/12 ml-10">
              balanceOf:{allowance1 ?? 0}
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
