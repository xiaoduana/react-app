'use client'

import './globals.css'

import ProvidersWrapper from '@/app/components/providers-wrapper'
import ClientLayout from '@/app/components/client-layout'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <html lang="zh-CN">
      <body>
        <ProvidersWrapper>
          <ClientLayout>{children}</ClientLayout>
        </ProvidersWrapper>
      </body>
    </html>
  )
}