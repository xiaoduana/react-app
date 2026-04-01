import { 
  HomeIcon
} from '@heroicons/react/24/outline'

export interface MenuItem {
  title: string
  path: string
  icon?: any
  type?: 'link' | 'sub'
  children?: MenuItem[]
}

export const menuItems: MenuItem[] = [
  {
    title: 'wagmi',
    path: '/wagmi',
    icon: HomeIcon,
    type: 'link'
  },
  {
    title: 'ethers',
    path: '/ethers',
    icon: HomeIcon,
    type: 'link'
  },
  {
    title: 'viem',
    path: '/viem',
    icon: HomeIcon,
    type: 'link'
  }
]