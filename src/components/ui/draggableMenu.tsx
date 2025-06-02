import {
	type PanInfo,
	motion,
	useAnimation,
	useMotionValue,
	useMotionValueEvent,
	useTransform,
} from "motion/react";
import { useRef, useState } from "react";

const menuItems = [
	"Eero Aarnio Ball Chair",
	"Verner Panton Chair",
	"Eero Saarinen Tulip Table",
	"Arne Jacobsen Egg Chair",
	"Joe Colombo Elda Chair",
	"Olivier Mourgue Djinn Chairs",
	"Pierre Paulin Orange Slice Chair",
	"George Nelson Coconut Chair",
	"Isamu Noguchi Coffee Table",
	"Warren Platner Coffee Table",
	"Marc Newson Lockheed Lounge",
	"Vitra Eames Lounge Chair",
	"Mario Bellini Camaleonda Sofa",
	"Eero Aarnio Pastil Chair",
	"Pierre Cardin Dining Table",
	"Marcel Breuer Wassily Chair",
	"Alvar Aalto Savoy Vase",
	"Le Corbusier LC4 Chaise Longue",
	"Eileen Gray Bibendum Chair",
	"Charles and Ray Eames Molded Plastic Chair",
	"Olivetti Synthesis Office Chair",
	"Giancarlo Piretti Plia Chair",
	"Rodolfo Bonetto Boomerang Desk",
	"Richard Sapper Tizio Lamp",
	"Vico Magistretti Maralunga Sofa",
	"Peter Ghyczy Garden Egg Chair",
	"Paulin Globe Chair",
	"Luigi Colani Rotor Table",
	"Ross Lovegrove Go Chair",
	"Ron Arad Well Tempered Chair",
];

const angleIncrement = 360 / menuItems.length;
const dragFactor = 0.01;

export default function DraggableCurvedMenu() {
	const controls = useAnimation();
	const rotation = useMotionValue(0);
	const containerRef = useRef<HTMLDivElement>(null);
	const [middleItem, setMiddleItem] = useState(menuItems[0]);

	useMotionValueEvent(rotation, "change", (value) => {
		const adjustedRotation = ((value % 360) + 360) % 360;
		const middleIndex =
			Math.round(adjustedRotation / angleIncrement) % menuItems.length;
		const actualMiddleItem =
			menuItems[(menuItems.length - middleIndex) % menuItems.length];
		setMiddleItem(actualMiddleItem);
	});

	const onDrag = (_: any, info: PanInfo) => {
		const currentRotation = rotation.get() + info.offset.y * dragFactor;

		rotation.set(currentRotation);
	};

	const onDragEnd = (_: any, info: PanInfo) => {
		const endRotation = rotation.get() + info.velocity.y * dragFactor;
		controls.start({
			rotate: endRotation,
			transition: { type: "spring", mass: 0.1 },
		});
	};

	const transform = useTransform(rotation, (value) => {
		return `rotate(${value}deg)`;
	});

	return (
		<div
			className="relative flex justify-center items-center w-full h-[500px] overflow-hidden"
			ref={containerRef}
		>
			<div className="top-0 left-0 z-50 absolute bg-neutral-100 dark:bg-neutral-900 to-transparent backdrop-blur-xl w-full h-32 pointer-events-none [-webkit-mask-image:linear-gradient(to_bottom,black,transparent)]"></div>
			<motion.div
				className="relative flex justify-center items-center -ml-[800px] w-[1000px] h-[1000px] cursor-grab active:cursor-grabbing"
				animate={controls}
				style={{
					transformOrigin: "center center",
					transform,
					rotate: rotation,
				}}
				drag="y"
				onDrag={onDrag}
				onDragEnd={onDragEnd}
			>
				{menuItems.map((item, index) => {
					const rotate = angleIncrement * index;

					return (
						<motion.div
							key={`${item}-${index}`}
							className={`absolute ${
								item === middleItem
									? "text-mauve-light-12 dark:text-mauve-dark-12"
									: "text-mauve-light-12/30 dark:text-mauve-dark-12/30"
							} transition-colors duration-150`}
							style={{
								left: "50%",
								transform: `rotate(${rotate}deg) translateX(300px)`,
								transformOrigin: "left center",
							}}
						>
							{item}
						</motion.div>
					);
				})}
			</motion.div>
			<div className="bottom-0 left-0 z-50 absolute bg-neutral-100 dark:bg-neutral-900 to-transparent backdrop-blur-xl w-full h-32 pointer-events-none [-webkit-mask-image:linear-gradient(to_top,black,transparent)]"></div>
		</div>
	);
}
