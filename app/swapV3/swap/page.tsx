'use client'
import { useState, useEffect, useMemo, useRef } from "react";
import { useReadContract } from "wagmi";
import { simulateContract, writeContract, waitForTransactionReceipt } from '@wagmi/core';
import { config } from '@/app/config/wagmi-config'; // 需要导入配置
import { parseUnits, formatUnits, erc20Abi } from "viem";
import { useAppStore } from '@/app/store/index';
import { safeCompare } from "@/utils/base"
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
const MIN_SQRT_PRICE = BigInt(4295128739)
const MAX_SQRT_PRICE = BigInt(1461446703485210103287273052203988822378723970342)
const getPoolId = (arr: any[]) => {
  if (!arr || arr.length === 0) return [];
  let result = arr.map((item: any) => item[1]);
  return result;
}
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

  const swapTypeRef = useRef<"exactInput" | "exactOutput">("exactInput");
  const isQuotingRef = useRef(false);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const { data: decimals0, refetch: refetchdecimals0 } = useReadContract({
    address: token0Address as `0x${string}`,
    abi: erc20Abi,
    functionName: "decimals",
    query: { enabled: !!token0Address && !!walletAdress },
  });

  const { data: decimals1, refetch: refetchdecimals1 } = useReadContract({
    address: token1Address as `0x${string}`,
    abi: erc20Abi,
    functionName: "decimals",
    query: { enabled: !!token1Address && !!walletAdress },
  });

  useEffect(() => {
    refetchAllowance0()
    refetchdecimals0()
  }, [token0Address])
  useEffect(() => {
    refetchAllowance1()
    refetchdecimals1()
  }, [token1Address])

  const quoteFunc = async (funcName: any, type: string, amountIn: bigint) => {

    if (!token0Address || !token1Address) {
      console.error("Token addresses missing");
      return;
    }
    isQuotingRef.current = true;

    // 安全获取 indexPath
    const poolKey = token0Address + token1Address;
    const pool = poolInfo[poolKey];
    console.log("对应的池子信息:", pool)

    const indexPath = getPoolId(pool)[0]; // 取第一个池子的 indexPath，实际使用中可能需要更复杂的逻辑来选择合适的池子
    if (!indexPath) {
      console.error("No pool found for the selected token pair");
      alert("未找到对应的流动性池，请选择其他代币组合");
      return;
    }
    console.log("indexPath:", indexPath)
    const zeroForOne =
      token0Address.toLowerCase() < token1Address.toLowerCase();

    const sqrtPriceLimitX96 = zeroForOne
      ? MIN_SQRT_PRICE + BigInt(1)
      : MAX_SQRT_PRICE - BigInt(1); // 设置一个合理的价格限制，避免过滑点
    // const sqrtPriceLimitX96 = MIN_SQRT_PRICE + BigInt(1); // 设置一个合理的价格限制，避免过滑点

    let params: any;
    if (type === "quote") {
      params = {
        tokenIn: token0Address,
        tokenOut: token1Address,
        indexPath: [indexPath],
        sqrtPriceLimitX96: sqrtPriceLimitX96
      };
      if (funcName === "quoteExactInput") {
        params.amountIn = amountIn;
      } else {
        params.amountOut = amountIn;
      }
      console.log("模拟调用参数:", params);
      console.log("模拟调用函数:", funcName);
      try {
        // 先模拟调用，检查是否会失败
        const { result } = await simulateContract(config, {
          address: ROUTER_SWAP_ADRESS as `0x${string}`,
          abi: abi,
          functionName: funcName,
          args: [params],
          account: walletAdress as `0x${string}`,
        });
        console.log(funcName)
        console.log("模拟成功，准备发送交易", result);
        const formattedResult =
          funcName === "quoteExactInput"
            ? formatUnits(result as bigint, decimals1 ?? 18) // tokenOut
            : formatUnits(result as bigint, decimals0 ?? 18); // tokenOut

        console.log("模拟成功，报价结果:", formattedResult);

        funcName === "quoteExactInput"
          ? setAmount1(formattedResult)
          : setAmount0(formattedResult);
      } catch (error) {
        console.error("Write contract failed:", error);
      }
    } else {
      params = {
        tokenIn: token0Address,
        tokenOut: token1Address,
        indexPath: [indexPath],
        recipient: walletAdress,
        deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 20),
        sqrtPriceLimitX96: sqrtPriceLimitX96
      };
      try {
        if (!decimals1 || !decimals0) return;
        if (funcName === "exactInput") {
          params.amountIn = amountIn;
          params.amountOutMinimum = parseUnits(amount1, decimals1) * BigInt(99) / BigInt(100); // 设置一个合理的滑点容忍度，例如 1%
        } else {
          params.amountOut = amountIn;
          params.amountInMaximum = parseUnits(amount0, decimals0) * BigInt(105) / BigInt(100); // 设置一个合理的滑点容忍度，例如 1%
        }

        console.log(params);
        console.log("funcName", funcName);
        const hash = await writeContract(config, {
          address: ROUTER_SWAP_ADRESS as `0x${string}`,
          abi: abi,
          functionName: funcName,
          args: [params],
          account: walletAdress as `0x${string}`,
          gas: BigInt(800000),
        });
        console.log("Transaction hash:", hash);

        // 可选：等待确认
        const receipt = await waitForTransactionReceipt(config, { hash });
        console.log("交易已确认:", receipt);

        setIsProcessing(false);
      } catch (error) {
        console.error("Write contract failed:", error);
        setIsProcessing(false);
      }
    }
  }

  const submit = () => {
    setIsProcessing(true);
    if (safeCompare(amount0, allowance0) === 1) {
      alert("输入金额不能大于余额")
      return
    }
    if (safeCompare(amount1, allowance1) === 1) {
      alert("输入金额不能大于余额")
      return
    }
    if (!decimals1 || !decimals0) return;
    if (amount0 || amount1) {
      let amountIn: bigint;
      if (swapTypeRef.current === "exactInput") {
        amountIn = typeof amount0 === 'bigint' ? amount0 : parseUnits(amount0, decimals0 ?? 18);
      } else {
        amountIn = typeof amount1 === 'bigint' ? amount1 : parseUnits(amount1, decimals1 ?? 18);
      }
      quoteFunc(swapTypeRef.current, "exact", amountIn)
    }
  }
  const handleSetAmount0 = (value: string) => {
    setAmount0(value);
  }
  useEffect(() => {
    if (isQuotingRef.current) {
      isQuotingRef.current = false;
      return;
    }
    if (!decimals0) return;
    if (!amount0) return;

    const timer = setTimeout(() => {
      let type = "quoteExactInput";
      let amountIn = typeof amount0 === 'bigint' ? amount0 : parseUnits(amount0, decimals0);
      swapTypeRef.current = "exactInput";
      quoteFunc(type, "quote", amountIn);
    }, 500);

    return () => clearTimeout(timer);
  }, [amount0]); // amount0 变化时才触发
  const handleSetAmount1 = (value: string) => {
    setAmount1(value);
  }
  useEffect(() => {
    if (isQuotingRef.current) {
      isQuotingRef.current = false;
      return;
    }
    if (!decimals1) return;
    if (!amount1) return;

    const timer = setTimeout(() => {
      let type = "quoteExactOutput"
      if (!decimals1) return;
      let amountIn = typeof amount1 === 'bigint' ? amount1 : parseUnits(amount1, decimals1);
      swapTypeRef.current = "exactOutput";
      quoteFunc(type, "quote", amountIn)
    }, 500);

    return () => clearTimeout(timer);
  }, [amount1]); // amount1 变化时才触发

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
                onChange={(e) => handleSetAmount0(e.target.value)}
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
              -
              decimals:{decimals0 ?? 0}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="w-5/12 mr-10">
              <Input
                type="number"
                value={amount1}
                onChange={(e) => handleSetAmount1(e.target.value)}
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
              -
              decimals:{decimals1 ?? 0}
            </div>
          </div>
        </Card.Content>
      </Card>
      <Button
        className="w-full"
        onPress={submit}
        isDisabled={isProcessing}
        variant="primary"
      >
        确定
      </Button>
    </div>
  );
}
