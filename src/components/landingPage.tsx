import { useNavigate } from '@tanstack/react-router'
import { useFirebaseAuth } from '@/lib/useFirebaseAuth'
import { AnimatePresence, motion } from 'motion/react'
import type React from 'react'
import { useState } from 'react'
import CakeCakeLogo from '../assets/Logob.png'
import { Button } from './ui/button'
import { ModeToggle } from './ui/themeToggle'
import { Loader } from 'lucide-react'

function GoogleLogo() {
  // White Google logo SVG
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      x="0px"
      y="0px"
      width="100"
      height="100"
      viewBox="0,0,256,256"
      style={{ fill: '#FFFFFF' }}
    >
      <g
        fill="#ffffff"
        fill-rule="nonzero"
        stroke="none"
        strokeWidth="1"
        strokeLinecap="butt"
        strokeLinejoin="miter"
        strokeMiterlimit="10"
        strokeDasharray=""
        strokeDashoffset="0"
        fontFamily="none"
        fontWeight="none"
        fontSize="none"
        textAnchor="none"
        style={{ mixBlendMode: 'normal' }}
      >
        <g transform="scale(8.53333,8.53333)">
          <path d="M15.00391,3c-6.629,0 -12.00391,5.373 -12.00391,12c0,6.627 5.37491,12 12.00391,12c10.01,0 12.26517,-9.293 11.32617,-14h-1.33008h-2.26758h-7.73242v4h7.73828c-0.88958,3.44825 -4.01233,6 -7.73828,6c-4.418,0 -8,-3.582 -8,-8c0,-4.418 3.582,-8 8,-8c2.009,0 3.83914,0.74575 5.24414,1.96875l2.8418,-2.83984c-2.134,-1.944 -4.96903,-3.12891 -8.08203,-3.12891z"></path>
        </g>
      </g>
    </svg>
  )
}

function LoginForm() {
  const navigate = useNavigate({ from: '/' })

  const [isSigningIn, setIsSigningIn] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { signInWithGoogle, userAdditional } = useFirebaseAuth()

  const loginWithGoogle = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!isSigningIn) {
      setIsSigningIn(true)
      try {
        await signInWithGoogle()
        // Wait for userAdditional to update after sign-in
        if (!userAdditional?.isProfileComplete) {
          navigate({ to: '/profileComplete' })
        } else {
          navigate({
            to: '/home/editMenu',
            search: { category: 'appetizers' },
          })
        }
      } catch (error) {
        console.error('Error signing in with Google: ', error)
        setErrorMessage(
          'Error signing in with Google: ' + (error as Error).message,
        )
      } finally {
        setIsSigningIn(false)
      }
    }
  }

  return (
    <div className="gap-6 grid mx-auto w-[350px]">
      <div className="gap-2 grid text-center">
        <h1 className="font-bold text-3xl">Login</h1>
        <p className="text-muted-foreground text-balance">
          Cick the Button below to login to your account.
        </p>
      </div>
      <div className="gap-4 grid">
        <Button
          className="w-full"
          onClick={loginWithGoogle}
          disabled={isSigningIn}
        >
          <span className="flex justify-center items-center gap-2">
            <GoogleLogo />
            {isSigningIn ? (
              <>
                <Loader className="w-5 h-5 animate-spin" color="white" />
              </>
            ) : (
              'Login with Google'
            )}
          </span>
        </Button>
        {errorMessage && (
          <div className="mt-4 p-2 border border-primary rounded text-primary text-center">
            {errorMessage}
          </div>
        )}
      </div>
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

        <AnimatePresence mode="wait">
          <motion.div
            className="flex justify-center items-end lg:items-center pb-4 w-full lg:w-1/2 h-1/2 lg:h-full"
            variants={variants2}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <img
              src={CakeCakeLogo}
              alt="Image"
              className="w-50 object-contain"
            />
          </motion.div>
        </AnimatePresence>

        <AnimatePresence mode="wait">
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
