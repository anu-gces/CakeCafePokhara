import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerDescription,
  DrawerFooter,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronRight, PencilIcon, Plus, Trash2Icon, User2 } from 'lucide-react'
import { type PanInfo, useMotionValue, motion } from 'motion/react'
import { handleSwipeSnap } from '@/lib/swipeGestures'
import { toast } from 'sonner'

import errorSound from '@/assets/error.mp3'
import successSound from '@/assets/success.mp3'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addCreditorToFirestore, getAllCreditors } from '@/firebase/firestore'
import { useFirebaseAuth } from '@/lib/useFirebaseAuth'

// Play error sound
function playErrorSound() {
  const audio = new Audio(errorSound)
  audio.play()
}

// Play success sound
function playSuccessSound() {
  const audio = new Audio(successSound)
  audio.play()
}

export const Route = createFileRoute('/home/creditors')({
  component: RouteComponent,
})

type Creditor = {
  nickname: string
  firstName: string
  lastName: string
  remarks?: string
}

function RouteComponent() {
  // const [creditors, setCreditors] = useState<Creditor[]>(fakeCreditors)
  const [nickname, setNickname] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [remarks, setRemarks] = useState('')

  const { userAdditional } = useFirebaseAuth()
  const isEmployee = userAdditional?.role === 'employee'

  const navigate = useNavigate({ from: '/home/creditors' })
  const queryClient = useQueryClient()

  const { data: creditors = [] } = useQuery({
    queryKey: ['creditors'],
    queryFn: getAllCreditors,
  })

  // Mutation for adding a creditor
  const addCreditorMutation = useMutation({
    mutationFn: addCreditorToFirestore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditors'] })
    },
  })

  const handleAddCreditor = () => {
    if (!nickname || !firstName || !lastName) {
      playErrorSound()
      toast.warning('Nickname, First name, and Last name are required.')

      return
    }

    const isDuplicate = creditors.some((c) => c.nickname === nickname)
    if (isDuplicate) {
      playErrorSound()
      toast.warning('Nickname must be unique.')
      return
    }

    const newCreditor: Creditor = {
      nickname,
      firstName,
      lastName,
      remarks,
    }

    addCreditorMutation.mutate(newCreditor, {
      onSuccess: () => {
        setNickname('')
        setFirstName('')
        setLastName('')
        setRemarks('')
        playSuccessSound()
        toast.success('Creditor added successfully!', {
          description: `${newCreditor.nickname} (${newCreditor.firstName} ${newCreditor.lastName})`,
        })
      },
      onError: () => {
        playErrorSound()
        toast.error('Failed to add creditor to Firestore.')
      },
    })
  }

  return (
    <div className="space-y-6 pt-6">
      <div className="flex justify-between items-center">
        <h1 className="ml-6 font-semibold text-3xl tracking-tight">
          Creditors
        </h1>
        {!isEmployee && (
          <Drawer shouldScaleBackground={true} setBackgroundColorOnScale={true}>
            <DrawerTrigger asChild>
              <Button className="flex gap-2 mr-6">
                <Plus size={18} color="white" />
                Add Creditor
              </Button>
            </DrawerTrigger>
            <DrawerContent className="space-y-4 p-6">
              <DrawerHeader>
                <h2 className="font-medium text-xl">New Creditor</h2>
              </DrawerHeader>
              <div className="space-y-2">
                <Input
                  placeholder="Nickname (unique)"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
                <Input
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <Input
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
                <Input
                  placeholder="Remarks (optional)"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>
              <DrawerFooter>
                <Button className="w-full" onClick={handleAddCreditor}>
                  Save
                </Button>
                <DrawerClose asChild>
                  <Button type="button" variant="outline" className="w-full">
                    Cancel
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        )}
      </div>

      <div>
        {creditors.map((creditor) => (
          <CreditorCard
            key={creditor.nickname}
            creditor={creditor}
            navigate={navigate}
          />
        ))}
      </div>
    </div>
  )
}

function CreditorCard({
  creditor,
  navigate,
}: {
  creditor: Creditor
  navigate: ReturnType<typeof useNavigate>
}) {
  const { userAdditional } = useFirebaseAuth()
  const isEmployee = userAdditional?.role === 'employee'
  const x = useMotionValue(0)
  const snapState = useRef<'center' | 'left' | 'right'>('center')

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (!isEmployee) {
      handleSwipeSnap(x, snapState, info)
    }
  }

  return (
    <div className="relative">
      {!isEmployee && (
        <>
          <div className="top-0 left-0 z-0 absolute flex items-center h-full">
            <div className="flex justify-center items-center border w-full h-full">
              <EditDrawer />
              <DeleteDrawer />
            </div>
          </div>
          <div className="top-0 right-0 z-0 absolute flex items-center h-full">
            <div className="flex justify-center items-center border w-full h-full">
              <EditDrawer />
              <DeleteDrawer />
            </div>
          </div>
        </>
      )}
      <motion.div
        key={creditor.nickname}
        className="z-10 relative gap-0 grid grid-cols-1"
        drag={isEmployee ? false : 'x'}
        dragDirectionLock
        dragConstraints={{ left: -70, right: 70 }}
        dragTransition={{ bounceStiffness: 500, bounceDamping: 15 }}
        style={{ x }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
      >
        <Card
          onClick={() =>
            navigate({
              to: `/home/${creditor.nickname}`,
              viewTransition: { types: ['slide-left'] },
            })
          }
          className="z-20 flex items-stretch bg-background hover:bg-muted shadow-none border-b last:border-b-0 rounded-none transition-colors"
        >
          <div className="flex flex-shrink-0 justify-center items-center rounded-none w-16 min-w-16 h-full">
            <User2 className="w-10 h-10 text-primary" />
          </div>
          <CardContent className="flex flex-col flex-1 justify-center px-0 py-3 min-w-0">
            <div className="font-semibold text-base truncate">
              {creditor.nickname}
            </div>
            <div className="text-muted-foreground text-sm truncate">
              {creditor.firstName} {creditor.lastName}
            </div>
            {creditor.remarks && (
              <div className="text-muted-foreground text-xs truncate italic">
                {creditor.remarks}
              </div>
            )}
          </CardContent>
          <div className="flex items-center pr-4">
            <ChevronRight />
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

function EditDrawer() {
  const [open, setOpen] = useState(false)

  return (
    <Drawer
      shouldScaleBackground={true}
      setBackgroundColorOnScale={true}
      open={open}
      onOpenChange={setOpen}
    >
      <DrawerTrigger asChild>
        <Button variant={'ghost'} size="icon" onClick={() => setOpen(true)}>
          <PencilIcon className="w-4 h-4" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Delete Food Item</DrawerTitle>
          <DrawerDescription>
            Are you sure you want to delete this?
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <Button className="text-white" type="submit">
            Save Changes{' '}
          </Button>
          <DrawerClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function DeleteDrawer() {
  const [open, setOpen] = useState(false)

  return (
    <Drawer
      shouldScaleBackground={true}
      setBackgroundColorOnScale={true}
      open={open}
      onOpenChange={setOpen}
    >
      <DrawerTrigger asChild>
        <Button variant={'ghost'} size="icon" onClick={() => setOpen(true)}>
          <Trash2Icon className="w-4 h-4" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Delete Food Item</DrawerTitle>
          <DrawerDescription>
            Are you sure you want to delete this?
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <Button className="text-white" type="submit">
            Save Changes{' '}
          </Button>
          <DrawerClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
