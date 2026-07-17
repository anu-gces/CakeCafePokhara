import { createFileRoute, useParams } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute(
  '/home/employee/employeeDailyReport/$employeeId',
)({
  component: RouteComponent,
})

// --- Sophisticated Fake Data ---
const MOCK_EMPLOYEE_DATA = {
  id: 'EMP-8821',
  name: 'Marcus Vance',
  role: 'Lead Barista / Shift Supervisor',
  shiftDate: 'Friday, July 17, 2026',
  shiftHours: '06:00 AM - 02:30 PM (8.5 hrs)',
  metrics: {
    netSales: 1842.5,
    transactions: 114,
    averageTicket: 16.16,
    tipsCollected: 342.0,
    drawerStatus: 'Balanced', // or "+$4.50", "-$12.00"
  },
  hourlySales: [
    { hour: '06 AM', sales: 120, tx: 8 },
    { hour: '07 AM', sales: 340, tx: 22 },
    { hour: '08 AM', sales: 480, tx: 31 },
    { hour: '09 AM', sales: 290, tx: 18 },
    { hour: '10 AM', sales: 180, tx: 12 },
    { hour: '11 AM', sales: 150, tx: 10 },
    { hour: '12 PM', sales: 210, tx: 11 },
    { hour: '01 PM', sales: 72.5, tx: 2 },
  ],
  categoryBreakdown: [
    { category: 'Espresso & Pour-Over', amount: 920.0, percentage: 50 },
    { category: 'Single-Origin Retail Beans', amount: 480.0, percentage: 26 },
    {
      category: 'Pastries & Artisanal Provisions',
      amount: 312.5,
      percentage: 17,
    },
    { category: 'Signature Merchandise', amount: 130.0, percentage: 7 },
  ],
  discrepancies: null, // "No operational overrides flagged."
}

function RouteComponent() {
  const { employeeId } = useParams({
    from: '/home/employee/employeeDailyReport/$employeeId',
  })
  const [report, setReport] = useState(MOCK_EMPLOYEE_DATA)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  return (
    <div className="bg-zinc-950 selection:bg-zinc-800 p-6 md:p-12 h-full min-h-full overflow-y-auto font-sans text-zinc-100 selection:text-white">
      {/* Container */}
      <div className="space-y-10 mx-auto max-w-6xl">
        {/* Top Header Section */}
        <header className="flex md:flex-row flex-col justify-between items-start md:items-end gap-4 pb-8 border-zinc-900 border-b">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono text-zinc-500 text-xs uppercase tracking-widest">
                Daily Performance Report
              </span>
              <span className="bg-emerald-500 rounded-full w-1.5 h-1.5 animate-pulse" />
              <span className="font-mono text-[10px] text-emerald-500 uppercase tracking-wider">
                Shift Finalized
              </span>
            </div>
            <h1 className="font-light text-zinc-50 text-3xl tracking-tight">
              {report.name}
            </h1>
            <p className="mt-1 text-zinc-400 text-sm">
              ID: <span className="font-mono text-zinc-300">{employeeId}</span>{' '}
              • {report.role}
            </p>
          </div>
          <div className="font-mono text-left md:text-right">
            <p className="text-zinc-300 text-sm">{report.shiftDate}</p>
            <p className="mt-0.5 text-zinc-500 text-xs">{report.shiftHours}</p>
          </div>
        </header>

        {/* Primary Metrics Grid */}
        <section className="gap-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: 'Net Sales',
              value: formatCurrency(report.metrics.netSales),
              detail: `${report.metrics.transactions} completed orders`,
            },
            {
              label: 'Average Ticket',
              value: formatCurrency(report.metrics.averageTicket),
              detail: 'Avg spend per guest',
            },
            {
              label: 'Tips Collected',
              value: formatCurrency(report.metrics.tipsCollected),
              detail: 'Direct to card & cash split',
            },
            {
              label: 'Drawer Discrepancy',
              value: report.metrics.drawerStatus,
              detail: '$0.00 variance at close',
              highlight: true,
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-zinc-900/40 p-5 border border-zinc-900 hover:border-zinc-800 rounded-lg transition duration-200"
            >
              <span className="block mb-2 font-mono text-zinc-500 text-xs uppercase tracking-wider">
                {item.label}
              </span>
              <span className="font-normal text-zinc-100 text-2xl tracking-tight">
                {item.value}
              </span>
              <span className="block mt-2 font-mono text-zinc-500 text-xs">
                {item.detail}
              </span>
            </div>
          ))}
        </section>

        {/* Analytics Section */}
        <section className="gap-8 grid grid-cols-1 lg:grid-cols-12">
          {/* Hourly Visualizer (Column Span 7) */}
          <div className="space-y-6 lg:col-span-7 bg-zinc-900/20 p-6 border border-zinc-900 rounded-xl">
            <div>
              <h3 className="font-medium text-zinc-200 text-sm">
                Sales Velocity
              </h3>
              <p className="mt-0.5 text-zinc-500 text-xs">
                Hourly revenue distribution across the active shift.
              </p>
            </div>

            {/* Minimalist Bar Chart */}
            <div className="flex justify-between items-end gap-2 pt-4 pb-2 border-zinc-900 border-b h-44">
              {report.hourlySales.map((h, idx) => {
                const maxSales = Math.max(
                  ...report.hourlySales.map((item) => item.sales),
                )
                const barHeightPercent = (h.sales / maxSales) * 100

                return (
                  <div
                    key={idx}
                    className="group flex flex-col flex-1 justify-end items-center h-full"
                  >
                    <span className="opacity-0 group-hover:opacity-100 mb-2 font-mono text-[10px] text-zinc-300 transition-opacity duration-150">
                      ${h.sales}
                    </span>
                    <div
                      style={{ height: `${barHeightPercent}%` }}
                      className="bg-zinc-800 group-hover:bg-zinc-100 rounded-t-sm w-full transition-colors duration-200"
                    />
                    <span className="mt-2 font-mono text-[10px] text-zinc-500 whitespace-nowrap">
                      {h.hour}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Category Share (Column Span 5) */}
          <div className="flex flex-col justify-between lg:col-span-5 bg-zinc-900/20 p-6 border border-zinc-900 rounded-xl">
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-zinc-200 text-sm">
                  Department Contribution
                </h3>
                <p className="mt-0.5 text-zinc-500 text-xs">
                  Where the gross volume originated.
                </p>
              </div>

              {/* Progress Bars */}
              <div className="space-y-4">
                {report.categoryBreakdown.map((cat, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between font-mono text-xs">
                      <span className="max-w-[70%] text-zinc-400 truncate">
                        {cat.category}
                      </span>
                      <span className="text-zinc-200">
                        {formatCurrency(cat.amount)} ({cat.percentage}%)
                      </span>
                    </div>
                    {/* Bar Track */}
                    <div className="bg-zinc-900 rounded-full h-1 overflow-hidden">
                      <div
                        className="bg-zinc-400 rounded-full h-full"
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Verification Footer */}
            <div className="flex justify-between items-center mt-6 pt-6 border-zinc-900 border-t">
              <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
                Status Verification
              </span>
              <span className="bg-zinc-900 px-2 py-0.5 border border-zinc-800 rounded font-mono text-[10px] text-zinc-400">
                Audited by Admin
              </span>
            </div>
          </div>
        </section>

        {/* Action Bar */}
        <footer className="flex sm:flex-row flex-col justify-between items-center gap-4 pt-6 border-zinc-900 border-t">
          <p className="font-mono text-zinc-500 text-xs">
            {report.discrepancies ||
              '✓ Operational compliance standards met for this terminal session.'}
          </p>
          <div className="flex gap-3 w-full sm:w-auto">
            <button className="sm:flex-initial flex-1 px-4 py-2 border border-zinc-800 hover:border-zinc-700 rounded-md font-mono text-zinc-300 hover:text-white text-xs transition">
              Export Audit Trail
            </button>
            <button className="sm:flex-initial flex-1 bg-zinc-100 hover:bg-white px-4 py-2 rounded-md font-medium text-zinc-950 text-xs tracking-tight transition">
              Approve & Close Out Shift
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
