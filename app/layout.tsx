'use client'

import { useState } from 'react'
import Sidebar from '@/app/components/Sidebar'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <html lang="zh-CN">
      <body>
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
          <Sidebar 
            isCollapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
          <main className={`
            flex-1 transition-all duration-300
            ${sidebarCollapsed ? 'ml-0' : 'ml-0'}
          `}>
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  )
}