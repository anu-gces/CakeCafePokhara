import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { createLazyFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
// @ts-ignore
import ReceiptPrinterEncoder from '@point-of-sale/receipt-printer-encoder'
import Logo from '@/assets/Logob.webp'

export const Route = createLazyFileRoute('/home/printerConfig')({
  component: PrinterConfigComponent,
})

function loadImage(src: string) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.src = src
  })
}

async function writeChunks(
  characteristic: BluetoothRemoteGATTCharacteristic,
  data: any,
) {
  const chunkSize = 20

  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize)
    await characteristic.writeValue(chunk)
  }
}

function PrinterConfigComponent() {
  const [device, setDevice] = useState<BluetoothDevice | null>(null)
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected'>(
    'idle',
  )
  const [error, setError] = useState<string | null>(null)

  const ensureConnected = async (): Promise<BluetoothRemoteGATTServer> => {
    if (!device) {
      throw new Error('No printer selected. Please scan first.')
    }

    if (device.gatt?.connected) {
      return device.gatt
    }

    const server = await device.gatt?.connect()
    if (!server) throw new Error('Failed to reconnect to printer')

    return server
  }

  const connectPrinter = async () => {
    try {
      setStatus('connecting')
      setError(null)

      const bluetooth = navigator.bluetooth
      if (!bluetooth) throw new Error('Bluetooth not supported')

      const selectedDevice = await bluetooth.requestDevice({
        filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
        optionalServices: ['battery_service'],
      })

      const server = await selectedDevice.gatt?.connect()
      if (!server) throw new Error('GATT connection failed')
      const services = await server.getPrimaryServices()

      for (const service of services) {
        console.log(service.uuid)

        const chars = await service.getCharacteristics()
        for (const c of chars) {
          console.log(c.uuid, c.properties)
        }
      }

      setDevice(selectedDevice)
      setStatus('connected')

      selectedDevice.addEventListener('gattserverdisconnected', () => {
        setStatus('idle')
        setDevice(null)
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      setStatus('idle')
    }
  }

  const printTest = async () => {
    try {
      const server = await ensureConnected()

      const service = await server.getPrimaryService(
        '000018f0-0000-1000-8000-00805f9b34fb',
      )

      const characteristic = await service.getCharacteristic(
        '00002af1-0000-1000-8000-00805f9b34fb',
      )

      const encoder = new ReceiptPrinterEncoder({
        columns: 48,
        feedBeforeCut: 4,
        printerModel: 'pos-5890',
        printerName: 'pos-5890',
        language: 'esc-pos',
        imageMode: 'raster',
      })

      const loadedLogo = await loadImage(Logo)

      const data = encoder
        .initialize()
        .align('center')
        .image(loadedLogo, 128, 128, 'threshold')
        .bold(true)
        .text('CAKE CAFE')
        .bold(false)
        .newline()
        .text('Jwalakhel, Pokhara')
        .newline()
        .text('+977 9812345678')
        .newline()
        .rule()
        .newline()
        .table(
          [
            { width: 24, align: 'left' },
            { width: 4, align: 'center' },
            { width: 10, align: 'right' },
          ],
          [
            ['Latte', 'x1', 'Rs 180'],
            ['Croissant', 'x2', 'Rs 300'],
          ],
        )
        .rule()
        .table(
          [
            { width: 24, align: 'left' },
            { width: 4, align: 'center' },
            { width: 10, align: 'right' },
          ],
          [
            [
              'TOTAL',
              '',
              (encoder: any) => encoder.bold().text('Rs 480').bold(false),
            ],
          ],
        )
        .newline()
        .newline()
        .align('center')
        .text('Thank you for visiting <3')
        .newline()
        .text(new Date().toLocaleString())
        .cut()
        .encode()

      await writeChunks(characteristic, data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
    }
  }

  return (
    <div className="flex justify-center items-center p-8 h-full">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Printer Setup</CardTitle>
          <CardDescription>Connect and test thermal hardware.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex justify-between items-center">
            <span className="font-medium text-sm">System Status</span>
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${status === 'connected' ? 'bg-green-500' : 'bg-slate-300'}`}
              />
              <span className="font-bold text-muted-foreground text-xs uppercase">
                {status}
              </span>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 p-3 border border-destructive/20 rounded-md text-destructive text-xs">
              {error}
            </div>
          )}

          <div className="flex flex-col justify-center items-center bg-muted/30 p-6 border rounded-lg text-center">
            {device ? (
              <>
                <p className="font-mono font-bold text-primary text-sm">
                  {device.name || 'Generic Printer'}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                  Connected & Ready
                </p>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">No device paired</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <Button className="w-full" onClick={connectPrinter}>
            {status === 'connecting' ? 'Searching...' : 'Scan for Printer'}
          </Button>
          <PrinterModeToggle device={device} onError={setError} />
          <TSPLCardPrinter device={device} onError={setError} />
          <Button className="w-full" variant="outline" onClick={printTest}>
            Print Test Page
          </Button>
          <Button
            className="w-full"
            variant="ghost"
            onClick={() => setDevice(null)}
          >
            Disconnect
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

interface PrinterModeToggleProps {
  device: BluetoothDevice | null
  onError: (message: string | null) => void
}

export function PrinterModeToggle({ device, onError }: PrinterModeToggleProps) {
  const [isChanging, setIsChanging] = useState(false)

  const sendHexCommand = async (hexString: string) => {
    if (!device) {
      onError('No printer selected. Please connect first.')
      return
    }

    try {
      setIsChanging(true)
      onError(null)

      // Ensure we are connected
      if (!device.gatt?.connected) {
        await device.gatt?.connect()
      }

      const server = device.gatt
      if (!server) throw new Error('Failed to communicate with printer')

      const service = await server.getPrimaryService(
        '000018f0-0000-1000-8000-00805f9b34fb',
      )
      const characteristic = await service.getCharacteristic(
        '00002af1-0000-1000-8000-00805f9b34fb',
      )

      // Convert your space-separated hex commands into bytes
      const hexArray = hexString.trim().split(' ')
      const bytes = new Uint8Array(hexArray.map((hex) => parseInt(hex, 16)))

      // Write in chunks of 100 bytes
      const chunkSize = 100
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.slice(i, i + chunkSize)
        await characteristic.writeValue(chunk)
      }

      console.log('Command sent successfully')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      onError(`Failed to change mode: ${message}`)
    } finally {
      setIsChanging(false)
    }
  }

  const isDisabled = !device || isChanging

  return (
    <div className="flex gap-2 mt-2 w-full">
      <Button
        className="flex-1 text-xs"
        disabled={isDisabled}
        onClick={() => sendHexCommand('1F 1B 1F 02 20 31 0D 0A')}
      >
        {isChanging ? 'Setting...' : 'Thermal Receipt Mode'}
      </Button>
      <Button
        className="flex-1 text-xs"
        disabled={isDisabled}
        onClick={() => sendHexCommand('1F 1B 1F 02 20 30 0D 0A')}
      >
        {isChanging ? 'Setting...' : 'Barcode Label Mode'}
      </Button>
    </div>
  )
}

interface TSPLCardProps {
  device: BluetoothDevice | null
  onError: (message: string | null) => void
}

export function TSPLCardPrinter({ device, onError }: TSPLCardProps) {
  const [isPrinting, setIsPrinting] = useState(false)

  const generateTsplLabel = (item: string, price: string, barcode: string) => {
    const command =
      `SIZE 58 mm,40 mm\r\n` +
      `GAP 3 mm,0 mm\r\n` +
      `CLS\r\n` +
      `BOX 10,10,400,300,4\r\n` + // Draws a border box frame
      `TEXT 30,40,"4",0,1,1,"${item}"\r\n` +
      `TEXT 30,100,"3",0,1,1,"PRICE: ${price}"\r\n` +
      `BARCODE 30,160,"128",60,1,0,2,2,"${barcode}"\r\n` + // Hardware generated barcode
      `PRINT 1,1\r\n`

    return new TextEncoder().encode(command)
  }

  const handlePrint = async () => {
    if (!device) {
      onError('Connect the printer first.')
      return
    }

    try {
      setIsPrinting(true)
      onError(null)

      if (!device.gatt?.connected) {
        await device.gatt?.connect()
      }

      const server = device.gatt
      if (!server) throw new Error('Failed to connect to printer')

      const service = await server.getPrimaryService(
        '000018f0-0000-1000-8000-00805f9b34fb',
      )
      const characteristic = await service.getCharacteristic(
        '00002af1-0000-1000-8000-00805f9b34fb',
      )

      // Generate the raw TSPL label payload bytes
      const bytes = generateTsplLabel(
        'Latte & Croissant',
        'Rs 480',
        'CAFE-480X',
      )

      // Stream the raw layout buffer down the wire in chunks
      const chunkSize = 100
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.slice(i, i + chunkSize)
        await characteristic.writeValue(chunk)
      }

      console.log('TSPL barcode label sent successfully')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      onError(`TSPL Error: ${message}`)
    } finally {
      setIsPrinting(false)
    }
  }

  return (
    <Button
      className="w-full text-xs"
      variant="outline"
      disabled={!device || isPrinting}
      onClick={handlePrint}
    >
      {isPrinting ? 'Printing Label...' : 'Print Custom TSPL Label'}
    </Button>
  )
}
