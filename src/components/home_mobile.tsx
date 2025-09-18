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
import { motion, animate, useMotionValue, useTransform } from 'motion/react'
import { BoxIcon, FuelIcon, MicrowaveIcon, RotateCwIcon } from 'lucide-react'

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
import { useEffect, useRef, useState } from 'react'
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
    title: 'Take Order',
    icon: CoffeeIcon,
    to: '/home/takeOrder?category="appetizers"',
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
    to: '/home/dashboard',
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
        } catch (err) {}
      }
    }
    fetchAndSaveFcmToken()
  }, [])

  if (isLoading) {
    return <SplashScreen />
  }

  return (
    <>
      <NotificationPermissionDrawer />
      <div
        data-vaul-drawer-wrapper=""
        className="flex flex-col justify-between bg-white dark:bg-background h-[100dvh] overflow-x-clip overflow-y-clip overscroll-none"
      >
        <div className="flex justify-between items-center bg-background shadow-md dark:shadow-2xl p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <AvatarDrawer />
          </div>
          <HamburgerDrawer />
        </div>
        <div
          className={
            'relative flex-grow overflow-x-hidden overflow-y-hidden [view-transition-name:main-content]  overscroll-contain'
          }
        >
          <PullToRefresh />
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
    </>
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
            <>
              <Link
                to="/home/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center space-x-3 p-3 rounded-md text-muted-foreground hover:text-foreground text-sm"
              >
                <BarChart2Icon className="w-5 h-5" />
                <span>Analytics</span>
              </Link>
              <Link
                to="/home/inventoryManagement"
                search={{ category: 'appetizers' }}
                onClick={() => setOpen(false)}
                className="flex items-center space-x-3 p-3 rounded-md text-muted-foreground hover:text-foreground text-sm"
              >
                <BoxIcon className="w-5 h-5" />
                <span>Stock Inventory Management</span>
              </Link>
              <Link
                to="/home/inventoryHistory"
                search={{ category: 'appetizers' }}
                onClick={() => setOpen(false)}
                className="flex items-center space-x-3 p-3 rounded-md text-muted-foreground hover:text-foreground text-sm"
              >
                <HistoryIcon className="w-5 h-5" />
                <span>Stock Inventory History</span>
              </Link>
            </>
          )}

          <Link
            to="/home/creditors/creditorsAll"
            onClick={() => setOpen(false)}
            className="flex items-center space-x-3 p-3 rounded-md text-muted-foreground hover:text-foreground text-sm"
          >
            <HandCoinsIcon className="w-5 h-5" />
            <span>Creditors</span>
          </Link>

          <Link
            to="/home/vendors"
            onClick={() => setOpen(false)}
            className="flex items-center space-x-3 p-3 rounded-md text-muted-foreground hover:text-foreground text-sm"
          >
            <HandCoinsIcon className="w-5 h-5" />
            <span>Vendors</span>
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
          <Link
            to="/home/bakeryLedger"
            onClick={() => setOpen(false)}
            className="flex items-center space-x-3 p-3 rounded-md text-muted-foreground hover:text-foreground text-sm"
          >
            <FuelIcon className="w-5 h-5" />
            <span>Utility Ledger</span>
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
          <Link
            to="/home/permanentInventory"
            onClick={() => setOpen(false)}
            className="flex items-center space-x-3 p-3 rounded-md text-muted-foreground hover:text-foreground text-sm"
          >
            <BoxIcon className="w-5 h-5" />
            <span>Permanent Inventory</span>
          </Link>
          <Link
            to="/home/equipment"
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

declare global {
  interface Window {
    __globalDragging: boolean
  }
}

window.__globalDragging = false

// function rubberBand(distance: number, max: number, resistance: number = 0.3) {
//   if (distance < max) return distance
//   return max + (distance - max) * resistance
// }

function PullToRefresh() {
  const y = useMotionValue(0)
  const rotate = useTransform(y, (v) => v * 2)
  const startX = useRef<number | null>(null)
  const startY = useRef<number | null>(null)
  const scrollEl = useRef<HTMLElement | null>(null)
  const isPulling = useRef(false)

  useEffect(() => {
    function findScrollable(el: HTMLElement | null): HTMLElement | null {
      while (el) {
        const overflowY = getComputedStyle(el).overflowY
        if (
          (overflowY === 'auto' || overflowY === 'scroll') &&
          el.scrollHeight > el.clientHeight
        ) {
          return el
        }
        el = el.parentElement
      }
      return null
    }

    function handleTouchStart(e: TouchEvent) {
      if (document.querySelector('[data-state="open"]')) return
      const touchTarget = e.target as HTMLElement
      const scrollable = findScrollable(touchTarget)
      const isScrollableAtTop =
        scrollable?.scrollTop === 0 ||
        (scrollable == null && window.scrollY === 0)
      if (isScrollableAtTop) {
        startY.current = e.touches[0].clientY
        startX.current = e.touches[0].clientX
        scrollEl.current = scrollable
        isPulling.current = true
      }
    }

    function handleTouchMove(e: TouchEvent) {
      if (!isPulling.current) return
      if (window.__globalDragging) return
      if (
        startY.current !== null &&
        (scrollEl.current?.scrollTop === 0 ||
          (scrollEl.current == null && window.scrollY === 0))
      ) {
        const deltaY = e.touches[0].clientY - startY.current
        if (deltaY > 0) {
          y.set(Math.min(deltaY, 100))
          e.preventDefault()
        } else {
          y.set(0) // Reset if user swipes up
        }
      }
    }

    function handleTouchEnd() {
      if (!isPulling.current) return
      const shouldReload = y.get() >= 80
      animate(y, 0, {
        type: 'spring',
        stiffness: 500,
        damping: 40,
        mass: 2,
        onComplete: () => {
          //rotate360

          if (shouldReload) {
            window.location.reload()
          }
        },
      })
      startY.current = null
      startX.current = null
      scrollEl.current = null
      isPulling.current = false
    }

    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [y])

  return (
    <motion.div
      style={{ y }}
      className="-top-20 right-0 left-0 z-100 absolute flex justify-center items-center h-16"
    >
      <div className="relative flex justify-center items-center w-12 h-12">
        <div className="absolute inset-0 bg-background shadow-lg rounded-full" />
        <motion.div
          className="z-10 absolute inset-0 flex justify-center items-center"
          style={{ rotate }}
        >
          <RotateCwIcon className="drop-shadow w-7 h-7 text-rose-500" />
        </motion.div>
      </div>
    </motion.div>
  )
}
