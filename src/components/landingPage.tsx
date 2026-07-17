import { useNavigate } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import CakeCakeLogo from '@/assets/Logob.webp'
import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/ui/themeToggle'
import { LoaderIcon } from 'lucide-react'
import { useAuthActions } from '@convex-dev/auth/react'

export function LoginForm() {
  const navigate = useNavigate()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { signIn } = useAuthActions()

  const handleGoogleLogin = async () => {
    setIsSigningIn(true)
    setErrorMessage(null)

    try {
      await signIn('google')
      navigate({
        to: '/home/takeOrder',
        search: { category: 'appetizers' },
      })
    } catch (error: any) {
      setErrorMessage(error?.message ?? 'Google sign-in failed')
    } finally {
      setIsSigningIn(false)
    }
  }

  return (
    <div className="space-y-8 mx-auto w-[320px] text-center">
      <div className="space-y-2">
        <h1 className="font-bold text-3xl uppercase tracking-tighter">Login</h1>
        <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
          Continue with Google
        </p>
      </div>

      <Button
        onClick={handleGoogleLogin}
        disabled={isSigningIn}
        className="flex justify-center items-center rounded-none w-full h-12 text-xs uppercase tracking-widest scale-99"
      >
        {isSigningIn ? (
          <LoaderIcon color="white" className="w-4 h-4 animate-spin" />
        ) : (
          'Sign in with Google'
        )}
      </Button>

      {errorMessage && (
        <p className="text-[10px] text-destructive uppercase">{errorMessage}</p>
      )}
    </div>
  )
}
export function LandingPage() {
  const variants = {
    hidden: { x: '75vw', transition: { duration: 0.5 } },
    visible: { x: 0, transition: { duration: 0.5 } },
    exit: { x: '75vw', transition: { duration: 0.5 } },
  }

  const variants2 = {
    hidden: { y: '-100vh', transition: { duration: 0.5 } },
    visible: { y: 0, transition: { duration: 0.5 } },
    exit: { y: '-100vh', transition: { duration: 0.5 } },
  }

  return (
    <>
      <div className="flex lg:flex-row flex-col p-4 md:p-16 w-screen h-[100dvh] overflow-clip">
        <div className="top-0 right-0 z-10 absolute p-12">
          <ModeToggle />
        </div>

        <AnimatePresence>
          <motion.div
            className="flex justify-center items-end lg:items-center pb-4 w-full lg:w-1/2 h-1/2 lg:h-full"
            variants={variants2}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <img
              src={CakeCakeLogo}
              alt="Logo"
              loading="lazy"
              decoding="async"
              className="w-50 object-contain"
            />
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          <motion.div
            className="flex justify-center items-start lg:items-center pt-4 border-t-1 lg:border-t-0 lg:border-l-1 w-full lg:w-1/2 h-1/2 lg:h-full"
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            key={'login-form'}
          >
            <LoginForm />
          </motion.div>
        </AnimatePresence>
        <footer className="bottom-2 left-1/2 absolute text-gray-500 text-xs text-nowrap -translate-x-1/2 transform">
          &copy; {new Date().getFullYear()} anuvette. All rights reserved.
        </footer>
      </div>
    </>
  )
}
