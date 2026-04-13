'use client'
import { PowerIcon } from "@heroicons/react/24/outline";
import { Label, ListBox, Select, Button } from "@heroui/react";
export function HeadBar() {
  return (
    <div className="flex justify-end items-center h-20 bg-blue-400 shadow">
      <Select className="w-[256px] mr-5" placeholder="Select one">
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
          </ListBox>
        </Select.Popover>
      </Select>
      <Button className="mr-10" onPress={() => console.log("Button pressed")}>连接钱包<PowerIcon className="w-5 h-5" /></Button>
    </div >
  );
}