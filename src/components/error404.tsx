/**
 * This code was generated by v0 by Vercel.
 * @see https://v0.dev/t/yMsl5zXKSml
 */
import { Button } from '@/components/ui/button'
import { useNavigate } from '@tanstack/react-router'
import type { SVGProps } from 'react'
import type { JSX } from 'react/jsx-runtime'

export function Error404() {
  const navigate = useNavigate({ from: '/home' })

  return (
    <div className="flex flex-col justify-center items-center bg-transparent min-h-full">
      <div className="flex items-center space-x-4 font-bold text-[192px] text-primary dark:text-white leading-none scale-50 lg:scale-100">
        <span>4</span>
        <DonutIcon className="inline-block w-[192px] h-[192px] text-primary" />
        <span>4</span>
      </div>
      <h1 className="mt-8 font-semibold text-gray-800 dark:text-white text-2xl lg:text-7xl text-nowrap">
        Oopsie! Something's missing...
      </h1>
      <p className="mt-4 text-gray-600 dark:text-gray-300 text-sm md:text-lg lg:text-xl text-nowrap">
        It seems like we donut find what you searched. Go Back...
      </p>
      <Button
        className="mt-8 px-6 py-3 font-med text-background text-lg"
        variant="default"
        onClick={() => {
          navigate({
            to: '/home/takeOrder',
            search: { category: 'appetizers' },
          })
        }}
      >
        Back To Home
      </Button>
    </div>
  )
}

function DonutIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.5 10a2.5 2.5 0 0 1-2.4-3H18a2.95 2.95 0 0 1-2.6-4.4 10 10 0 1 0 6.3 7.1c-.3.2-.8.3-1.2.3" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
