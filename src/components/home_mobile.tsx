import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'

import { useMutation } from '@tanstack/react-query'
import { Link, Outlet, useNavigate } from '@tanstack/react-router'
import {
  BarChart2Icon,
  BellIcon,
  CalendarIcon,
  CoffeeIcon,
  DollarSignIcon,
  DonutIcon,
  HandCoinsIcon,
  HelpCircleIcon,
  HistoryIcon,
  MenuIcon,
  PackageOpenIcon,
  UserIcon,
  UsersIcon,
  UtensilsIcon,
  WifiIcon,
  WifiOffIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Button } from './ui/button'
import { ExpandableTabs, type TabItem } from './ui/expandable-tabs'
import { Separator } from './ui/separator'
import { ModeToggle } from './ui/themeToggle'
import fallbackAvatar from '@/assets/fallbackAvatar.png'
import { useFirebaseAuth } from '@/lib/useFirebaseAuth'
import SplashScreen from './splashscreen'
import { messaging } from '@/firebase/firebase'
import { getToken } from 'firebase/messaging'
import { saveUserFcmToken } from '@/firebase/firestore'

const tabs: TabItem[] = [
  {
    title: 'Order',
    icon: UtensilsIcon,
    to: '/home/editMenu?category="appetizers"',
  },
  {
    title: 'Notifications',
    icon: BellIcon,
    to: '/home/notifications/orderNotification',
  },
  {
    title: 'Stocks',
    icon: PackageOpenIcon,
    to: '/home/stock?category="Kitchen"',
  },
  { type: 'separator' },
  {
    title: 'History',
    icon: HistoryIcon,
    to: '/home/billing',
  },
  {
    title: 'Dashboard',
    icon: DollarSignIcon,
    to: '/home/dashboard?tab=overview',
  },
  { title: 'Calendar', icon: CalendarIcon, to: '/home/calendar' },
]

export function Home() {
  const { loading: isLoading } = useFirebaseAuth()
  const { userAdditional } = useFirebaseAuth()

  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    function updateOnlineStatus() {
      if (!navigator.onLine) {
        setWasOffline(true)
        toast('No internet connection', {
          icon: <WifiOffIcon />,
        })
      } else if (wasOffline) {
        setWasOffline(false)
        toast('You are back online!', {
          icon: <WifiIcon />,
        })
      }
    }

    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    // Cleanup
    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [wasOffline])

  useEffect(() => {
    if (
      typeof Notification !== 'undefined' &&
      Notification.permission === 'default'
    ) {
      Notification.requestPermission()
    }
  }, [])

  useEffect(() => {
    async function fetchAndSaveFcmToken() {
      if (
        typeof Notification !== 'undefined' &&
        Notification.permission === 'granted' &&
        messaging
      ) {
        try {
          const token = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
          })
          if (token) {
            await saveUserFcmToken(token)
          }
        } catch (err) {
          console.error('Failed to get or save FCM token:', err)
        }
      }
    }
    fetchAndSaveFcmToken()
  }, [])

  if (isLoading) {
    return <SplashScreen />
  }

  return (
    <div
      data-vaul-drawer-wrapper=""
      className="flex flex-col justify-between bg-white dark:bg-background h-[100dvh] overflow-x-clip overflow-y-clip"
    >
      <div className="flex justify-between items-center bg-background shadow-md dark:shadow-2xl p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <AvatarDrawer />
        </div>
        <HamburgerDrawer />
      </div>
      <div className="relative flex-grow overflow-x-hidden overflow-y-auto [view-transition-name:main-content] no-scrollbar">
        <Outlet />
      </div>
      <ExpandableTabs
        tabs={tabs.filter(
          (tab) =>
            tab.title !== 'Dashboard' ||
            userAdditional?.role === 'admin' ||
            userAdditional?.role === 'owner',
        )}
        className="min-w-fit"
      />{' '}
    </div>
  )
}

function AvatarDrawer() {
  const navigate = useNavigate({ from: '/home' })
  const [open, setOpen] = useState(false)
  const { user, userAdditional, logout } = useFirebaseAuth()
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      navigate({ to: '/' })
      toast('Logged out successfully!')
    },
  })

  return (
    <Drawer direction="left" open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-4 bg-background hover:bg-muted shadow-sm px-2 py-2 border border-border rounded-xl w-full text-left transition"
        >
          <Avatar className="ring-2 ring-muted w-11 h-11">
            <AvatarImage
              src={
                userAdditional?.profilePicture ||
                userAdditional?.photoURL ||
                fallbackAvatar
              }
              alt="User Avatar"
            />
            <AvatarFallback className="font-medium text-base">
              {userAdditional?.firstName?.charAt(0).toUpperCase() || 'U'}
              {userAdditional?.lastName?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col justify-center">
            <span className="text-muted-foreground text-xs tracking-wide">
              Welcome back,
            </span>
            <span className="font-semibold text-foreground text-sm leading-tight">
              {userAdditional?.firstName || user?.displayName || 'User'}!
            </span>
          </div>
        </button>
      </DrawerTrigger>
      <DrawerContent className="flex flex-col justify-between h-full">
        <DrawerHeader>
          <DrawerTitle>Settings</DrawerTitle>
          <DrawerDescription className="text-xs text-nowrap">
            Manage your profile and account settings here.
          </DrawerDescription>
        </DrawerHeader>
        <Separator />
        <div className="flex flex-col flex-grow justify-center items-start space-y-2">
          <Link
            to="/home/settings"
            onClick={() => setOpen(false)}
            className="flex items-center space-x-3 p-3 rounded-md text-muted-foreground hover:text-foreground text-sm"
          >
            <UserIcon className="w-5 h-5" />
            <span>Profile Settings</span>
          </Link>

          <Link
            to="/home/employee/$salaryLedger"
            params={{ salaryLedger: userAdditional?.uid || '' }}
            onClick={() => setOpen(false)}
            className="flex items-center space-x-3 p-3 rounded-md text-muted-foreground hover:text-foreground text-sm"
          >
            <DollarSignIcon className="w-5 h-5" />
            <span>Salary</span>
          </Link>

          <Link
            to="/home/help"
            onClick={() => setOpen(false)}
            className="flex items-center space-x-3 p-3 rounded-md text-muted-foreground hover:text-foreground text-sm"
          >
            <HelpCircleIcon className="w-5 h-5" />
            <span>Help</span>
          </Link>
        </div>
        <Separator />
        <DrawerFooter>
          <div className="flex items-center space-x-3 rounded-md text-muted-foreground hover:text-foreground text-sm cursor-pointer">
            <ModeToggle />
            <span>Toggle Light/Dark Mode</span>
          </div>
          <DrawerClose asChild>
            <Button onClick={() => logoutMutation.mutate()}>Logout</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function HamburgerDrawer() {
  const { userAdditional } = useFirebaseAuth()
  const [open, setOpen] = useState(false)
  return (
    <Drawer direction="right" open={open} onOpenChange={setOpen}>
      <DrawerTrigger>
        <MenuIcon />
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Business Management</DrawerTitle>
          <DrawerDescription className="text-xs text-nowrap">
            Manage business and ledgers.
          </DrawerDescription>
        </DrawerHeader>
        <Separator />
        <div className="flex flex-col flex-grow justify-center items-start space-y-2">
          {(userAdditional?.role === 'admin' ||
            userAdditional?.role === 'owner') && (
            <Link
              to="/home/employee/table"
              onClick={() => setOpen(false)}
              className="flex items-center space-x-3 p-3 rounded-md text-muted-foreground hover:text-foreground text-sm"
            >
              <UsersIcon className="w-5 h-5" />
              <span>Employee Management</span>
            </Link>
          )}

          {(userAdditional?.role === 'admin' ||
            userAdditional?.role === 'owner') && (
            <Link
              to="/home/dashboard"
              search={{ tab: 'analytics' }}
              onClick={() => setOpen(false)}
              className="flex items-center space-x-3 p-3 rounded-md text-muted-foreground hover:text-foreground text-sm"
            >
              <BarChart2Icon className="w-5 h-5" />
              <span>Analytics</span>
            </Link>
          )}

          <Link
            to="/home/creditors"
            onClick={() => setOpen(false)}
            className="flex items-center space-x-3 p-3 rounded-md text-muted-foreground hover:text-foreground text-sm"
          >
            <HandCoinsIcon className="w-5 h-5" />
            <span>Creditors</span>
          </Link>

          <Link
            to="/home/kitchenLedger"
            onClick={() => setOpen(false)}
            className="flex items-center space-x-3 p-3 rounded-md text-muted-foreground hover:text-foreground text-sm"
          >
            <UtensilsIcon className="w-5 h-5" />
            <span>Kitchen Ledger</span>
          </Link>
          <Link
            to="/home/bakeryLedger"
            onClick={() => setOpen(false)}
            className="flex items-center space-x-3 p-3 rounded-md text-muted-foreground hover:text-foreground text-sm"
          >
            <DonutIcon className="w-5 h-5" />
            <span>Bakery Ledger</span>
          </Link>
          {userAdditional?.role === 'admin' ||
            (userAdditional?.role === 'owner' && (
              <Link
                to="/home/baristaLedger"
                onClick={() => setOpen(false)}
                className="flex items-center space-x-3 p-3 rounded-md text-muted-foreground hover:text-foreground text-sm"
              >
                <CoffeeIcon className="w-5 h-5" />
                <span>Barista Ledger</span>
              </Link>
            ))}
        </div>
        <Separator />
        <DrawerFooter>
          <DrawerClose asChild>
            <Button>Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
