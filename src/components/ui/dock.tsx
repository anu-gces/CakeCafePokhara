import { cn } from "@/lib/utils";
import { type VariantProps, cva } from "class-variance-authority";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import React, { type PropsWithChildren, useRef } from "react";

export interface DockProps extends VariantProps<typeof dockVariants> {
	className?: string;
	magnification?: number;
	distance?: number;
	children: React.ReactNode;
}

const DEFAULT_MAGNIFICATION = 60;
const DEFAULT_DISTANCE = 140;

const dockVariants = cva(
	"flex items-end gap-2 bg-transparent hover:bg-white dark:hover:bg-stone-950 hover:bg-opacity-100 opacity-50 hover:opacity-100 mx-auto mt-8 p-2 border dark:border-[#707070] rounded-2xl w-max h-[58px] transition-opacity duration-500",
);

const Dock = React.forwardRef<HTMLDivElement, DockProps>(
	(
		{
			className,
			children,
			magnification = DEFAULT_MAGNIFICATION,
			distance = DEFAULT_DISTANCE,
			...props
		},
		ref,
	) => {
		const mouseX = useMotionValue(Number.POSITIVE_INFINITY);

		const renderChildren = () => {
			return React.Children.map(children, (child: any) => {
				return React.cloneElement(child, {
					mouseX: mouseX,
					magnification: magnification,
					distance: distance,
				});
			});
		};

		return (
			<motion.div
				ref={ref}
				onMouseMove={(e) => mouseX.set(e.pageX)}
				onMouseLeave={() => mouseX.set(Number.POSITIVE_INFINITY)}
				{...props}
				className={cn(dockVariants({ className }), className)}
			>
				{renderChildren()}
			</motion.div>
		);
	},
);

Dock.displayName = "Dock";

export interface DockIconProps {
	size?: number;
	magnification?: number;
	distance?: number;
	mouseX?: any;
	className?: string;
	children?: React.ReactNode;
	props?: PropsWithChildren;
}

const DockIcon = ({
	size,
	magnification = DEFAULT_MAGNIFICATION,
	distance = DEFAULT_DISTANCE,
	mouseX,
	className,
	children,
	...props
}: DockIconProps) => {
	const ref = useRef<HTMLDivElement>(null);

	const distanceCalc = useTransform(mouseX, (val: number) => {
		const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };

		return val - bounds.x - bounds.width / 2;
	});

	const widthSync = useTransform(
		distanceCalc,
		[-distance, 0, distance],
		[40, magnification, 40],
	);

	const width = useSpring(widthSync, {
		mass: 0.1,
		stiffness: 150,
		damping: 12,
	});

	return (
		<motion.div
			ref={ref}
			style={{ width }}
			className={cn(
				"flex aspect-square cursor-pointer items-center justify-center rounded-full bg-neutral-400/40",
				className,
			)}
			{...props}
		>
			{children}
		</motion.div>
	);
};

DockIcon.displayName = "DockIcon";

export { Dock, DockIcon, dockVariants };
