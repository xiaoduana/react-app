'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { menuItems, MenuItem } from '@/app/config/menu'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'

interface SidebarProps {
  isCollapsed?: boolean
  onToggle?: () => void
}

export default function Sidebar({ isCollapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])

  const toggleSubMenu = (title: string) => {
    setExpandedMenus(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    )
  }

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`)
  }

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const isExpanded = expandedMenus.includes(item.title)
    const hasChildren = item.children && item.children.length > 0
    const active = item.type === 'link' && isActive(item.path)

    if (item.type === 'sub' && hasChildren) {
      return (
        <div key={item.title} className="mb-1">
          <button
            onClick={() => !isCollapsed && toggleSubMenu(item.title)}
            className={`
              w-full flex items-center justify-between px-4 py-2.5 rounded-lg
              transition-all duration-200
              hover:bg-gray-100 dark:hover:bg-gray-800
              ${active ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}
              ${isCollapsed ? 'justify-center px-2' : ''}
            `}
            title={isCollapsed ? item.title : undefined}
          >
            <div className="flex items-center gap-3">
              {item.icon && (
                <item.icon className="w-5 h-5 flex-shrink-0" />
              )}
              {!isCollapsed && <span className="text-sm">{item.title}</span>}
            </div>
            {!isCollapsed && hasChildren && (
              <ChevronRightIcon
                className={`
                  w-4 h-4 transition-transform duration-200
                  ${isExpanded ? 'rotate-90' : ''}
                `}
              />
            )}
          </button>

          {!isCollapsed && isExpanded && (
            <div className="ml-4 mt-1 pl-2 border-l-2 border-gray-200 dark:border-gray-700">
              {item.children?.map((child: any) => renderMenuItem(child, level + 1))}
            </div>
          )}
        </div>
      )
    }

    return (
      <Link
        key={item.path}
        href={item.path}
        className={`
          flex items-center gap-3 px-4 py-2.5 rounded-lg
          transition-all duration-200
          hover:bg-gray-100 dark:hover:bg-gray-800
          ${active ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}
          ${isCollapsed ? 'justify-center px-2' : ''}
        `}
        title={isCollapsed ? item.title : undefined}
      >
        {item.icon && (
          <item.icon className="w-5 h-5 flex-shrink-0" />
        )}
        {!isCollapsed && <span className="text-sm">{item.title}</span>}
      </Link>
    )
  }

  return (
    <aside className={`
      bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
      transition-all duration-300 ease-in-out
      flex flex-col h-screen sticky top-0
      ${isCollapsed ? 'w-20' : 'w-64'}
    `}>
      {/* Logo 区域 */}
      <div className={`
        h-16 flex items-center border-b border-gray-200 dark:border-gray-800
        ${isCollapsed ? 'justify-center' : 'px-4'}
      `}>
        {!isCollapsed ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">Study Diary</span>
          </div>
        ) : (
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">S</span>
          </div>
        )}
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {menuItems.map((item: any) => renderMenuItem(item))}
      </nav>

      {/* 底部折叠按钮 */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={onToggle}
          className={`
            w-full flex items-center gap-3 px-4 py-2.5 rounded-lg
            transition-all duration-200
            hover:bg-gray-100 dark:hover:bg-gray-800
            text-gray-700 dark:text-gray-300
            ${isCollapsed ? 'justify-center px-2' : ''}
          `}
        >
          {isCollapsed ? (
            <ChevronRightIcon className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeftIcon className="w-5 h-5" />
              <span className="text-sm">收起菜单</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}