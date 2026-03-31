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
    title: '2026/3/31',
    path: '/day1',
    icon: HomeIcon,
    type: 'link'
  }
]