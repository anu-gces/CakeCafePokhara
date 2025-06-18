import { CalendarDateRangePicker } from '@/components/ui/daterangepicker'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useNavigate } from '@tanstack/react-router'
import { type Tab, Route as dashboardRoute } from '../../routes/home/dashboard'
import { Overview } from './overview'
import { BarChartIcon, LayoutDashboardIcon } from 'lucide-react'
import { Analytics } from './analytics'

export default function Dashboard() {
  const navigate = useNavigate()
  const { tab } = dashboardRoute.useSearch() as { tab: Tab }

  const handleTabChange = (newTabUntyped: string) => {
    const newTab: Tab = newTabUntyped as Tab

    navigate({
      to: '/home/dashboard',
      search: (prev: { [key: string]: string }) => ({ ...prev, tab: newTab }),
    })
  }
  return (
    <>
      <div className="md:flex flex-col px-2 h-full">
        <div className="flex-1 space-y-4 pt-6 h-full">
          <Tabs
            defaultValue="overview"
            className="flex flex-col space-y-4 h-full"
            onValueChange={handleTabChange}
            value={tab}
          >
            <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-2">
              <TabsList className="flex-wrap">
                <TabsTrigger value="overview">
                  <LayoutDashboardIcon className="mr-2 w-4 h-4" /> Overview
                </TabsTrigger>
                <TabsTrigger value="analytics">
                  <BarChartIcon className="mr-2 w-4 h-4" /> Analytics
                </TabsTrigger>
              </TabsList>
              <div className="flex flex-nowrap items-center gap-2 min-w-0">
                <div className="flex-shrink">
                  <CalendarDateRangePicker />
                </div>
                {/* <Button className="flex-shrink gap-2">
                  <Download color="#ffffff" size={16} /> Download
                </Button>
                <Button className="flex-shrink gap-2" size="icon">
                  <Share color="#ffffff" size={16} />
                </Button> */}
              </div>
            </div>
            <TabsContent value="overview" className="space-y-4 h-full">
              <div className="flex flex-col gap-4 h-full">
                <Overview />
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4 h-full">
              <div className="flex flex-col gap-4 h-full">
                <Analytics />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}
