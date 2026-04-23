"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
} from "wagmi";
import { Pool, Position } from "@uniswap/v3-sdk";
import { Token } from "@uniswap/sdk-core";
import { useChainId } from "wagmi";
import { parseUnits, formatUnits, erc20Abi } from "viem";
import { useAppStore } from '@/app/store/index';
import JSBI from "jsbi";

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

// 手续费等级
const FEE_TIERS = [
  { value: 500, label: "0.05%", tickSpacing: 10 },
  { value: 3000, label: "0.3%", tickSpacing: 60 },
  { value: 10000, label: "1%", tickSpacing: 200 },
];

// slot0 返回的元组类型
type Slot0Tuple = readonly [
  sqrtPriceX96: bigint,
  tick: number,
  observationIndex: number,
  observationCardinality: number,
  observationCardinalityNext: number,
  feeProtocol: number,
  unlocked: boolean
];

// 获取 token 信息
function getTokenInfo(address: string) {
  const lowerAddress = address.toLowerCase();
  const config = TOKEN_CONFIG[lowerAddress];
  if (config) return config;
  return {
    symbol: `${address.slice(0, 6)}...${address.slice(-4)}`,
    decimals: 18,
    name: "Unknown Token",
  };
}

// 计算 pool 地址（需要根据实际情况实现）
function computePoolAddress(token0: string, token1: string, fee: number): string {
  // 确保 token0 地址小于 token1 地址
  const [t0, t1] = token0.toLowerCase() < token1.toLowerCase()
    ? [token0, token1]
    : [token1, token0];
  // TODO: 实现真正的 pool 地址计算
  // 可以使用 @uniswap/v3-sdk 的 computePoolAddress 方法
  return "0x...";
}

// Pool ABI
const poolAbi = [
  {
    inputs: [],
    name: "slot0",
    outputs: [
      { name: "sqrtPriceX96", type: "uint160" },
      { name: "tick", type: "int24" },
      { name: "observationIndex", type: "uint16" },
      { name: "observationCardinality", type: "uint16" },
      { name: "observationCardinalityNext", type: "uint16" },
      { name: "feeProtocol", type: "uint8" },
      { name: "unlocked", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "liquidity",
    outputs: [{ name: "", type: "uint128" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// NFT Position Manager ABI (mint 方法)
const positionManagerAbi = [
  {
    name: "mint",
    type: "function",
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "token0", type: "address" },
          { name: "token1", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "tickLower", type: "int24" },
          { name: "tickUpper", type: "int24" },
          { name: "amount0Desired", type: "uint256" },
          { name: "amount1Desired", type: "uint256" },
          { name: "amount0Min", type: "uint256" },
          { name: "amount1Min", type: "uint256" },
          { name: "recipient", type: "address" },
          { name: "deadline", type: "uint256" },
        ],
      },
    ],
    outputs: [
      { name: "tokenId", type: "uint256" },
      { name: "liquidity", type: "uint128" },
      { name: "amount0", type: "uint256" },
      { name: "amount1", type: "uint256" },
    ],
  },
] as const;

interface AddLiquidityModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddLiquidityModal({
  isOpen,
  onOpenChange,
  onSuccess,
}: AddLiquidityModalProps) {
  const { walletAdress } = useAppStore();
  const chainId = useChainId();

  // 表单状态
  const [token0Address, setToken0Address] = useState<string>("");
  const [token1Address, setToken1Address] = useState<string>("");
  const [feeTier, setFeeTier] = useState<number>(3000);
  const [amount0, setAmount0] = useState<string>("");
  const [amount1, setAmount1] = useState<string>("");
  const [priceLower, setPriceLower] = useState<string>("");
  const [priceUpper, setPriceUpper] = useState<string>("");
  const [slippage, setSlippage] = useState<number>(0.5);

  // 计算状态
  const [isCalculating, setIsCalculating] = useState(false);
  const [liquidityInfo, setLiquidityInfo] = useState<{
    liquidity: string;
    amount0Min: string;
    amount1Min: string;
    tickLower: number;
    tickUpper: number;
  } | null>(null);

  // 获取 Pool 信息（确保 token0 < token1）
  const { token0, token1, isReversed } = useMemo(() => {
    if (!token0Address || !token1Address) {
      return { token0: null, token1: null, isReversed: false };
    }
    const t0 = token0Address.toLowerCase();
    const t1 = token1Address.toLowerCase();
    if (t0 < t1) {
      return { token0: token0Address, token1: token1Address, isReversed: false };
    } else {
      return { token0: token1Address, token1: token0Address, isReversed: true };
    }
  }, [token0Address, token1Address]);

  const poolAddress = useMemo(() => {
    if (!token0 || !token1 || !feeTier) return null;
    return computePoolAddress(token0, token1, feeTier);
  }, [token0, token1, feeTier]);

  // 获取 pool 的 slot0 数据 - 正确解析元组类型
  const { data: slot0Raw, refetch: refetchSlot0 } = useReadContract({
    address: poolAddress as `0x${string}`,
    abi: poolAbi,
    functionName: "slot0",
    query: { enabled: !!poolAddress },
  });

  // 正确解析 slot0 数据（元组转对象）
  const slot0Data = useMemo(() => {
    if (!slot0Raw) return null;
    // slot0Raw 是元组类型 [sqrtPriceX96, tick, ...]
    const tuple = slot0Raw as unknown as Slot0Tuple;
    return {
      sqrtPriceX96: tuple[0],
      tick: tuple[1],
    };
  }, [slot0Raw]);

  // 获取 pool 的流动性
  const { data: poolLiquidity } = useReadContract({
    address: poolAddress as `0x${string}`,
    abi: poolAbi,
    functionName: "liquidity",
    query: { enabled: !!poolAddress },
  });

  // 检查 token 授权
  const { data: allowance0, refetch: refetchAllowance0 } = useReadContract({
    address: token0Address as `0x${string}`,
    abi: erc20Abi,
    functionName: "allowance",
    args: [walletAdress as `0x${string}`, NONFUNGIBLE_POSITION_MANAGER as `0x${string}`],
    query: { enabled: !!token0Address && !!walletAdress },
  });
  console.log("--==++,allowance0", allowance0)

  const { data: allowance1, refetch: refetchAllowance1 } = useReadContract({
    address: token1Address as `0x${string}`,
    abi: erc20Abi,
    functionName: "allowance",
    args: [walletAdress as `0x${string}`, NONFUNGIBLE_POSITION_MANAGER as `0x${string}`],
    query: { enabled: !!token1Address && !!walletAdress },
  });
  console.log("--==++,allowance1", allowance1)

  // 授权操作
  const { writeContract: approve0, isPending: isApproving0 } = useWriteContract();
  const { writeContract: approve1, isPending: isApproving1 } = useWriteContract();

  // 添加流动性操作
  const {
    writeContract: mint,
    data: mintHash,
    isPending: isMinting,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: mintHash,
  });

  // 计算是否需要授权
  const needApprove0 = useMemo(() => {
    console.log("----")
    if (!amount0 || !allowance0) return false;
    const amount0Raw = parseUnits(amount0, getTokenInfo(token0Address).decimals);
    console.log(allowance0, amount0Raw)
    return allowance0 < amount0Raw;
  }, [amount0, allowance0, token0Address]);

  const needApprove1 = useMemo(() => {
    console.log("====")
    if (!amount1 || !allowance1) return false;
    const amount1Raw = parseUnits(amount1, getTokenInfo(token1Address).decimals);
    console.log(allowance1, amount1Raw)
    return allowance1 < amount1Raw;
  }, [amount1, allowance1, token1Address]);

  // 根据价格计算 tick
  const priceToTick = useCallback((price: number, token0Decimals: number, token1Decimals: number) => {
    // 调整价格以考虑 decimals
    const adjustedPrice = price * Math.pow(10, token1Decimals - token0Decimals);
    // tick = log(price) / log(1.0001)
    return Math.floor(Math.log(adjustedPrice) / Math.log(1.0001));
  }, []);

  // 计算流动性
  const calculateLiquidity = useCallback(async () => {
    if (
      !token0 ||
      !token1 ||
      !feeTier ||
      !amount0 ||
      !amount1 ||
      !priceLower ||
      !priceUpper ||
      !slot0Data ||
      !poolLiquidity
    ) {
      return;
    }

    setIsCalculating(true);

    try {
      const token0Info = getTokenInfo(token0);
      const token1Info = getTokenInfo(token1);

      const token0Instance = new Token(
        chainId,
        token0 as `0x${string}`,
        token0Info.decimals,
        token0Info.symbol,
        token0Info.name
      );
      const token1Instance = new Token(
        chainId,
        token1 as `0x${string}`,
        token1Info.decimals,
        token1Info.symbol,
        token1Info.name
      );

      const { sqrtPriceX96, tick: currentTick } = slot0Data;
      const poolLiquidityBigInt = poolLiquidity as bigint;

      // 计算 tick 范围
      const priceLowerNum = parseFloat(priceLower);
      const priceUpperNum = parseFloat(priceUpper);

      let tickLower = priceToTick(priceLowerNum, token0Info.decimals, token1Info.decimals);
      let tickUpper = priceToTick(priceUpperNum, token0Info.decimals, token1Info.decimals);

      // 确保 tickLower < tickUpper
      if (tickLower >= tickUpper) {
        [tickLower, tickUpper] = [tickUpper, tickLower];
      }

      // 确保 tick 是 tickSpacing 的倍数
      const tickSpacing = FEE_TIERS.find((t) => t.value === feeTier)?.tickSpacing || 60;
      const roundedTickLower = Math.floor(tickLower / tickSpacing) * tickSpacing;
      const roundedTickUpper = Math.ceil(tickUpper / tickSpacing) * tickSpacing;

      // 解析输入金额（注意：如果 token 顺序是反的，需要交换金额）
      let amount0Raw: bigint;
      let amount1Raw: bigint;

      if (isReversed) {
        // 用户选择的顺序与合约顺序相反
        amount0Raw = parseUnits(amount1, token1Info.decimals);
        amount1Raw = parseUnits(amount0, token0Info.decimals);
      } else {
        amount0Raw = parseUnits(amount0, token0Info.decimals);
        amount1Raw = parseUnits(amount1, token1Info.decimals);
      }

      // 创建 Pool 实例
      const poolInstance = new Pool(
        token0Instance,
        token1Instance,
        feeTier,
        sqrtPriceX96.toString(),
        poolLiquidityBigInt.toString(),
        currentTick
      );

      // 创建 Position
      const position = Position.fromAmounts({
        pool: poolInstance,
        tickLower: roundedTickLower,
        tickUpper: roundedTickUpper,
        amount0: JSBI.BigInt(amount0Raw.toString()),
        amount1: JSBI.BigInt(amount1Raw.toString()),
        useFullPrecision: true,
      });

      // 计算最小接收数量（滑点保护）
      const slippageMultiplier = 1 - slippage / 100;
      const amount0Min = JSBI.multiply(
        position.amount0.quotient,
        JSBI.BigInt(Math.floor(slippageMultiplier * 10000))
      );
      const amount1Min = JSBI.multiply(
        position.amount1.quotient,
        JSBI.BigInt(Math.floor(slippageMultiplier * 10000))
      );

      setLiquidityInfo({
        liquidity: position.liquidity.toString(),
        amount0Min: amount0Min.toString(),
        amount1Min: amount1Min.toString(),
        tickLower: roundedTickLower,
        tickUpper: roundedTickUpper,
      });
    } catch (error) {
      console.error("计算流动性失败:", error);
    } finally {
      setIsCalculating(false);
    }
  }, [
    token0,
    token1,
    feeTier,
    amount0,
    amount1,
    priceLower,
    priceUpper,
    slot0Data,
    poolLiquidity,
    chainId,
    slippage,
    isReversed,
    priceToTick,
  ]);

  // 当输入变化时重新计算
  useEffect(() => {
    const timer = setTimeout(() => {
      if (amount0 && amount1 && priceLower && priceUpper && slot0Data) {
        calculateLiquidity();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [amount0, amount1, priceLower, priceUpper, slot0Data, calculateLiquidity]);

  // 处理授权
  const handleApprove = async (tokenAddress: string, isToken0: boolean) => {
    const tokenInfo = getTokenInfo(tokenAddress);
    const amount = isToken0 ? amount0 : amount1;
    const amountRaw = parseUnits(amount, tokenInfo.decimals);

    const approveFn = isToken0 ? approve0 : approve1;
    approveFn({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: "approve",
      args: [NONFUNGIBLE_POSITION_MANAGER as `0x${string}`, amountRaw],
    });
  };

  // 处理添加流动性
  const handleAddLiquidity = async () => {
    if (
      !walletAdress ||
      !token0 ||
      !token1 ||
      !feeTier ||
      !liquidityInfo
    ) {
      return;
    }

    const token0Info = getTokenInfo(token0);
    const token1Info = getTokenInfo(token1);

    // 获取金额（已按合约顺序排列）
    let amount0Desired: bigint;
    let amount1Desired: bigint;

    if (isReversed) {
      amount0Desired = parseUnits(amount1, token1Info.decimals);
      amount1Desired = parseUnits(amount0, token0Info.decimals);
    } else {
      amount0Desired = parseUnits(amount0, token0Info.decimals);
      amount1Desired = parseUnits(amount1, token1Info.decimals);
    }

    const mintParams = {
      token0: token0 as `0x${string}`,
      token1: token1 as `0x${string}`,
      fee: feeTier,
      tickLower: liquidityInfo.tickLower,
      tickUpper: liquidityInfo.tickUpper,
      amount0Desired: amount0Desired,
      amount1Desired: amount1Desired,
      amount0Min: BigInt(liquidityInfo.amount0Min),
      amount1Min: BigInt(liquidityInfo.amount1Min),
      recipient: walletAdress as `0x${string}`,
      deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 20),
    };

    mint({
      address: NONFUNGIBLE_POSITION_MANAGER as `0x${string}`,
      abi: positionManagerAbi,
      functionName: "mint",
      args: [mintParams],
    });
  };

  // 监听成功
  useEffect(() => {
    if (isSuccess) {
      // 重置表单
      setToken0Address("");
      setToken1Address("");
      setAmount0("");
      setAmount1("");
      setPriceLower("");
      setPriceUpper("");
      setLiquidityInfo(null);
      onOpenChange(false);
      onSuccess?.();
    }
  }, [isSuccess, onOpenChange, onSuccess]);

  // 获取可用的 token 列表
  const availableTokens = useMemo(() => {
    return Object.entries(TOKEN_CONFIG).map(([address, info]) => ({
      address,
      symbol: info.symbol,
      decimals: info.decimals,
    }));
  }, []);

  const isValid =
    token0Address &&
    token1Address &&
    token0Address !== token1Address &&
    amount0 &&
    amount1 &&
    Number(amount0) > 0 &&
    Number(amount1) > 0 &&
    priceLower &&
    priceUpper &&
    Number(priceLower) > 0 &&
    Number(priceUpper) > Number(priceLower) &&
    liquidityInfo;

  const isProcessing = isApproving0 || isApproving1 || isMinting || isConfirming;
  console.log(needApprove0, needApprove1)
  const needAnyApprove = needApprove0 || needApprove1;

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container>
        <Modal.Dialog className="sm:max-w-150">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>添加流动性</Modal.Heading>
          </Modal.Header>
          <Modal.Body className="max-h-[70vh] overflow-y-auto">
            <div className="space-y-4">
              {/* Token 选择 */}
              <div>
                <div className="font-medium mb-2">选择代币对</div>
                <div className="flex gap-2">
                  <Select
                    className="flex-1"
                    placeholder="选择代币"
                    defaultValue={token0Address ? token0Address : ""}
                    value={token0Address}
                    onChange={(key: Key | null) => {
                      console.log(key)
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

                  <span className="flex items-center text-gray-400">/</span>

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

              {/* 手续费率 */}
              <div>
                <div className="font-medium mb-2">手续费率</div>
                <div className="flex gap-2">
                  {FEE_TIERS.map((tier) => (
                    <Button
                      key={tier.value}
                      variant={feeTier === tier.value ? "secondary" : "outline"}
                      onPress={() => setFeeTier(tier.value)}
                      className="flex-1"
                    >
                      {tier.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* 存入金额 */}
              <div>
                <div className="font-medium mb-2">存入金额</div>
                <Card className="w-full" variant="secondary">
                  <Card.Content className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Input
                        type="number"
                        value={amount0}
                        onChange={(e) => setAmount0(e.target.value)}
                        placeholder="0.0"
                        className="w-3/5"
                        disabled={!token0Address}
                      />
                      <div className="w-2/5 text-right font-medium">
                        {token0Address ? getTokenInfo(token0Address).symbol : "Token 0"}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <Input
                        type="number"
                        value={amount1}
                        onChange={(e) => setAmount1(e.target.value)}
                        placeholder="0.0"
                        className="w-3/5"
                        disabled={!token1Address}
                      />
                      <div className="w-2/5 text-right font-medium">
                        {token1Address ? getTokenInfo(token1Address).symbol : "Token 1"}
                      </div>
                    </div>
                  </Card.Content>
                </Card>
              </div>

              {/* 价格区间 */}
              <div>
                <div className="font-medium mb-2">价格区间</div>
                <Card className="w-full" variant="secondary">
                  <Card.Content className="space-y-3">
                    <div className="flex justify-between items-center gap-2">
                      <Input
                        type="number"
                        value={priceLower}
                        onChange={(e) => setPriceLower(e.target.value)}
                        placeholder="最低价格"
                        className="flex-1"
                      />
                      <span className="text-gray-400">~</span>
                      <Input
                        type="number"
                        value={priceUpper}
                        onChange={(e) => setPriceUpper(e.target.value)}
                        placeholder="最高价格"
                        className="flex-1"
                      />
                    </div>
                    {slot0Data && (
                      <div className="text-sm text-gray-500">
                        当前 Tick: {slot0Data.tick}
                      </div>
                    )}
                  </Card.Content>
                </Card>
              </div>

              {/* 滑点设置 */}
              <div>
                <div className="font-medium mb-2">滑点容忍度</div>
                <div className="flex gap-2">
                  {[0.1, 0.5, 1].map((value) => (
                    <Button
                      key={value}
                      variant={slippage === value ? "secondary" : "outline"}
                      onPress={() => setSlippage(value)}
                      size="sm"
                    >
                      {value}%
                    </Button>
                  ))}
                  <Input
                    type="number"
                    value={slippage.toString()}
                    onChange={(e) => setSlippage(Number(e.target.value))}
                    className="w-24"
                    placeholder="自定义"
                  />
                </div>
              </div>

              {/* 计算结果显示 */}
              {isCalculating && (
                <div className="flex items-center justify-center gap-2 py-4">
                  <Spinner size="sm" />
                  <span>计算中...</span>
                </div>
              )}

              {liquidityInfo && !isCalculating && (
                <Card className="w-full bg-gray-50 dark:bg-gray-800">
                  <Card.Content className="space-y-2">
                    <div className="text-sm">
                      <span className="text-gray-500">预计获得:</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">最小收到 {token0Address ? getTokenInfo(token0Address).symbol : ""}:</span>{" "}
                      {formatUnits(BigInt(liquidityInfo.amount0Min), getTokenInfo(token0Address).decimals)}
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">最小收到 {token1Address ? getTokenInfo(token1Address).symbol : ""}:</span>{" "}
                      {formatUnits(BigInt(liquidityInfo.amount1Min), getTokenInfo(token1Address).decimals)}
                    </div>
                  </Card.Content>
                </Card>
              )}

              {/* 交易状态 */}
              {(isApproving0 || isApproving1 || isMinting || isConfirming) && (
                <div className="flex items-center justify-center gap-2 text-blue-500 py-2">
                  <Spinner size="sm" />
                  <span>
                    {isApproving0 && "授权 Token 0..."}
                    {isApproving1 && "授权 Token 1..."}
                    {isMinting && "确认交易..."}
                    {isConfirming && "处理中..."}
                  </span>
                </div>
              )}

              {isSuccess && (
                <div className="text-green-500 text-center py-2">
                  ✅ 流动性添加成功！
                </div>
              )}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button
              className="w-full"
              slot="close"
              onPress={() => onOpenChange(false)}
              isDisabled={isProcessing}
            >
              取消
            </Button>
            {needAnyApprove ? (
              <Button
                className="w-full"
                onPress={() => {
                  if (needApprove0) handleApprove(token0Address, true);
                  if (needApprove1) handleApprove(token1Address, false);
                }}
                isDisabled={isProcessing}
                isPending={isApproving0 || isApproving1}
                variant="primary"
              >
                授权
              </Button>
            ) : (
              <Button
                className="w-full"
                onPress={handleAddLiquidity}
                isDisabled={!isValid || isProcessing}
                isPending={isMinting || isConfirming}
                variant="primary"
              >
                添加流动性
              </Button>
            )}
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}