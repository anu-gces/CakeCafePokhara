'use client'

import { useState } from 'react'
import { DatePickerWithPresets } from '@/components/ui/datepicker'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  CalendarIcon,
  DollarSignIcon,
  EditIcon,
  LoaderIcon,
  PlusIcon,
  SaveIcon,
  Trash2Icon,
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'motion/react'
import {
  getSeedBalance,
  setSeedBalance,
  deleteSeedBalance,
} from '@/firebase/dailyBalances'

const SeedOpeningConfig = () => {
  const [isEditing, setIsEditing] = useState(false)
  const [amount, setAmount] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()

  const queryClient = useQueryClient()

  const { data: seedBalance, isLoading } = useQuery({
    queryKey: ['seedBalance'],
    queryFn: getSeedBalance,
  })

  const createMutation = useMutation({
    mutationFn: setSeedBalance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seedBalance'] })
      setIsEditing(false)
      setAmount('')
      setSelectedDate(undefined)
      toast.success('Opening balance configured successfully!')
    },
    onError: () => {
      toast.error('Failed to save opening balance')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSeedBalance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seedBalance'] })
      toast.success('Opening balance deleted')
    },
    onError: () => {
      toast.error('Failed to delete opening balance')
    },
  })

  const handleSave = () => {
    if (!amount || !selectedDate) {
      toast.error('Please fill in all required fields')
      return
    }

    createMutation.mutate({
      amount: Number.parseFloat(amount),
      date: format(selectedDate, 'yyyy-MM-dd'),
    })
  }

  const handleEdit = () => {
    if (seedBalance) {
      setAmount(seedBalance.amount.toString())
      setSelectedDate(new Date(seedBalance.date))
      setIsEditing(true)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setAmount('')
    setSelectedDate(undefined)
  }

  if (isLoading) {
    return (
      <div className="px-4 py-6 w-full min-h-[400px]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center items-center h-full"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'linear',
            }}
            className="border-primary border-b-2 rounded-full w-8 h-8"
          />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 w-full min-h-screen">
      <div className="mx-auto w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <h1 className="font-bold text-foreground text-2xl">
            Opening Balance Configuration
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Set your initial cash balance to start tracking daily finances
          </p>
        </motion.div>

        <div className="w-full min-h-[300px]">
          <AnimatePresence mode="wait">
            {!seedBalance && !isEditing ? (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <Card className="border-2 border-dashed">
                  <CardContent className="flex flex-col justify-center items-center px-4 py-12">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        delay: 0.2,
                        type: 'spring',
                        stiffness: 200,
                      }}
                    >
                      <DollarSignIcon className="mb-4 w-12 h-12 text-muted-foreground" />
                    </motion.div>
                    <motion.h3
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="mb-2 font-medium text-foreground text-lg text-center"
                    >
                      No opening balance configured
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="mb-6 text-muted-foreground text-sm text-center leading-relaxed"
                    >
                      Configure your initial opening balance to start tracking
                      daily cash flow and financial reports.
                    </motion.p>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full"
                    >
                      <Button
                        onClick={() => setIsEditing(true)}
                        className="flex justify-center items-center gap-2 w-full"
                      >
                        <PlusIcon className="w-4 h-4" color="white" />
                        Configure Opening Balance
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : null}

            {seedBalance && !isEditing ? (
              <motion.div
                key="display-state"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="w-full"
              >
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{
                              delay: 0.2,
                              type: 'spring',
                              stiffness: 200,
                            }}
                          >
                            <DollarSignIcon className="flex-shrink-0 w-5 h-5 text-green-600" />
                          </motion.div>
                          <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="truncate"
                          >
                            Opening Balance Configured
                          </motion.span>
                        </CardTitle>
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                        >
                          <CardDescription className="text-xs">
                            Started on{' '}
                            {format(new Date(seedBalance.date), 'MMM dd, yyyy')}
                          </CardDescription>
                        </motion.div>
                      </div>
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          delay: 0.5,
                          type: 'spring',
                          stiffness: 200,
                        }}
                        className="flex-shrink-0"
                      >
                        <Badge
                          variant="secondary"
                          className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs"
                        >
                          Active
                        </Badge>
                      </motion.div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pb-4">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="space-y-3"
                    >
                      <div>
                        <label className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                          Amount
                        </label>
                        <motion.div
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          transition={{
                            delay: 0.4,
                            type: 'spring',
                            stiffness: 150,
                          }}
                          className="font-bold text-green-600 text-2xl"
                        >
                          Rs. {seedBalance.amount.toLocaleString()}
                        </motion.div>
                      </div>
                      <div>
                        <label className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                          Date
                        </label>
                        <div className="flex items-center gap-2 text-foreground">
                          <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            {format(new Date(seedBalance.date), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  </CardContent>
                  <CardFooter className="flex gap-2 pt-4">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1"
                    >
                      <Button
                        onClick={handleEdit}
                        className="flex justify-center items-center gap-2 w-full"
                      >
                        <EditIcon className="w-4 h-4" color="white" />
                        Edit
                      </Button>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant="outline"
                        onClick={() => deleteMutation.mutate()}
                        disabled={deleteMutation.isPending}
                        className="flex items-center gap-2 px-4"
                      >
                        {deleteMutation.isPending ? (
                          <LoaderIcon className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2Icon className="w-4 h-4" />
                        )}
                        {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                      </Button>
                    </motion.div>
                  </CardFooter>
                </Card>
              </motion.div>
            ) : null}

            {isEditing ? (
              <motion.div
                key="editing-state"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="w-full"
              >
                <Card>
                  <CardHeader className="pb-4">
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <CardTitle className="text-lg">
                        {seedBalance
                          ? 'Edit Opening Balance'
                          : 'Configure Opening Balance'}
                      </CardTitle>
                      <CardDescription className="text-sm leading-relaxed">
                        {seedBalance
                          ? 'Update your initial balance settings'
                          : 'Set your starting cash amount and date when you begin using this system'}
                      </CardDescription>
                    </motion.div>
                  </CardHeader>
                  <CardContent className="space-y-6 pb-4">
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <label className="block mb-2 font-medium text-foreground text-sm">
                        Opening Amount *
                      </label>
                      <div className="relative">
                        <span className="top-1/2 left-3 absolute text-muted-foreground -translate-y-1/2 transform">
                          Rs.
                        </span>
                        <Input
                          type="number"
                          placeholder="5000"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="pl-10 w-full"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <label className="block mb-2 font-medium text-foreground text-sm">
                        Starting Date *
                      </label>
                      <div className="w-full">
                        <DatePickerWithPresets
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                        />
                      </div>
                    </motion.div>
                  </CardContent>
                  <CardFooter className="flex gap-2 pt-4">
                    <motion.div
                      className="flex-1"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        onClick={handleSave}
                        disabled={
                          createMutation.isPending || !amount || !selectedDate
                        }
                        className="w-full"
                      >
                        {createMutation.isPending ? (
                          <div className="flex items-center gap-2">
                            <LoaderIcon
                              className="w-4 h-4 animate-spin"
                              color="white"
                            />
                            {seedBalance ? 'Updating...' : 'Saving...'}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <SaveIcon className="w-4 h-4" color="white" />
                            {seedBalance ? 'Update Balance' : 'Save Balance'}
                          </div>
                        )}
                      </Button>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                        className="bg-transparent px-6"
                      >
                        Cancel
                      </Button>
                    </motion.div>
                  </CardFooter>
                </Card>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {seedBalance && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-blue-50 dark:bg-blue-900/20 mt-6 p-4 border border-blue-200 dark:border-blue-800 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.7, type: 'spring', stiffness: 200 }}
                className="flex-shrink-0 bg-blue-500 mt-2 rounded-full w-2 h-2"
              />
              <motion.div
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
              >
                <h4 className="font-medium text-blue-900 dark:text-blue-100 text-sm">
                  Balance Tracking Active
                </h4>
                <p className="mt-1 text-blue-700 dark:text-blue-300 text-xs leading-relaxed">
                  Your daily balance calculations will use this amount as the
                  starting point. All future daily opening balances will be
                  chained from this initial configuration.
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default SeedOpeningConfig
