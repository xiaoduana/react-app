"use client";

import { Pagination, Table, Button, Modal, Card, Input, ListBox, Select } from "@heroui/react";

import { useEffect, useMemo, useState } from "react";
import { useReadContracts, useReadContract } from 'wagmi';
import { Pool, Position } from '@uniswap/v3-sdk';
import { Token } from '@uniswap/sdk-core';
import { positionAbi as abi, poolAbi } from "../abi";
import { useAppStore } from '@/app/store/index';
import { useChainId } from 'wagmi';

import { AddLiquidityModal } from "./AddLiquidityModal";

const columns = [
  { id: "tokenPair", name: "Token Pair" },
  { id: "amounts", name: "Amounts" },
  { id: "feeTier", name: "Fee Tier" },
  { id: "priceRange", name: "Price Range" },
  { id: "liquidity", name: "Liquidity" },
];

const ROWS_PER_PAGE = 15;
const POSITION_MANAGER_ADDRESS = '0xbe766Bf20eFfe431829C5d5a2744865974A0B610';

// Token 信息缓存（可扩展）
const TOKEN_SYMBOL_CACHE: Record<string, string> = {
  // 添加你常用的 token
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': 'WETH',
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'USDC',
  '0xdac17f958d2ee523a2206206994597c13d831ec7': 'USDT',
  '0x6b175474e89094c44da98b954eedeac495271d0f': 'DAI',
};

// 获取 token symbol（简化版）
function getTokenSymbol(address: any): string {
  const lowerAddress = address.toLowerCase();
  return TOKEN_SYMBOL_CACHE[lowerAddress] || `${lowerAddress.slice(0, 6)}...${lowerAddress.slice(-4)}`;
}

// 获取 token decimals
function getTokenDecimals(address: any): number {
  const lowerAddress = address.toLowerCase();
  // 常见 token decimals
  const decimalsMap: Record<string, number> = {
    '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': 18, // WETH
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 6,  // USDC
    '0xdac17f958d2ee523a2206206994597c13d831ec7': 6,  // USDT
    '0x6b175474e89094c44da98b954eedeac495271d0f': 18, // DAI
  };
  return decimalsMap[lowerAddress] || 18;
}

// 计算 pool 地址（需要根据你的实际情况实现）
function computePoolAddress(token0: any, token1: any, fee: any): string {
  // TODO: 实现真正的 pool 地址计算
  // 可以使用 @uniswap/v3-sdk 的 computePoolAddress
  // 或者从你的合约配置中获取
  return '0x...';
}

interface PositionWithDetails {
  tokenId: string;
  token0Symbol: string;
  token1Symbol: string;
  token0Address: string;
  token1Address: string;
  amount0: string;
  amount1: string;
  fee: number;
  feePercent: string;
  tickLower: number;
  tickUpper: number;
  liquidity: string;
  poolAddress: string;
}

export default function Home() {
  const [page, setPage] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const { walletAdress } = useAppStore();
  const chainId = useChainId();

  // ========== 第一步：获取用户的所有 tokenId ==========
  const { data: balance, isLoading: balanceLoading } = useReadContract({
    address: POSITION_MANAGER_ADDRESS as `0x${string}`,
    abi: abi,
    functionName: 'balanceOf',
    args: walletAdress ? [walletAdress as `0x${string}`] : undefined,
    query: { enabled: !!walletAdress },
  });

  // 获取所有 tokenId（通过循环调用 tokenOfOwnerByIndex）
  const { data: tokenIdList, isLoading: tokenIdsLoading } = useReadContracts({
    contracts: balance && Number(balance) > 0
      ? Array.from({ length: Number(balance) }, (_, i) => ({
        address: POSITION_MANAGER_ADDRESS as `0x${string}`,
        abi: abi,
        functionName: 'tokenOfOwnerByIndex',
        args: [walletAdress as `0x${string}`, BigInt(i)],
      }))
      : [],
    query: { enabled: !!walletAdress && !!balance && Number(balance) > 0 },
  });

  const tokenIds = useMemo(() => {
    // if (!tokenIdList) return [];
    // return tokenIdList
    //   .filter((item) =>
    //     item.status === 'success' && item.result !== undefined
    //   )
    //   .map(item => item.result);
    return [BigInt(1), BigInt(2)]
  }, [tokenIdList]);

  // ========== 第二步：批量获取所有 position 数据 ==========
  const positionCalls = useMemo(() => {
    return tokenIds.map((tokenId) => ({
      address: POSITION_MANAGER_ADDRESS as `0x${string}`,
      abi: abi,
      functionName: 'positions',
      args: [tokenId],
    }));
  }, [tokenIds]);

  const { data: positionsData, isLoading: positionsLoading } = useReadContracts({
    contracts: positionCalls,
    query: { enabled: tokenIds.length > 0 },
  });

  // ========== 第三步：收集所有唯一的 pool 地址并批量获取 slot0 ==========
  const poolAddresses = useMemo(() => {
    if (!positionsData) return [];

    const addresses = new Set<string>();
    for (const position of positionsData) {
      if (position.status === 'success' && position.result) {
        const [, , token0, token1, fee] = position.result;
        const poolAddress = computePoolAddress(token0, token1, fee);
        addresses.add(poolAddress);
      }
    }
    return Array.from(addresses);
  }, [positionsData]);

  const poolCalls = useMemo(() => {
    return poolAddresses.map((poolAddress) => ({
      address: poolAddress as `0x${string}`,
      abi: poolAbi,
      functionName: 'slot0',
    }));
  }, [poolAddresses]);

  const { data: slot0Data, isLoading: slot0Loading } = useReadContracts({
    contracts: poolCalls,
    query: { enabled: poolAddresses.length > 0 },
  });

  // ========== 第四步：构建 pool 地址到 slot0 的映射 ==========
  const poolSlot0Map = useMemo(() => {
    if (!slot0Data) return new Map();
    const map = new Map();
    for (let i = 0; i < poolAddresses.length; i++) {
      const slot0 = slot0Data[i];
      if (slot0.status === 'success' && slot0.result) {
        map.set(poolAddresses[i], slot0.result);
      }
    }
    return map;
  }, [slot0Data, poolAddresses]);

  // ========== 第五步：计算每个 position 的 token0/token1 数量 ==========
  const positionsWithDetails = useMemo((): PositionWithDetails[] => {
    if (!positionsData || !poolSlot0Map.size || !chainId) return [];

    const results: PositionWithDetails[] = [];

    for (let i = 0; i < positionsData.length; i++) {
      const position = positionsData[i];
      if (position.status !== 'success' || !position.result) continue;

      const [liquidity, , token0, token1, fee, tickLower, tickUpper] = position.result;

      const poolAddress = computePoolAddress(token0, token1, fee);
      const slot0 = poolSlot0Map.get(poolAddress);
      if (!slot0) continue;

      const { sqrtPriceX96, tick: currentTick } = slot0;

      try {
        const token0Decimals = getTokenDecimals(token0);
        const token1Decimals = getTokenDecimals(token1);

        const token0Instance = new Token(chainId, token0 + "", token0Decimals);
        const token1Instance = new Token(chainId, token1 + "", token1Decimals);

        const pool = new Pool(
          token0Instance,
          token1Instance,
          Number(fee),
          sqrtPriceX96.toString(),
          liquidity.toString(),
          currentTick
        );

        const positionInstance = new Position({
          pool,
          liquidity: liquidity.toString(),
          tickLower: Number(tickLower),
          tickUpper: Number(tickUpper),
        });

        results.push({
          tokenId: tokenIds[i].toString(),
          token0Symbol: getTokenSymbol(token0),
          token1Symbol: getTokenSymbol(token1),
          token0Address: token0 + "",
          token1Address: token1 + "",
          amount0: positionInstance.amount0.toSignificant(6),
          amount1: positionInstance.amount1.toSignificant(6),
          fee: Number(fee),
          feePercent: `${Number(fee) / 10000}%`,
          tickLower: Number(tickLower),
          tickUpper: Number(tickUpper),
          liquidity: liquidity.toString(),
          poolAddress,
        });
      } catch (error) {
        console.error(`计算 position ${tokenIds[i]} 失败:`, error);
      }
    }

    return results;
  }, [positionsData, poolSlot0Map, tokenIds, chainId]);
  console.log(positionsWithDetails)
  // 转换为表格行数据
  const tableRows = useMemo(() => {
    return positionsWithDetails.map((position, idx) => ({
      id: idx,
      tokenPair: `${position.token0Symbol}/${position.token1Symbol}`,
      amounts: `${position.amount0} ${position.token0Symbol} / ${position.amount1} ${position.token1Symbol}`,
      feeTier: position.feePercent,
      priceRange: `${position.tickLower} ~ ${position.tickUpper}`,
      liquidity: position.liquidity,
      originalData: position,
    }));
  }, [positionsWithDetails]);

  // 分页计算
  const totalPages = Math.ceil(tableRows.length / ROWS_PER_PAGE);
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return tableRows.slice(start, start + ROWS_PER_PAGE);
  }, [tableRows, page]);
  console.log(paginatedItems)

  const start = (page - 1) * ROWS_PER_PAGE + 1;
  const end = Math.min(page * ROWS_PER_PAGE, tableRows.length);

  const isLoading = balanceLoading || tokenIdsLoading || positionsLoading || slot0Loading;

  // 重置页码
  useEffect(() => {
    setPage(1);
  }, [positionsWithDetails.length]);

  const handleSuccess = () => {
    // 刷新列表
    console.log("---")
  };

  const toggleModal = () => setIsOpen(!isOpen);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading positions...</p>
      </div>
    );
  }

  if (positionsWithDetails.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 gap-4">
        <p className="text-gray-500">No liquidity positions found</p>
        <Button onPress={toggleModal}>Add Your First Position</Button>
        <AddLiquidityModal
          isOpen={isOpen}
          onOpenChange={toggleModal}
          onSuccess={handleSuccess}
        />
      </div>
    );
  }

  return (
    <div>
      <Button className="mb-5" onPress={toggleModal}>Add Positions</Button>

      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="Liquidity positions table" className="min-w-150">
            <Table.Header columns={columns}>
              {(column) => (
                <Table.Column isRowHeader={column.id === "tokenPair"}>
                  {column.name}
                </Table.Column>
              )}
            </Table.Header>
            <Table.Body items={paginatedItems}>
              {(item: any) => (
                <Table.Row key={item.id}>
                  {columns.map((column) => (
                    <Table.Cell key={column.id}>
                      {item[column.id as keyof typeof item]}
                    </Table.Cell>
                  ))}
                </Table.Row>
              )}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>

        {tableRows.length > 0 && (
          <Table.Footer>
            <Pagination>
              <Pagination.Summary>
                {start} to {end} of {tableRows.length} results
              </Pagination.Summary>
              <Pagination.Content>
                <Pagination.Item>
                  <Pagination.Previous
                    isDisabled={page === 1}
                    onPress={() => setPage(p => p - 1)}
                  >
                    <Pagination.PreviousIcon />
                    <span>Previous</span>
                  </Pagination.Previous>
                </Pagination.Item>

                {(() => {
                  const pages = [];
                  const total = totalPages;
                  if (total <= 7) {
                    for (let i = 1; i <= total; i++) pages.push(i);
                  } else {
                    pages.push(1);
                    if (page > 3) pages.push("ellipsis");
                    const startPage = Math.max(2, page - 1);
                    const endPage = Math.min(total - 1, page + 1);
                    for (let i = startPage; i <= endPage; i++) pages.push(i);
                    if (page < total - 2) pages.push("ellipsis");
                    pages.push(total);
                  }
                  return pages.map((p, i) => (
                    <Pagination.Item key={i}>
                      {p === "ellipsis" ? (
                        <Pagination.Ellipsis />
                      ) : (
                        <Pagination.Link
                          isActive={p === page}
                          onPress={() => setPage(p as number)}
                        >
                          {p}
                        </Pagination.Link>
                      )}
                    </Pagination.Item>
                  ));
                })()}

                <Pagination.Item>
                  <Pagination.Next
                    isDisabled={page === totalPages}
                    onPress={() => setPage(p => p + 1)}
                  >
                    <span>Next</span>
                    <Pagination.NextIcon />
                  </Pagination.Next>
                </Pagination.Item>
              </Pagination.Content>
            </Pagination>
          </Table.Footer>
        )}
      </Table>

      <AddLiquidityModal
        isOpen={isOpen}
        onOpenChange={toggleModal}
        onSuccess={handleSuccess}
      />
    </div>
  );
}