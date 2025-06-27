import React from 'react'
import { Info, CalendarDays, AlertCircle, LifeBuoy } from 'lucide-react'

export function Help() {
  return (
    <div className="bg-background px-3 sm:px-6 py-6 sm:py-10 min-h-screen text-foreground">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 sm:mb-10 text-center">
          <h1 className="font-bold text-2xl sm:text-4xl tracking-tight">
            Help & Support
          </h1>
          <p className="mt-2 text-gray-600 text-sm sm:text-base">
            Everything you need to know to navigate the app smoothly.
          </p>
        </header>

        <div className="gap-4 sm:gap-8 grid grid-cols-1 md:grid-cols-2">
          <Section
            icon={<Info className="w-6 h-6 text-blue-500" />}
            title="Overview"
            content="This app helps manage customer orders and receipts, tracks transaction history, and allows you to search based on time ranges. Use the main navigation to access core features."
          />

          <Section
            icon={<CalendarDays className="w-6 h-6 text-green-500" />}
            title="Orders by Date Range"
            content="Use the date picker to filter orders between two dates. This is useful for reviewing activity or resolving customer inquiries from a specific time period."
          />

          <Section
            icon={<AlertCircle className="w-6 h-6 text-red-500" />}
            title="Troubleshooting"
            content={
              <ul className="space-y-1 ml-5 text-sm list-disc">
                <li>Ensure your internet connection is stable.</li>
                <li>Use valid date formats (YYYY-MM-DD).</li>
                <li>
                  If data seems missing, check the Firebase console directly.
                </li>
              </ul>
            }
          />

          <Section
            icon={<LifeBuoy className="w-6 h-6 text-purple-500" />}
            title="Still need help?"
            content={
              <p className="text-sm">
                For technical support, please contact <strong>anuvette</strong>{' '}
                at{' '}
                <a
                  href="mailto:anuvette.dev@gmail.com"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  anuvette.dev@gmail.com
                </a>
                .
              </p>
            }
          />
        </div>

        <footer className="relative mt-10 sm:mt-16 text-foreground text-xs sm:text-sm text-center">
          &copy; {new Date().getFullYear()} anuvette. All rights reserved.
        </footer>
      </div>
    </div>
  )
}

function Section({
  icon,
  title,
  content,
}: {
  icon: React.ReactNode
  title: string
  content: React.ReactNode
}) {
  return (
    <div className="bg-card shadow-md hover:shadow-lg mb-4 sm:mb-0 p-4 sm:p-6 rounded-2xl transition-shadow duration-300">
      <div className="flex items-center gap-3 mb-2 sm:mb-3">
        {icon}
        <h3 className="font-semibold text-base sm:text-lg">{title}</h3>
      </div>
      <div className="text-foreground text-xs sm:text-sm">{content}</div>
    </div>
  )
}
