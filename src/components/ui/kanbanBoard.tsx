import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  enterKanbanCardDocument,
  getCurrentUserDocumentDetails,
  getKanbanCardDocument,
} from '@/firebase/firestore'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  GripVertical,
  Loader,
  Plus,
  SaveIcon,
  Trash2,
  XIcon,
} from 'lucide-react'
import { motion } from 'motion/react'
import {
  type Dispatch,
  type DragEvent,
  type FormEvent,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react'
import { toast } from 'sonner'
//@ts-ignore
import { enableDragDropTouch } from '@/lib/drag-drop-touch.esm.min.js'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select'
import type { kanbanCategory } from '../stock'
import { useSearch } from '@tanstack/react-router'
import { Input } from './input'
import { Label } from './label'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useFirebaseAuth } from '@/lib/useFirebaseAuth'

declare global {
  interface Window {
    __kanbanDragging: boolean
  }
}

window.__kanbanDragging = false
type ColumnType = 'inStock' | 'runningLow' | 'outOfStock' | 'restocked'

export type CardType = {
  title: string
  id: string
  price: number
  category: kanbanCategory
  column: ColumnType
  uid: string
  displayName: string
  email: string
  lastModifiedUid: string
  lastModifiedDisplayName: string
  lastModifiedEmail: string
  createdAt: string
  updatedAt: string
}

const COLUMNS: ColumnType[] = [
  'inStock',
  'runningLow',
  'outOfStock',
  'restocked',
]
const CATEGORIES: kanbanCategory[] = [
  'Kitchen',
  'Bar',
  'DonutStation',
  'Counter',
  'Bakery',
]

export function generateDummyCards(count: number): CardType[] {
  const cards: CardType[] = []
  for (let i = 0; i < count; i++) {
    const column = COLUMNS[Math.floor(Math.random() * COLUMNS.length)]
    const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]
    cards.push({
      title: `Item ${i + 1}`,
      id: `dummy-${i}`,
      price: Math.floor(Math.random() * 1000),
      category,
      column,
      uid: `user${i % 5}`,
      displayName: `User ${i % 5}`,
      email: `user${i % 5}@test.com`,
      lastModifiedUid: `user${i % 5}`,
      lastModifiedDisplayName: `User ${i % 5}`,
      lastModifiedEmail: `user${i % 5}@test.com`,
      createdAt: new Date(Date.now() - Math.random() * 1e10).toISOString(),
      updatedAt: new Date(Date.now() - Math.random() * 1e9).toISOString(),
    })
  }
  return cards
}

export function KanbanBoard({ search }: { search: string }) {
  const {
    data: kanbanCards,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['kanbanCards'],
    queryFn: getKanbanCardDocument,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  })

  const queryClient = useQueryClient()

  const [cards, setCards] = useState<CardType[]>([])

  useEffect(() => {
    if (kanbanCards) {
      // Set the initial state of cards
      setCards(kanbanCards)
    }
  }, [kanbanCards])

  const enterKanbanCardMutation = useMutation({
    mutationFn: enterKanbanCardDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanbanCards'] })
      toast('Kanban card entered successfully!')
    },
  })

  const saveCards = () => {
    // Save cards to firestore
    enterKanbanCardMutation.mutate(cards)
  }

  useEffect(() => {
    enableDragDropTouch() // Apply polyfill for touch support
  }, [])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center w-full h-full">
        <Loader className="animate-spin" size={24} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center w-full h-full">
        Error: {error.message}
        <br />
        Press F5 to Refresh!
      </div>
    )
  }

  return (
    <div className="flex gap-3 bg-muted dark:bg-background shadow-sm p-2 rounded-lg w-full h-full overflow-y-auto text-card-foreground">
      <div className="flex flex-wrap landscape:flex-nowrap flex-[80%] landscape:gap-3 landscape:w-full landscape:h-full">
        <KanbanColumn
          title="In Stock"
          column="inStock"
          headingColor="text-blue-500"
          searchFilter={search}
          cards={cards}
          setCards={setCards}
        />
        <KanbanColumn
          title="Running Low"
          column="runningLow"
          headingColor="text-yellow-500"
          searchFilter={search}
          cards={cards}
          setCards={setCards}
        />
        <KanbanColumn
          title="Out of Stock"
          column="outOfStock"
          headingColor="text-red-600"
          searchFilter={search}
          cards={cards}
          setCards={setCards}
        />
        <KanbanColumn
          title="Restocked"
          column="restocked"
          headingColor="text-emerald-400"
          searchFilter={search}
          cards={cards}
          setCards={setCards}
        />
      </div>

      <div className="flex flex-col flex-1/5 gap-6 bg-muted dark:bg-background rounded-lg w-full h-full overflow-hidden text-card-foreground">
        <Button
          className="inline-flex items-center gap-2 px-4 py-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary text-sm transition-opacity duration-500"
          onClick={saveCards} // Save cards when button is clicked
        >
          <SaveIcon color="#ffffff" />
          {enterKanbanCardMutation.isPending ? ' Saving...' : 'Save'}
        </Button>

        <KanbanDelete setCards={setCards} />
      </div>
    </div>
  )
}

type KanbanColumnProps = {
  title: string
  headingColor: string
  cards: CardType[]
  column: ColumnType
  setCards: Dispatch<SetStateAction<CardType[]>>
  searchFilter?: string
}

const KanbanColumn = ({
  title,
  headingColor,
  cards,
  column,
  setCards,
  searchFilter,
}: KanbanColumnProps) => {
  const [active, setActive] = useState(false)
  const search = useSearch({ from: '/home/stock' })
  const category = search.category
  const { userAdditional } = useFirebaseAuth()

  const handleDragStart = (e: DragEvent, card: CardType) => {
    e.dataTransfer.setData('cardId', card.id)
  }

  const handleDragEnd = (e: DragEvent) => {
    const cardId = e.dataTransfer.getData('cardId')

    setActive(false)
    clearHighlights()

    const indicators = getIndicators()
    const { element } = getNearestIndicator(e, indicators)

    const before = element.dataset.before || '-1'

    if (before !== cardId) {
      let copy = [...cards]

      let cardToTransfer = copy.find((c) => c.id === cardId)
      if (!cardToTransfer) return

      //UPDATE METADATA WHEN EDIT
      cardToTransfer = {
        ...cardToTransfer,
        column,
        lastModifiedUid: userAdditional?.uid || '',
        lastModifiedDisplayName:
          [userAdditional?.firstName, userAdditional?.lastName]
            .filter(Boolean)
            .join(' ') || '',

        lastModifiedEmail: userAdditional?.email || '',
        updatedAt: new Date().toISOString(),
      }

      cardToTransfer = { ...cardToTransfer, column }

      copy = copy.filter((c) => c.id !== cardId)

      const moveToBack = before === '-1'

      if (moveToBack) {
        copy.push(cardToTransfer)
      } else {
        const insertAtIndex = copy.findIndex((el) => el.id === before)
        if (insertAtIndex === undefined) return

        copy.splice(insertAtIndex, 0, cardToTransfer)
      }

      setCards(copy)
    }
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    highlightIndicator(e)

    setActive(true)
  }

  const clearHighlights = (els?: HTMLElement[]) => {
    const indicators = els || getIndicators()

    indicators.forEach((i) => {
      i.style.opacity = '0'
    })
  }

  const highlightIndicator = (e: DragEvent) => {
    const indicators = getIndicators()

    clearHighlights(indicators)

    const el = getNearestIndicator(e, indicators)

    el.element.style.opacity = '1'
  }

  const getNearestIndicator = (e: DragEvent, indicators: HTMLElement[]) => {
    const DISTANCE_OFFSET = 50

    const el = indicators.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect()

        const offset = e.clientY - (box.top + DISTANCE_OFFSET)

        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child }
        } else {
          return closest
        }
      },
      {
        offset: Number.NEGATIVE_INFINITY,
        element: indicators[indicators.length - 1],
      },
    )

    return el
  }

  const getIndicators = () => {
    return Array.from(
      document.querySelectorAll(
        `[data-column="${column}"]`,
      ) as unknown as HTMLElement[],
    )
  }

  const handleDragLeave = () => {
    clearHighlights()
    setActive(false)
  }

  const handleCardUpdate = (updatedCard: CardType) => {
    setCards((prevCards) =>
      prevCards.map((c) =>
        c.id === updatedCard.id ? { ...c, ...updatedCard } : c,
      ),
    )
  }

  const scrollRef = useRef(null)

  const columnCards = cards.filter((c) => c.column === column)
  const filteredCards = columnCards.filter((card) =>
    searchFilter
      ? card.title.toLowerCase().includes(searchFilter.toLowerCase())
      : card.category === category,
  )

  const rowVirtualizer = useVirtualizer({
    count: filteredCards.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 120, // <-- adjust to average card height
    overscan: 5,
  })

  return (
    <div className="flex flex-col flex-[50%] landscape:w-full max-w-[50%] h-[50%] landscape:h-full">
      <div className="flex justify-between items-center mb-3 p-2 px-3 border-b-2">
        <h3 className={`font-medium ${headingColor}`}>{title}</h3>
        <span className="rounded text-neutral-400 text-sm">
          {filteredCards.filter((c) => c.category === category).length}
        </span>
      </div>
      <div
        ref={scrollRef}
        onDrop={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`h-full w-full p-2 overflow-y-scroll overflow-x-hidden  pr-12 transition-colors rounded ${active ? 'bg-input/100' : 'bg-black/0'}`}
      >
        <KanbanAddCard column={column} setCards={setCards} />

        {/* {filteredCards
          .filter((card) =>
            searchFilter ? card.title.toLowerCase().includes(searchFilter.toLowerCase()) : card.category === category
          )
          .map((card) => {
            return (
              <KanbanCard
                key={card.id}
                card={card}
                handleCardUpdate={handleCardUpdate}
                {...card}
                handleDragStart={handleDragStart}
              />
            );
          })} */}
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const card = filteredCards[virtualRow.index]
            return (
              <div
                key={card.id}
                ref={rowVirtualizer.measureElement}
                data-index={virtualRow.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <KanbanCard
                  card={card}
                  handleCardUpdate={handleCardUpdate}
                  {...card}
                  handleDragStart={handleDragStart}
                />
              </div>
            )
          })}
        </div>
        <KanbanDropIndicator beforeId={null} column={column} />
      </div>
    </div>
  )
}

type CardProps = {
  card: CardType
  handleCardUpdate: (updatedCard: CardType) => void
  handleDragStart: Function
}

const KanbanCard = ({ card, handleCardUpdate, handleDragStart }: CardProps) => {
  const [open, setOpen] = useState(false)
  const [itemTitle, setItemTitle] = useState(card.title)
  const [price, setPrice] = useState((card.price ?? 0).toString())
  const [selectedCategory, setSelectedCategory] =
    useState<kanbanCategory>('Kitchen')
  const getUser = useQuery({
    queryKey: ['user'],
    queryFn: getCurrentUserDocumentDetails,
  })

  return (
    <>
      <KanbanDropIndicator beforeId={card.id} column={card.column} />
      <Drawer
        shouldScaleBackground={true}
        setBackgroundColorOnScale={true}
        open={open}
        onOpenChange={setOpen}
      >
        <DrawerContent>
          <DrawerHeader className="space-y-4">
            <DrawerTitle className="self-center">Item Details</DrawerTitle>
          </DrawerHeader>

          <div className="flex flex-col gap-4 px-4 py-2">
            <div>
              <Label htmlFor="itemTitle" className="block mb-1">
                Item Name
              </Label>
              <Input
                id="itemTitle"
                value={itemTitle}
                onChange={(e) => setItemTitle(e.target.value)}
                placeholder="Enter item name"
                className="w-full"
              />
            </div>

            <div>
              <Label htmlFor="price" className="block mb-1">
                price
              </Label>
              <Input
                id="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Edit price"
                className="w-full"
              />
            </div>

            <div>
              <Label htmlFor="category" className="block mb-1">
                Category
              </Label>
              <Select
                value={selectedCategory}
                onValueChange={(value) =>
                  setSelectedCategory(value as kanbanCategory)
                }
              >
                <SelectTrigger className="mt-0 w-full" id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Kitchen">Kitchen</SelectItem>
                  <SelectItem value="Bar">Bar</SelectItem>
                  <SelectItem value="DonutStation">Donut Station</SelectItem>
                  <SelectItem value="Counter">Counter</SelectItem>
                  <SelectItem value="Bakery">Bakery</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* add immutable fields that are created information last modified information creation date last modified data */}

          <div className="gap-2 grid grid-cols-2 bg-muted/50 mt-2 p-2 rounded text-muted-foreground text-xs">
            <div>
              <div className="font-semibold">Created By</div>
              <div>{card.displayName || card.email}</div>
              <div>{new Date(card.createdAt).toLocaleString()}</div>
            </div>
            <div>
              <div className="font-semibold">Last Modified By</div>
              <div>
                {card.lastModifiedDisplayName ||
                  card.lastModifiedEmail ||
                  'unknown'}
              </div>
              <div>{new Date(card.updatedAt).toLocaleString()}</div>
            </div>
          </div>

          <DrawerFooter className="flex flex-col gap-2">
            <Button
              className="w-full"
              onClick={() => {
                handleCardUpdate({
                  ...card,
                  title: itemTitle,
                  price: Number(price),
                  category: selectedCategory,
                  lastModifiedUid: getUser.data?.uid || '',
                  lastModifiedDisplayName: getUser.data?.firstName || '',
                  lastModifiedEmail: getUser.data?.email || '',
                  updatedAt: new Date().toISOString(),
                })

                setOpen(false)
              }}
            >
              Save
            </Button>
            <DrawerClose>
              <Button variant="outline" className="w-full">
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <motion.div
        layout
        layoutId={card.id}
        draggable="true"
        onClick={() => {
          setOpen(true)
        }}
        onDragStart={(e) => {
          window.__kanbanDragging = true
          handleDragStart(e, card)
        }}
        onDragEnd={() => {
          window.__kanbanDragging = false
        }}
        className="flex flex-row gap-2 bg-card shadow-sm p-2 border rounded-lg text-card-foreground cursor-grab active:cursor-grabbing"
      >
        <div className="flex-shrink-0">
          <GripVertical color="#737373" size={24} />
        </div>
        <p className="flex-1 text-sm lg:text-lg truncate">{card.title}</p>
      </motion.div>
    </>
  )
}

type KanbanDropIndicatorProps = {
  beforeId: string | null
  column: string
}

const KanbanDropIndicator = ({
  beforeId,
  column,
}: KanbanDropIndicatorProps) => {
  return (
    <div
      data-before={beforeId || '-1'}
      data-column={column}
      className="bg-primary opacity-0 my-0.5 w-full h-0.5"
    />
  )
}

const KanbanDelete = ({
  setCards,
}: {
  setCards: Dispatch<SetStateAction<CardType[]>>
}) => {
  const [active, setActive] = useState(false)

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    setActive(true)
  }

  const handleDragLeave = () => {
    setActive(false)
  }

  const handleDragEnd = (e: DragEvent) => {
    const cardId = e.dataTransfer.getData('cardId')

    setCards((pv) => pv.filter((c) => c.id !== cardId))

    setActive(false)
  }

  return (
    <div
      onDrop={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`grid h-full place-content-center rounded border text-3xl ${
        active ? 'border-red-500/50 bg-red-500/50' : ' bg-background '
      }`}
    >
      {active ? <Trash2 className="animate-ping" /> : <Trash2 />}
    </div>
  )
}

type KanbanAddCardProps = {
  column: ColumnType
  setCards: Dispatch<SetStateAction<CardType[]>>
}

const KanbanAddCard = ({ column, setCards }: KanbanAddCardProps) => {
  const [adding, setAdding] = useState(false)
  const [text, setText] = useState('')
  const [pricing, setPricing] = useState('')
  const [selectedCategory, setSelectedCategory] =
    useState<kanbanCategory>('Kitchen') // Default category
  const getUser = useQuery({
    queryKey: ['user'],
    queryFn: getCurrentUserDocumentDetails,
  })

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!text.trim().length) return

    const priceValue = parseFloat(pricing)
    if (isNaN(priceValue)) {
      toast('Please enter a valid price.')
      return
    }

    const newCard = {
      column,
      title: text.trim(),
      price: parseFloat(pricing) || 0, // Convert pricing to a number
      category: selectedCategory, // Use the selected category
      id: Math.random().toString(),
      uid: getUser.data?.uid || '',
      displayName: getUser.data?.firstName || '',
      email: getUser.data?.email || '',
      lastModifiedUid: getUser.data?.uid || '',
      lastModifiedDisplayName: getUser.data?.firstName || '',
      lastModifiedEmail: getUser.data?.email || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setCards((pv) => [...pv, newCard])

    setAdding(false)
    setText('')
    setPricing('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit(e as any)
    } else if (e.key === 'Escape') {
      setAdding(false)
    }
  }

  return (
    <>
      {adding ? (
        <motion.form layout onSubmit={handleSubmit}>
          <Textarea
            onKeyDown={handleKeyDown}
            onChange={(e) => setText(e.target.value)}
            autoFocus
            placeholder="Add new item..."
            className="rounded w-full"
          />
          <Input
            type="number"
            min="0"
            step="10"
            value={pricing}
            onChange={(e) => setPricing(e.target.value)}
            placeholder="Pricing"
            className="mt-2 rounded w-full"
          />
          <Select
            value={selectedCategory}
            onValueChange={(value) =>
              setSelectedCategory(value as kanbanCategory)
            }
          >
            <SelectTrigger className="mt-2 w-full">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Kitchen">Kitchen</SelectItem>
              <SelectItem value="Bar">Bar</SelectItem>
              <SelectItem value="DonutStation">Donut Station</SelectItem>
              <SelectItem value="Counter">Counter</SelectItem>
              <SelectItem value="Bakery">Bakery</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex justify-end gap-1.5 p-2">
            <Button variant="outline" onClick={() => setAdding(false)}>
              <XIcon />
              <span className="hidden lg:block">Close</span>
            </Button>
            <Button type="submit">
              <Plus color="white" />
              <span className="hidden lg:block">Add</span>
            </Button>
          </div>
        </motion.form>
      ) : (
        <motion.button
          layout
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 bg-background hover:bg-accent disabled:opacity-50 px-0.5 py-1.5 border border-input rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ring-offset-background focus-visible:ring-offset-2 w-full font-medium text-xs whitespace-nowrap transition-colors text-accent-foreground hover:text-accent-foreground disabled:pointer-events-none"
        >
          <Plus />
          <span>Add card</span>
        </motion.button>
      )}
    </>
  )
}
