import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const tables = [
  { tableNo: 1, colStart: 1, rowStart: 1 },
  { tableNo: 2, colStart: 1, rowStart: 2 },
  { tableNo: 3, colStart: 1, rowStart: 3 },
  { tableNo: 4, colStart: 3, rowStart: 4 },
  { tableNo: 5, colStart: 5, rowStart: 4 },
  { tableNo: 6, colStart: 3, rowStart: 5 },
  { tableNo: 7, colStart: 5, rowStart: 5 },
  { tableNo: 8, colStart: 3, rowStart: 6 },
  { tableNo: 9, colStart: 5, rowStart: 6 },
  { tableNo: 10, colStart: 2, rowStart: 9 },
  { tableNo: 11, colStart: 4, rowStart: 9 },
]

export function SeatingPlan({
  selectedTable,
  setSelectedTable,
}: {
  selectedTable: number
  setSelectedTable: (tables: number) => void
}) {
  // For now, no logic for selection/toggle

  //   const toggleTable = (tableNo: number) => {
  //     setSelectedTables((prev) => (prev.includes(tableNo) ? prev.filter((no) => no !== tableNo) : [...prev, tableNo]));
  //   };

  const toggleTable = (tableNo: number) => {
    setSelectedTable(selectedTable === tableNo ? -1 : tableNo)
  }
  return (
    <>
      <div className="col-span-5 mb-2 text-muted-foreground text-xs text-center italic">
        Leave unselected for takeout/delivery (table will be set to -1)
      </div>
      <div className="gap-4 grid grid-cols-5 grid-rows-9 auto-rows-min dark:bg-black mx-auto p-4 border-1 max-w-sm aspect-square">
        {tables.map(({ tableNo, colStart, rowStart }) => (
          <Button
            key={tableNo}
            onClick={() => toggleTable(tableNo)}
            className={cn(
              'flex  justify-center bg-secondary items-center p-4 rounded-none text-center hover:text-white text-foreground h-full',
              `col-start-${colStart} row-start-${rowStart}`,
              selectedTable === tableNo &&
                'ring-2 ring-primary ring-offset-2 bg-primary text-gray-200',
            )}
          >
            {tableNo}
          </Button>
        ))}

        {/* Bar */}
        <div className="flex justify-center items-center col-span-3 col-start-3 row-span-2 row-start-1 bg-indigo-300 p-4 rounded-bl-xl rounded-br-xl text-white text-center">
          Bar
        </div>

        {/* Waterwell */}
        <div className="flex justify-center items-center col-start-1 row-span-3 row-start-4 bg-indigo-300 p-4 rounded-tr-full rounded-br-full text-white text-center">
          Well
        </div>

        {/* Billing area */}
        <div className="flex justify-center items-center col-span-5 col-start-1 row-start-8 bg-indigo-300 p-4 text-white text-center">
          Billing Area
        </div>
        <div className="col-start-2 row-start-1" />
        <div className="col-start-3 row-start-3" />
        <div className="col-start-4 row-start-3" />
        <div className="col-start-5 row-start-3" />
        <div className="col-start-2 row-start-4" />
        <div className="col-start-4 row-start-4" />
        <div className="col-start-2 row-start-5" />
        <div className="col-start-4 row-start-5" />
        <div className="col-start-2 row-start-6" />
        <div className="col-start-4 row-start-6" />
        <div className="col-start-1 row-start-7" />
        <div className="col-start-2 row-start-7" />
        <div className="col-start-3 row-start-7" />
        <div className="col-start-4 row-start-7" />
        <div className="col-start-5 row-start-7" />
        <div className="col-start-1 row-start-9" />
        <div className="col-start-3 row-start-9" />
        <div className="col-start-5 row-start-9" />
      </div>
    </>
  )
}
