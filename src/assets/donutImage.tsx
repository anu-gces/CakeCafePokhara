const DonutImage: React.FC<React.SVGProps<SVGSVGElement>> = ({
	height = "100%",
	width = "100%",
}) => {
	return (
		<svg viewBox="0 0 108 108" width={width} height={height}>
			<ellipse
				cx="54.5"
				cy="54"
				fill="#FFF"
				stroke="#ffb8d0"
				rx="45.5"
				ry="42"
			></ellipse>
			<circle cx="57.5" cy="53.5" r="19.5" fill="#FFF"></circle>
			<path
				fill="#ffb8d0"
				d="M57.5 35C67.701 35 76 43.299 76 53.5S67.701 72 57.5 72 39 63.701 39 53.5 47.299 35 57.5 35m0-2C46.178 33 37 42.178 37 53.5S46.178 74 57.5 74 78 64.822 78 53.5 68.822 33 57.5 33"
			></path>
			<path
				fill="#FFF"
				d="M51 96C27.841 96 9 77.159 9 54s18.841-42 42-42 42 18.841 42 42-18.841 42-42 42m0-61c-10.477 0-19 8.523-19 19s8.523 19 19 19 19-8.523 19-19-8.523-19-19-19"
			></path>
			<path
				fill="#ffb8d0"
				d="M51 13c22.607 0 41 18.393 41 41S73.607 95 51 95 10 76.607 10 54s18.393-41 41-41m0 61c11.028 0 20-8.972 20-20s-8.972-20-20-20-20 8.972-20 20 8.972 20 20 20m0-63C27.25 11 8 30.25 8 54s19.25 43 43 43 43-19.25 43-43-19.25-43-43-43m0 61c-9.94 0-18-8.06-18-18s8.06-18 18-18 18 8.06 18 18-8.06 18-18 18"
			></path>
			<g fill="#FFF">
				<path stroke="#ffb8d0" d="M53.5 26.5l5-7"></path>
				<path stroke="#e11d48" d="M67.991 32.77l8.018 6.46"></path>
				<path stroke="#2563EB" d="M74.852 65.301l8.296-4.602"></path>
				<path stroke="#F97316" d="M61.964 77.107l9.072 5.286"></path>
				<path stroke="#16A34A" d="M42.612 79.393l-5 7"></path>
				<path stroke="#FACC15" d="M30.121 73.123l-8.018-6.459"></path>
				<path stroke="#7C3AED" d="M26.26 46.593l-8.296 4.601"></path>
				<path stroke="#e11d48" d="M37.148 31.787L28.076 26.5"></path>
			</g>
		</svg>
	);
};

export default DonutImage;
