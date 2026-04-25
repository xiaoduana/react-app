"use client";

import { Pagination, Table, Button } from "@heroui/react";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useReadContracts, useReadContract } from 'wagmi';
// import { Pool, Position } from '@uniswap/v3-sdk';
// import { Token } from '@uniswap/sdk-core';
import { positionAbi as abi, poolAbi } from "../abi";
// import { useAppStore } from '@/app/store/index';
// import { useChainId } from 'wagmi';
import { getTokenInfo } from '@/utils/base'

import { AddLiquidityModal } from "./AddLiquidityModal";


const POSITION_MANAGER_ADDRESS = '0xbe766Bf20eFfe431829C5d5a2744865974A0B610';


// 获取 token decimals
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

const columns = [
  { id: "id", name: "Token ID" },
  { id: "Token", name: "Token" },
  { id: "Fee tier", name: "Fee tier" },
  { id: "Set price range", name: "Set price range" },
  { id: "Current price", name: "Current price" },
  { id: "Liquidity", name: "Liquidity" },
];

const ROWS_PER_PAGE = 15;

// 定义 Pool 数据的类型（根据你的合约实际返回值调整）
interface Pool {
  id: bigint;
  token0: string;
  token1: string;
  fee: bigint | number;
  tickLower: number;
  tickUpper: number;
  liquidity: bigint;
  tick: number,
  index: any
  // 根据实际返回值补充其他字段
}

function getSymbol(str: any, map: any) {
  const obj = map.get(str)
  return obj ? `${obj.symbol} (${obj.balanceOf})` : str
}

// 将合约返回的 pool 数据转换为表格行数据
function transformPoolToRow(pool: Pool, map: any, poolInfo: any) {
  // 这里的转换逻辑需要根据你的合约 `getAllPools` 实际返回的字段调整
  return {
    id: `${pool.id}`,
    Token: `${getSymbol(pool.token0, map) || "Unknown"} / ${getSymbol(pool.token1, map) || "Unknown"}`,
    "Fee tier": pool.fee ? `${Number(pool.fee) / 10000}%` : "-",
    "Set price range": `${pool.tickLower || "-"} ~ ${pool.tickUpper || "-"}`,
    "Current price": `${poolInfo.get(pool.token0 + pool.token1 + pool.index) ?? ""}`, // 可能需要另外调用函数获取当前价格
    "Liquidity": pool.liquidity ? pool.liquidity.toString() : "0",
  };
}

export default function Home() {
  const [page, setPage] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  // 从合约获取 pools 列表
  const {
    data: poolsData,
  } = useReadContract({
    address: "0xddC12b3F9F7C91C79DA7433D8d212FB78d609f7B",
    abi: poolAbi,
    functionName: 'getAllPools',
  });
  const poolInfo = useMemo(() => {
    const info = new Map()
    if (!poolsData) return info
    for (let index = 0; index < poolsData.length; index++) {
      info.set(poolsData[index].token0 + poolsData[index].token1 + poolsData[index].index, poolsData[index].tick);
    }
    return info;
  }, [poolsData])

  const {
    data: positionssData,
    isLoading,
    isError,
    refetch
  } = useReadContract({
    address: POSITION_MANAGER_ADDRESS,
    abi: abi,
    functionName: 'getAllPositions',
  });
  const tokenInfos = getTokenInfo(positionssData)
  // 将合约数据转换为表格数据
  const tableRows = useMemo(() => {
    if (!positionssData || !Array.isArray(positionssData)) {
      return [];
    }
    return positionssData.map((pool: Pool, index: number) => transformPoolToRow(pool, tokenInfos, poolInfo));
  }, [positionssData, tokenInfos, poolInfo]);

  // 分页计算
  const totalPages = Math.ceil(tableRows.length / ROWS_PER_PAGE);
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return tableRows.slice(start, start + ROWS_PER_PAGE);
  }, [tableRows, page]);


  const start = (page - 1) * ROWS_PER_PAGE + 1;
  const end = Math.min(page * ROWS_PER_PAGE, tableRows.length);


  // 重置页码
  // useEffect(() => {
  //   setPage(1);
  // }, [tableRows.length]);

  const handleSuccess = useCallback(() => {
    console.log("---");
    // 异步刷新，避免同步触发
    setTimeout(() => {
      refetch();
    }, 0);
  }, [refetch]);

  const toggleModal = () => setIsOpen(!isOpen);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading positions...</p>
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
                <Table.Column isRowHeader={column.id === "Token"}>
                  {column.name}
                </Table.Column>
              )}
            </Table.Header>
            <Table.Body items={paginatedItems}>
              {(item: any) => (
                <Table.Row key={item.id}>
                  {columns.map((column) => (
                    <Table.Cell key={column.id}>
                      {item[column.id]}
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