"use client";

import { Pagination, Table, Button, Modal, Card, Input, ListBox, Select } from "@heroui/react";
import { useEffect, useMemo, useState } from "react";

import { useReadContract } from "wagmi";
import { positionAbi as abi } from "../abi"

import AddPosition, { PositionData } from '@/app/components/addPosition'

const columns = [
  { id: "Token", name: "Token" },
  { id: "Fee tier", name: "Fee tier" },
  { id: "Set price range", name: "Set price range" },
  { id: "Current price", name: "Current price" },
  { id: "Liquidity", name: "Liquidity" },
];

const ROWS_PER_PAGE = 15;

// 定义 Pool 数据的类型（根据你的合约实际返回值调整）
interface Pool {
  token0: string;
  token1: string;
  fee: bigint | number;
  tickLower: number;
  tickUpper: number;
  liquidity: bigint;
  tick: number
  // 根据实际返回值补充其他字段
}

// 将合约返回的 pool 数据转换为表格行数据
function transformPoolToRow(pool: Pool, index: number) {
  // 这里的转换逻辑需要根据你的合约 `getAllPools` 实际返回的字段调整
  return {
    id: index,
    Token: `${pool.token0 || "Unknown"}/${pool.token1 || "Unknown"}`,
    "Fee tier": pool.fee ? `${Number(pool.fee) / 10000}%` : "-",
    "Set price range": `${pool.tickLower || "-"} ~ ${pool.tickUpper || "-"}`,
    "Current price": `${pool.tick ?? ""}`, // 可能需要另外调用函数获取当前价格
    "Liquidity": pool.liquidity ? pool.liquidity.toString() : "0",
  };
}

export default function Home() {
  const [page, setPage] = useState(1);
  const [isOpen, setIsOpen] = useState(false);

  // 从合约获取 pools 列表
  const {
    data: poolsData,
    isLoading,
    isError,
    refetch
  } = useReadContract({
    address: "0xbe766Bf20eFfe431829C5d5a2744865974A0B610",
    abi: abi,
    functionName: 'getAllPositions',
    args: [],
  });

  // 将合约数据转换为表格数据
  const pools = useMemo(() => {
    if (!poolsData || !Array.isArray(poolsData)) {
      return [];
    }
    // 假设 poolsData 是 Pool 类型的数组
    return poolsData.map((pool: Pool, index: number) => transformPoolToRow(pool, index));
  }, [poolsData]);

  // 计算分页相关
  const totalPages = Math.ceil(pools.length / ROWS_PER_PAGE);
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return pools.slice(start, start + ROWS_PER_PAGE);
  }, [pools, page]);

  const start = (page - 1) * ROWS_PER_PAGE + 1;
  const end = Math.min(page * ROWS_PER_PAGE, pools.length);

  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (page > 3) {
        pages.push("ellipsis");
      }
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (page < totalPages - 2) {
        pages.push("ellipsis");
      }
      pages.push(totalPages);
    }
    return pages;
  };

  const [formData, setFormData] = useState<PositionData | null>(null);

  // 接收子组件传来的数据
  const handleDataUpdate = (data: PositionData) => {
    setFormData(data);
  };

  const toggleModal = () => {
    setIsOpen(!isOpen)
  }

  // 当数据变化时重置页码到第一页
  useEffect(() => {
    setPage(1);
  }, [poolsData]);

  // 加载状态展示
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading pools...</p>
      </div>
    );
  }

  // 错误状态展示
  if (isError) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-red-500">Failed to load pools. Please try again.</p>
        <Button onPress={() => refetch()} className="ml-4">Retry</Button>
      </div>
    );
  }

  function ShowModal() {
    const sumit = () => {
      console.log("----")
    }
    return (
      <Modal.Backdrop isOpen={isOpen} onOpenChange={setIsOpen}>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-150">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Add Positions</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <div>
                <div className="require">Deposit amounts</div>
                <Card className="w-full" variant="transparent">
                  <Card.Content>
                    <div className="flex justify-between">
                      <Input aria-label="Name" className="w-3/5" placeholder="Enter your name" />
                      <Select className="w-1/4" placeholder="Select one">
                        <Select.Trigger>
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover>
                          <ListBox>
                            <ListBox.Item id="florida" textValue="Florida">
                              Florida
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                            <ListBox.Item id="delaware" textValue="Delaware">
                              Delaware
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                            <ListBox.Item id="california" textValue="California">
                              California
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                            <ListBox.Item id="texas" textValue="Texas">
                              Texas
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                            <ListBox.Item id="new-york" textValue="New York">
                              New York
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                            <ListBox.Item id="washington" textValue="Washington">
                              Washington
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                          </ListBox>
                        </Select.Popover>
                      </Select>
                    </div>
                    <div className="flex justify-between">
                      <div className="w-1/2">111</div>
                      <div className="w-1/2">222</div>
                    </div>
                  </Card.Content>
                </Card>
                <Card className="w-full" variant="transparent">
                  <Card.Content>
                    <div className="flex justify-between">
                      <Input aria-label="Name" className="w-3/5" placeholder="Enter your name" />
                      <Select className="w-1/4" placeholder="Select one">
                        <Select.Trigger>
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover>
                          <ListBox>
                            <ListBox.Item id="florida" textValue="Florida">
                              Florida
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                            <ListBox.Item id="delaware" textValue="Delaware">
                              Delaware
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                            <ListBox.Item id="california" textValue="California">
                              California
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                            <ListBox.Item id="texas" textValue="Texas">
                              Texas
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                            <ListBox.Item id="new-york" textValue="New York">
                              New York
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                            <ListBox.Item id="washington" textValue="Washington">
                              Washington
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                          </ListBox>
                        </Select.Popover>
                      </Select>
                    </div>
                    <div className="flex justify-between">
                      <div className="w-1/2">111</div>
                      <div className="w-1/2">222</div>
                    </div>
                  </Card.Content>
                </Card>
              </div>
              <div>
                <div>Fee tier</div>
              </div>
              <div>
                <div>Set price range</div>
              </div>
              <div>
                <div>Current price</div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button className="w-full" slot="close" onPress={() => { setIsOpen(!isOpen) }}>
                取消
              </Button>
              <Button className="w-full" slot="close" onClick={sumit}>
                创建
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop >
    )
  }

  return (
    <div>
      <Button className="mb-5" onPress={toggleModal}>
        Add Positions
      </Button>
      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="Table with pagination" className="min-w-150">
            <Table.Header columns={columns}>
              {(column) => (
                <Table.Column isRowHeader={column.id === "Token"}>{column.name}</Table.Column>
              )}
            </Table.Header>
            <Table.Body items={paginatedItems}>
              {(item) => (
                <Table.Row key={item.id}>
                  <Table.Collection items={columns}>
                    {(column) => <Table.Cell>{item[column.id as keyof typeof item]}</Table.Cell>}
                  </Table.Collection>
                </Table.Row>
              )}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
        <Table.Footer>

          <Pagination>
            <Pagination.Summary>
              {pools.length > 0 ? `${start} to ${end} of ${pools.length} results` : "No results"}
            </Pagination.Summary>
            <Pagination.Content>
              <Pagination.Item>
                <Pagination.Previous isDisabled={page === 1} onPress={() => setPage((p) => p - 1)}>
                  <Pagination.PreviousIcon />
                  <span>Previous</span>
                </Pagination.Previous>
              </Pagination.Item>
              {getPageNumbers().map((p, i) =>
                p === "ellipsis" ? (
                  <Pagination.Item key={`ellipsis-${i}`}>
                    <Pagination.Ellipsis />
                  </Pagination.Item>
                ) : (
                  <Pagination.Item key={p}>
                    <Pagination.Link isActive={p === page} onPress={() => setPage(p)}>
                      {p}
                    </Pagination.Link>
                  </Pagination.Item>
                ),
              )}
              <Pagination.Item>
                <Pagination.Next isDisabled={page === totalPages} onPress={() => setPage((p) => p + 1)}>
                  <span>Next</span>
                  <Pagination.NextIcon />
                </Pagination.Next>
              </Pagination.Item>
            </Pagination.Content>
          </Pagination>
        </Table.Footer>
      </Table>
      <ShowModal />
    </div>
  );
}