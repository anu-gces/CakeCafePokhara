import React, {
  useState,
  Children,
  useRef,
  useLayoutEffect,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { motion, AnimatePresence, type Variants } from 'motion/react'
import { cn } from '@/lib/utils'
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react'

interface StepperProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  initialStep?: number
  onStepChange?: (step: number) => void
  onFinalStepCompleted?: () => void
  stepCircleContainerClassName?: string
  stepContainerClassName?: string
  contentClassName?: string
  footerClassName?: string
  backButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>
  nextButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>
  backButtonText?: string
  nextButtonText?: string
  disableStepIndicators?: boolean
  renderStepIndicator?: (props: {
    step: number
    currentStep: number
    onStepClick: (clicked: number) => void
  }) => ReactNode
}

export default function Stepper({
  children,
  initialStep = 1,
  onStepChange = () => {},
  onFinalStepCompleted = () => {},
  stepCircleContainerClassName = '',
  stepContainerClassName = '',
  contentClassName = '',
  footerClassName = '',
  backButtonProps = {},
  nextButtonProps = {},
  backButtonText = 'Back',
  nextButtonText = 'Continue',
  disableStepIndicators = false,
  renderStepIndicator,
  ...rest
}: StepperProps) {
  const [currentStep, setCurrentStep] = useState<number>(initialStep)
  const [direction, setDirection] = useState<number>(0)
  const stepsArray = Children.toArray(children)
  const totalSteps = stepsArray.length
  const isCompleted = currentStep > totalSteps
  const isLastStep = currentStep === totalSteps

  const updateStep = (newStep: number) => {
    setCurrentStep(newStep)
    if (newStep > totalSteps) {
      onFinalStepCompleted()
    } else {
      onStepChange(newStep)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1)
      updateStep(currentStep - 1)
    }
  }

  const handleNext = () => {
    if (!isLastStep) {
      setDirection(1)
      updateStep(currentStep + 1)
    }
  }

  const handleComplete = () => {
    onFinalStepCompleted()
  }

  return (
    <div
      className={cn(
        'flex flex-col mx-auto w-full max-w-7xl h-full min-h-0',
        rest.className,
      )}
      {...rest}
    >
      <div className={`w-full shrink-0 ${stepCircleContainerClassName}`}>
        <div
          className={`${stepContainerClassName} flex w-full items-center p-8`}
        >
          {stepsArray.map((_, index) => {
            const stepNumber = index + 1
            const isNotLastStep = index < totalSteps - 1
            return (
              <React.Fragment key={stepNumber}>
                {renderStepIndicator ? (
                  renderStepIndicator({
                    step: stepNumber,
                    currentStep,
                    onStepClick: (clicked) => {
                      setDirection(clicked > currentStep ? 1 : -1)
                      updateStep(clicked)
                    },
                  })
                ) : (
                  <StepIndicator
                    step={stepNumber}
                    disableStepIndicators={disableStepIndicators}
                    currentStep={currentStep}
                    onClickStep={(clicked) => {
                      setDirection(clicked > currentStep ? 1 : -1)
                      updateStep(clicked)
                    }}
                  />
                )}
                {isNotLastStep && (
                  <StepConnector isComplete={currentStep > stepNumber} />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* 2. ISOLATED SCROLLABLE WRAPPER FOR STEP CONTENT ONLY */}
      <div className="flex-1 w-full min-h-0 overflow-y-auto">
        <StepContentWrapper
          isCompleted={isCompleted}
          currentStep={currentStep}
          direction={direction}
          className={`space-y-2 px-8 w-full ${contentClassName}`}
        >
          {stepsArray[currentStep - 1]}
        </StepContentWrapper>
      </div>

      {/* 3. STICKY FOOTER ACTIONS */}
      <div
        className={`px-8 pb-8  shrink-0 mt-auto pt-4 bg-background z-10 ${footerClassName}`}
      >
        <div className="flex justify-between items-center w-full">
          <button
            onClick={handleBack}
            className={`duration-350 rounded px-2 py-1 transition text-neutral-400 hover:text-neutral-700 ${
              currentStep === 1 ? 'invisible pointer-events-none' : 'visible'
            }`}
            {...backButtonProps}
          >
            <span className="flex justify-center items-center gap-1.5 w-full whitespace-nowrap">
              <ArrowLeftIcon className="stroke-neutral-400 w-4 h-4 shrink-0" />
              {backButtonText}
            </span>
          </button>

          <button
            onClick={isLastStep ? handleComplete : handleNext}
            {...nextButtonProps}
          >
            {isLastStep ? (
              <span className="flex justify-center items-center gap-1.5 w-full whitespace-nowrap">
                <CheckIcon className="stroke-white w-4 h-4 shrink-0" /> Complete
              </span>
            ) : (
              <span className="flex justify-center items-center gap-1.5 w-full whitespace-nowrap">
                {nextButtonText}
                <ArrowRightIcon className="stroke-white w-4 h-4 shrink-0" />
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

interface StepContentWrapperProps {
  isCompleted: boolean
  currentStep: number
  direction: number
  children: ReactNode
  className?: string
}

function StepContentWrapper({
  isCompleted,
  currentStep,
  direction,
  children,
  className = '',
}: StepContentWrapperProps) {
  const [parentHeight, setParentHeight] = useState<number>(0)

  return (
    <motion.div
      style={{ position: 'relative', overflow: 'hidden' }}
      animate={{ height: isCompleted ? 0 : parentHeight }}
      transition={{ type: 'spring', duration: 0.4 }}
      className={className}
    >
      <AnimatePresence initial={false} mode="sync" custom={direction}>
        {!isCompleted && (
          <SlideTransition
            key={currentStep}
            direction={direction}
            onHeightReady={(h) => setParentHeight(h)}
          >
            {children}
          </SlideTransition>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

interface SlideTransitionProps {
  children: ReactNode
  direction: number
  onHeightReady: (height: number) => void
}

function SlideTransition({
  children,
  direction,
  onHeightReady,
}: SlideTransitionProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    if (containerRef.current) {
      onHeightReady(containerRef.current.offsetHeight)
    }
  }, [children, onHeightReady])

  return (
    <motion.div
      ref={containerRef}
      custom={direction}
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.4 }}
      style={{ position: 'absolute', left: 0, right: 0, top: 0 }}
    >
      {children}
    </motion.div>
  )
}

const stepVariants: Variants = {
  enter: (dir: number) => ({
    x: dir >= 0 ? '-100%' : '100%',
    opacity: 0,
  }),
  center: {
    x: '0%',
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir >= 0 ? '50%' : '-50%',
    opacity: 0,
  }),
}

interface StepProps {
  children: ReactNode
}

export function Step({ children }: StepProps) {
  return <div className="px-8">{children}</div>
}

interface StepIndicatorProps {
  step: number
  currentStep: number
  onClickStep: (clicked: number) => void
  disableStepIndicators?: boolean
}

function StepIndicator({
  step,
  currentStep,
  onClickStep,
  disableStepIndicators = false,
}: StepIndicatorProps) {
  const status =
    currentStep === step
      ? 'active'
      : currentStep < step
        ? 'inactive'
        : 'complete'

  const handleClick = () => {
    if (step !== currentStep && !disableStepIndicators) {
      onClickStep(step)
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`relative outline-none focus:outline-none ${
        disableStepIndicators
          ? 'pointer-events-none opacity-50'
          : 'cursor-pointer'
      }`}
    >
      <div
        className={`flex justify-center items-center rounded-full w-8 h-8 font-semibold transition-transform duration-300 ${
          status === 'inactive'
            ? 'bg-muted text-muted-foreground'
            : 'bg-primary text-primary-foreground'
        }`}
      >
        {status === 'complete' ? (
          <CheckIcon className="w-4 h-4 text-current" />
        ) : status === 'active' ? (
          <div className="bg-current rounded-full w-2.5 h-2.5" />
        ) : (
          <span className="text-sm">{step}</span>
        )}
      </div>
    </div>
  )
}

interface StepConnectorProps {
  isComplete: boolean
}

function StepConnector({ isComplete }: StepConnectorProps) {
  const lineVariants: Variants = {
    incomplete: { width: 0, backgroundColor: 'transparent' },
    complete: { width: '100%', backgroundColor: '#E11D48' },
  }

  return (
    <div className="relative flex-1 bg-foreground/30 mx-2 rounded h-0.5 overflow-hidden">
      <motion.div
        className="top-0 left-0 absolute h-full"
        variants={lineVariants}
        initial={false}
        animate={isComplete ? 'complete' : 'incomplete'}
        transition={{ duration: 0.4 }}
      />
    </div>
  )
}

interface CheckIconProps extends React.SVGProps<SVGSVGElement> {}

function CheckIcon(props: CheckIconProps) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <motion.path
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{
          delay: 0.1,
          type: 'tween',
          ease: 'easeOut',
          duration: 0.3,
        }}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  )
}
