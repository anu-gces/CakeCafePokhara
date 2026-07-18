// @ts-ignore
import ReceiptPrinterEncoder from '@point-of-sale/receipt-printer-encoder'
import Logo from '@/assets/Logob.webp'
import type { Doc } from '../../convex/_generated/dataModel'

const PRINTER_SERVICE_UUID = '000018f0-0000-1000-8000-00805f9b34fb'
const PRINTER_CHARACTERISTIC_UUID = '00002af1-0000-1000-8000-00805f9b34fb'
const CHUNK_SIZE = 512

let cachedDevice: BluetoothDevice | null = null

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

async function writeChunks(
  characteristic: BluetoothRemoteGATTCharacteristic,
  data: Uint8Array,
) {
  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    await characteristic.writeValue(data.slice(i, i + CHUNK_SIZE))
  }
}

type ReceiptItem = Pick<
  Doc<'orderItems'>,
  'name' | 'quantity' | 'price' | 'notes' | 'isComplimentary'
> & {
  itemStatus?: Doc<'orderItems'>['itemStatus']
}

export type ReceiptPayload = Pick<
  Doc<'orderTickets'>,
  | 'kotNumber'
  | 'tableNumber'
  | 'orderType'
  | 'orderDate'
  | 'payLaterCustomerId'
  | 'subTotal'
  | 'totalDiscount'
  | 'taxAmount'
  | 'deliveryCharge'
  | 'totalAmount'
> & {
  items: ReceiptItem[]
  processedBy?: string
}

const money = (amount: number) => `Rs ${amount.toFixed(2)}`

const COLUMNS = [
  { width: 24, align: 'left' as const },
  { width: 4, align: 'center' as const },
  { width: 10, align: 'right' as const },
]

export async function buildReceiptData(payload: ReceiptPayload) {
  const encoder = new ReceiptPrinterEncoder({
    columns: 48,
    feedBeforeCut: 4,
    printerModel: 'pos-5890',
    printerName: 'pos-5890',
    language: 'esc-pos',
    imageMode: 'raster',
  })

  const logo = await loadImage(Logo)
  const date = payload.orderDate ? new Date(payload.orderDate) : new Date()

  const printableItems = payload.items.filter(
    (item) => item.itemStatus !== 'cancelled',
  )

  let b = encoder
    .initialize()
    .align('center')
    .image(logo, 128, 128, 'threshold')
    .bold(true)
    .text('CAKE CAFE')
    .bold(false)
    .newline()
    .text('Jwalakhel-8, Pokhara')
    .newline()
    .text('+977 9802852020')
    .newline()
    .text('+977 9801552022')
    .newline()
    .rule()
    .align('left')

  if (payload.orderType) {
    b = b.text(`Type: ${payload.orderType.toUpperCase()}`).newline()
  }
  if (payload.tableNumber !== undefined) {
    b = b.text(`Table: ${payload.tableNumber}`).newline()
  }
  if (payload.kotNumber) {
    b = b.text(`KOT: ${payload.kotNumber}`).newline()
  }
  if (payload.processedBy) {
    b = b.text(`Processed By: ${payload.processedBy.toUpperCase()}`).newline()
  }
  b = b.text(date.toLocaleString()).newline().rule()

  const itemRows = printableItems.map((item) => [
    item.name + (item.isComplimentary ? ' [COMP]' : ''),
    `x${item.quantity}`,
    item.isComplimentary ? money(0) : money(item.quantity * item.price),
  ])

  b = b.table(COLUMNS, itemRows).rule()

  const totalRows: Array<Array<string | ((enc: any) => any)>> = [
    ['Sub Total', '', money(payload.subTotal)],
  ]
  if (payload.totalDiscount) {
    totalRows.push(['Discount', '', `-${money(payload.totalDiscount)}`])
  }
  if (payload.taxAmount) {
    totalRows.push(['Tax', '', `+${money(payload.taxAmount)}`])
  }
  if (payload.deliveryCharge) {
    totalRows.push(['Delivery Fee', '', `+${money(payload.deliveryCharge)}`])
  }
  totalRows.push([
    'TOTAL',
    '',
    (enc: any) => enc.bold().text(money(payload.totalAmount)).bold(false),
  ])

  b = b.table(COLUMNS, totalRows)

  if (payload.payLaterCustomerId) {
    b = b
      .newline()
      .text(`Pay Later Customer: ${payload.payLaterCustomerId}`)
      .newline()
  }

  return b
    .newline()
    .align('center')
    .text('Thank you for visiting <3')
    .newline()
    .text(date.toLocaleString())
    .cut()
    .encode()
}

export async function connectPrinter(): Promise<string> {
  const bluetooth = navigator.bluetooth
  if (!bluetooth) throw new Error('Bluetooth not supported')

  const device = await bluetooth.requestDevice({
    filters: [{ services: [PRINTER_SERVICE_UUID] }],
    optionalServices: ['battery_service'],
  })

  device.addEventListener('gattserverdisconnected', () => {})

  await device.gatt?.connect()
  cachedDevice = device

  return device.name || 'Printer'
}

export function isPrinterPaired() {
  return cachedDevice !== null
}

export function disconnectPrinter() {
  cachedDevice?.gatt?.disconnect()
  cachedDevice = null
}

export async function printReceipt(payload: ReceiptPayload) {
  if (!cachedDevice) {
    throw new Error('Printer not connected. Tap "Connect Printer" first.')
  }

  const server = cachedDevice.gatt?.connected
    ? cachedDevice.gatt
    : await cachedDevice.gatt?.connect()

  if (!server) {
    throw new Error('Could not reach printer. Try reconnecting.')
  }

  const service = await server.getPrimaryService(PRINTER_SERVICE_UUID)
  const characteristic = await service.getCharacteristic(
    PRINTER_CHARACTERISTIC_UUID,
  )

  const data = await buildReceiptData(payload)
  await writeChunks(characteristic, data)
}
