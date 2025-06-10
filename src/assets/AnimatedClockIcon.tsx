import { type SVGProps } from 'react'
const AnimatedClockIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-rose-600 animate-[spin_60s_linear_infinite]"
    {...props}
  >
    <circle cx={12} cy={12} r={10} stroke="currentColor" fill="none" />
    <line x1={12} y1={12} x2={12} y2={7} stroke="currentColor" strokeWidth={2}>
      <animateTransform
        attributeName="transform"
        type="rotate"
        from="0 12 12"
        to="360 12 12"
        dur="9s"
        repeatCount="indefinite"
      />
    </line>
    <line
      x1={12}
      y1={12}
      x2={12}
      y2={5}
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <animateTransform
        attributeName="transform"
        type="rotate"
        from="0 12 12"
        to="360 12 12"
        dur="0.75s"
        repeatCount="indefinite"
      />
    </line>
  </svg>
)
export default AnimatedClockIcon
