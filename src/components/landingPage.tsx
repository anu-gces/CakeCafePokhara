import { useNavigate } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import type React from 'react'
import { useState } from 'react'
import CakeCakeLogo from '@/assets/Logob.png'
import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/ui/themeToggle'
import { Loader } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { login } from '@/lib/auth'
import { parsePbError } from '@/lib/utils'

export function LoginForm() {
  const navigate = useNavigate()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    // Extracting the values from the form
    const username = formData.get('username') as string
    const password = formData.get('password') as string

    setIsSigningIn(true)
    setErrorMessage(null)

    try {
      // 1. Call our PocketBase login logic
      await login(username, password)

      // 2. Navigate on success
      navigate({
        to: '/home/takeOrder',
        search: { category: 'appetizers' },
      })
    } catch (error: unknown) {
      setErrorMessage(parsePbError(error))
    } finally {
      setIsSigningIn(false)
    }
  }

  return (
    <div className="space-y-8 mx-auto w-[320px]">
      <div className="space-y-2 text-center">
        <h1 className="font-bold text-3xl uppercase tracking-tighter">Login</h1>
        <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
          Internal Access Only
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label
            htmlFor="username"
            className="opacity-60 text-[10px] uppercase"
          >
            Username
          </Label>
          <Input
            id="username"
            name="username"
            type="text"
            placeholder="john_doe23"
            required
            autoComplete="username"
          />
        </div>

        <div className="space-y-1">
          <Label
            htmlFor="password"
            className="opacity-60 text-[10px] uppercase"
          >
            Password
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            className="border"
            autoComplete="current-password"
          />
        </div>

        <Button
          type="submit"
          className="flex justify-center items-center bg-primary hover:bg-primary/90 disabled:opacity-50 mt-4 rounded-none w-full h-12 text-primary-foreground text-xs uppercase tracking-widest"
          disabled={isSigningIn}
        >
          {isSigningIn ? (
            <Loader className="w-4 h-4 animate-spin" color="white" />
          ) : (
            'Authorize'
          )}
        </Button>

        {errorMessage && (
          <p className="mt-2 text-[10px] text-destructive text-center uppercase tracking-tight">
            {errorMessage}
          </p>
        )}
      </form>
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
