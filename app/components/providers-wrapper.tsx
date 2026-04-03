import { Providers } from '@/app/components/providers'

export default function ProvidersWrapper({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>
}