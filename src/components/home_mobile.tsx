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
import { motion } from 'motion/react'
import { Link, Outlet, useNavigate } from '@tanstack/react-router'
import {
  BoxIcon,
  MicrowaveIcon,
  BellIcon,
  CalendarIcon,
  CoffeeIcon,
  DollarSignIcon,
  HandCoinsIcon,
  HelpCircleIcon,
  HistoryIcon,
  MenuIcon,
  UserIcon,
  UsersIcon,
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
import { messaging } from '@/firebase/firebase'
import { getToken } from 'firebase/messaging'
import { logout } from '@/lib/auth'
import { usePocketbaseAuth } from '@/lib/usePocketbaseAuth'
import { pb } from '@/lib/pocketbase'

const tabs: TabItem[] = [
  {
    title: 'Take Order',
    icon: CoffeeIcon,
    to: '/home/takeOrder?category="appetizers"',
  },

  {
    title: 'Notifications',
    icon: BellIcon,
    to: '/home/notifications/orderNotification',
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
    to: '/home/dashboard',
  },
  { title: 'Calendar', icon: CalendarIcon, to: '/home/calendar' },
]

export function Home() {
  const { user } = usePocketbaseAuth()

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
    async function fetchAndSaveFcmToken() {
      if (
        typeof Notification === 'undefined' ||
        Notification.permission !== 'granted' ||
        !messaging
      )
        return

      try {
        const token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        })

        if (!token) return

        const userId = user.id
        if (!userId) return

        const uniqueKey = `${userId}_${token}`

        await pb.collection('fcm_tokens').create({
          userId,
          token,
          uniqueKey,
        })
      } catch (err) {
        console.log('Error fetching FCM token:', err)
      }
    }

    fetchAndSaveFcmToken()
  }, [])

  return (
    <>
      <NotificationPermissionDrawer />
      <div
        data-vaul-drawer-wrapper=""
        className="flex flex-col justify-between bg-white dark:bg-background h-[100dvh] overflow-x-clip overflow-y-clip"
      >
        <div className="flex justify-between items-center bg-background shadow-md dark:shadow-2xl p-4 border-border border-b">
          <div className="flex items-center gap-2">
            <AvatarDrawer />
          </div>
          <HamburgerDrawer />
        </div>
        <div
          className={
            'relative flex-grow overflow-x-hidden overflow-y-hidden [view-transition-name:main-content]  '
          }
        >
          <Outlet />
        </div>
        <ExpandableTabs
          tabs={tabs.filter(
            (tab) =>
              tab.title !== 'Dashboard' ||
              user.role === 'manager' ||
              user.role === 'owner',
          )}
          className="min-w-fit"
        />{' '}
      </div>
    </>
  )
}

function AvatarDrawer() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const { user, pb } = usePocketbaseAuth()
  const avatar = pb.files.getURL(user, user.avatar, { thumb: '100x100' })

  return (
    <Drawer direction="left" open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-4 bg-background hover:bg-muted shadow-sm px-2 py-2 border border-border rounded-xl w-full text-left transition"
        >
          <Avatar className="ring-2 ring-muted w-11 h-11">
            <AvatarImage src={avatar} alt="User Avatar" />
            <AvatarFallback className="font-medium text-base">
              {user.firstName?.charAt(0).toUpperCase() || 'U'}
              {user.lastName?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col justify-center">
            <span className="text-muted-foreground text-xs tracking-wide">
              Welcome back,
            </span>
            <span className="font-semibold text-foreground text-sm leading-tight">
              {user.username || user.firstName || 'User'}!
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
            params={{ salaryLedger: user.id || '' }}
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
          </div>
          <DrawerClose asChild>
            <Button
              onClick={() => {
                logout()
                navigate({ to: '/' })
                toast('Logged out successfully!')
              }}
            >
              Logout
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function HamburgerDrawer() {
  const { user } = usePocketbaseAuth()
  const [open, setOpen] = useState(false)
  const isAdmin = user.role === 'manager' || user.role === 'owner'

  return (
    <Drawer direction="right" open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="icon">
          <MenuIcon />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Business Management</DrawerTitle>
          <DrawerDescription className="text-xs text-nowrap">
            Manage business and ledgers.
          </DrawerDescription>
        </DrawerHeader>
        <Separator />
        <div className="flex flex-col flex-grow justify-center items-start space-y-2 p-4">
          {isAdmin && (
            <Link
              to="/home/employee/table"
              onClick={() => setOpen(false)}
              className="flex items-center space-x-3 p-3 rounded-md text-muted-foreground hover:text-foreground text-sm"
            >
              <UsersIcon className="w-5 h-5" />
              <span>Employee Management</span>
            </Link>
          )}

          {isAdmin && (
            <>
              <Link
                to="/home/inventoryManagement"
                search={{ category: 'appetizers' }}
                onClick={() => setOpen(false)}
                className="flex items-center space-x-3 p-3 rounded-md text-muted-foreground hover:text-foreground text-sm"
              >
                <BoxIcon className="w-5 h-5" />
                <span>Inventory Management</span>
              </Link>
              <Link
                to="/home/inventoryHistory"
                search={{ category: 'appetizers' }}
                onClick={() => setOpen(false)}
                className="flex items-center space-x-3 p-3 rounded-md text-muted-foreground hover:text-foreground text-sm"
              >
                <HistoryIcon className="w-5 h-5" />
                <span>Inventory History</span>
              </Link>
            </>
          )}

          {/* LEDGER GROUP WITH VERTICAL LINE */}
          <div className="space-y-1 w-full">
            <div className="flex items-center space-x-3 p-3 font-bold text-[10px] text-muted-foreground/50 uppercase tracking-widest">
              <HandCoinsIcon className="w-4 h-4" />
              <span>Ledgers</span>
            </div>

            <div className="relative space-y-1 ml-5 pl-2 border-zinc-200 dark:border-zinc-800 border-l">
              <Link
                to="/home/payLaterCustomers/payLaterCustomersAll"
                onClick={() => setOpen(false)}
                className="flex items-center space-x-3 p-2 rounded-md text-muted-foreground hover:text-foreground text-sm"
              >
                <span>Pay Later Customers</span>
              </Link>

              <Link
                to="/home/vendors/vendorsAll"
                onClick={() => setOpen(false)}
                className="flex items-center space-x-3 p-2 rounded-md text-muted-foreground hover:text-foreground text-sm"
              >
                <span>Vendors</span>
              </Link>

              <Link
                to="/home/expenseLedger/$department"
                params={{ department: 'kitchen' }}
                onClick={() => setOpen(false)}
                className="flex items-center space-x-3 p-2 rounded-md text-muted-foreground hover:text-foreground text-sm"
              >
                <span>Kitchen Ledger</span>
              </Link>
              <Link
                to="/home/expenseLedger/$department"
                params={{ department: 'bakery' }}
                onClick={() => setOpen(false)}
                className="flex items-center space-x-3 p-2 rounded-md text-muted-foreground hover:text-foreground text-sm"
              >
                <span>Bakery Ledger</span>
              </Link>
              <Link
                to="/home/expenseLedger/$department"
                params={{ department: 'utility' }}
                onClick={() => setOpen(false)}
                className="flex items-center space-x-3 p-2 rounded-md text-muted-foreground hover:text-foreground text-sm"
              >
                <span>Utility Ledger</span>
              </Link>

              <Link
                to="/home/expenseLedger/$department"
                params={{ department: 'barista' }}
                onClick={() => setOpen(false)}
                className="flex items-center space-x-3 p-2 rounded-md text-muted-foreground hover:text-foreground text-sm"
              >
                <span>Barista Ledger</span>
              </Link>
            </div>
          </div>

          <Link
            to="/home/assets/$department"
            params={{ department: 'permanentInventory' }}
            onClick={() => setOpen(false)}
            className="flex items-center space-x-3 p-3 rounded-md text-muted-foreground hover:text-foreground text-sm"
          >
            <BoxIcon className="w-5 h-5" />
            <span>Permanent Inventory</span>
          </Link>
          <Link
            to="/home/assets/$department"
            params={{ department: 'equipment' }}
            onClick={() => setOpen(false)}
            className="flex items-center space-x-3 p-3 rounded-md text-muted-foreground hover:text-foreground text-sm"
          >
            <MicrowaveIcon className="w-5 h-5" />
            <span>Equipment</span>
          </Link>
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

function NotificationPermissionDrawer() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (
      typeof Notification !== 'undefined' &&
      Notification.permission === 'default'
    ) {
      setOpen(true)
    }
  }, [])

  const handleEnableNotifications = async () => {
    setOpen(false)
    if (typeof Notification !== 'undefined') {
      await Notification.requestPermission()
    }
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Enable Notifications</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-4">
          <p className="mb-4 text-sm">
            Would you like to enable notifications for Cake Cafe? You’ll receive
            important updates and alerts.
          </p>
          <DrawerFooter>
            <Button onClick={handleEnableNotifications}>
              <motion.span
                className="inline-block mr-2"
                animate={{ rotate: [0, -15, 15, -10, 10, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 1.2,
                  ease: 'easeInOut',
                }}
              >
                <BellIcon color="white" />
              </motion.span>
              Enable Notifications
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Maybe Later
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
