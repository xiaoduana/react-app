import {
  Bars3BottomLeftIcon,
  BookmarkIcon
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
    icon: Bars3BottomLeftIcon,
    type: 'link'
  },
  {
    title: 'ethers',
    path: '/ethers',
    icon: Bars3BottomLeftIcon,
    type: 'link'
  },
  {
    title: 'viem',
    path: '/viem',
    icon: Bars3BottomLeftIcon,
    type: 'link'
  },
  {
    title: 'pledgeContract',
    path: '/pledgeContract',
    icon: BookmarkIcon,
    type: 'sub',
    children: [{
      title: 'stake',
      path: '/pledgeContract/stake',
      icon: Bars3BottomLeftIcon,
      type: 'link'
    }, {
      title: 'withdraw',
      path: '/pledgeContract/withdraw',
      icon: Bars3BottomLeftIcon,
      type: 'link'
    }, {
      title: 'claim',
      path: '/pledgeContract/claim',
      icon: Bars3BottomLeftIcon,
      type: 'link'
    }]
  },
  {
    title: 'SwapV3',
    path: '/SwapV3',
    icon: BookmarkIcon,
    type: 'sub',
    children: [{
      title: 'pool',
      path: '/swapV3/pool',
      icon: Bars3BottomLeftIcon,
      type: 'link'
    }, {
      title: 'swap',
      path: '/swapV3/swap',
      icon: Bars3BottomLeftIcon,
      type: 'link'
    }]
  },
]