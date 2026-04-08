import { 
  BookmarkIcon,
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
    icon: BookmarkIcon,
    type: 'link'
  },
  {
    title: 'ethers',
    path: '/ethers',
    icon: BookmarkIcon,
    type: 'link'
  },
  {
    title: 'viem',
    path: '/viem',
    icon: BookmarkIcon,
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
      icon: BookmarkIcon,
      type: 'link'
    },{
      title: 'withdraw',
      path: '/pledgeContract/withdraw',
      icon: BookmarkIcon,
      type: 'link'
    },{
      title: 'claim',
      path: '/pledgeContract/claim',
      icon: BookmarkIcon,
      type: 'link'
    }]
  },
]