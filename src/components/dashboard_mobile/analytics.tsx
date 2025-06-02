import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
	Area,
	AreaChart,
	CartesianGrid,
	Cell,
	Legend,
	Line,
	LineChart,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import { useQuery } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import { formatCompactNumber, groupDataByMonth } from "./analytics.utils";

export interface RevenueData {
	timestamp: string;
	income: number;
	expenditure: number;
}

export function AnalyticsLineChart({ data }: { data: RevenueData[] }) {
	return (
		<ResponsiveContainer width="100%" height={400} className=" ">
			<LineChart data={data} margin={{ right: 12, left: 12 }}>
				<XAxis
					dataKey="timestamp"
					stroke="#888888"
					fontSize={12}
					tickLine={true}
					axisLine={true}
					minTickGap={0}
				/>
				<YAxis
					stroke="#888888"
					fontSize={12}
					tickLine={true}
					axisLine={true}
					tickFormatter={formatCompactNumber}
					width={20}
				/>
				<Tooltip />
				<CartesianGrid stroke="#ccc" strokeWidth={1} strokeDasharray="5 5" />
				<Legend align="right" verticalAlign="top" />

				<Line
					type="linear"
					dataKey="income"
					stroke="#16a34a"
					activeDot={{ r: 8 }}
					dot={true}
				/>
				<Line
					type="linear"
					dataKey="expenditure"
					stroke="#e11d48"
					activeDot={{ r: 8 }}
					dot={true}
				/>
			</LineChart>
		</ResponsiveContainer>
	);
}

export function AnalyticsAreaChart({ data }: { data: RevenueData[] }) {
	return (
		<ResponsiveContainer width="100%" height={400}>
			<AreaChart data={data} margin={{ right: 12, left: 12 }}>
				<defs>
					<linearGradient id="expenditureGradient" x1="0" y1="0" x2="0" y2="1">
						<stop offset="5%" stopColor="#e11d48" stopOpacity={0.8} />
						<stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
					</linearGradient>
					<linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
						<stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
						<stop offset="95%" stopColor="#10B981" stopOpacity={0} />
					</linearGradient>
				</defs>
				<XAxis
					dataKey="timestamp"
					stroke="#888888"
					fontSize={12}
					tickLine={true}
					axisLine={true}
				/>
				<YAxis
					stroke="#888888"
					fontSize={12}
					tickLine={true}
					axisLine={true}
					tickFormatter={formatCompactNumber}
					width={20}
				/>
				<Tooltip />
				<CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
				<Legend align="right" verticalAlign="top" />

				<Area
					type="natural"
					dataKey="income"
					stroke="#10B981"
					fill="url(#incomeGradient)"
					dot={{ r: 4 }}
					activeDot={{ r: 8 }}
				/>
				<Line
					type="natural"
					dataKey="income"
					stroke="#10B981"
					isAnimationActive={true}
				/>

				<Area
					type="natural"
					dataKey="expenditure"
					stroke="#e11d48"
					fill="url(#expenditureGradient)"
					dot={{ r: 4 }}
					activeDot={{ r: 8 }}
				/>
				<Line type="natural" dataKey="expenditure" stroke="#e11d48" />
			</AreaChart>
		</ResponsiveContainer>
	);
}

const pieData = [
	{ name: "Beverages", value: 400 },
	{ name: "Appetizers", value: 300 },
	{ name: "Main Courses", value: 500 },
	{ name: "Desserts", value: 200 },
	{ name: "Salads", value: 250 },
	{ name: "Soups", value: 350 },
	{ name: "Sides", value: 300 },
	{ name: "Specials", value: 450 },
];

const COLORS = [
	"#FFC1C1", // Light rose
	"#FFB2B2", // Rose
	"#FFA3A3", // Slightly darker rose
	"#FF9494", // Even darker rose
	"#FFD7A0", // Light orange
	"#D1FFA0", // Light green
	"#A0C4FF", // Light blue
];
// Pie chart component
function AnalyticsPieChart() {
	return (
		<ResponsiveContainer width="100%" height={400}>
			<PieChart>
				<Pie
					dataKey="value"
					data={pieData}
					cx="50%"
					cy="50%"
					outerRadius={110}
					innerRadius={75}
					fill="#8884d8"
					label
				>
					{/* used to be entry variable */}
					{pieData.map((_, index) => (
						<Cell
							key={`cell-${index}`}
							fill={COLORS[index % COLORS.length]}
							className="rounded focus:outline-3 focus:outline-rose-500"
						/>
					))}
				</Pie>
				<Tooltip />
			</PieChart>
		</ResponsiveContainer>
	);
}

// const mockDataSample5: RevenueData[] = [
//   { timestamp: "2024-01-05T01:23:45Z", income: 3800, expenditure: 600 },
//   { timestamp: "2024-01-15T05:48:45Z", income: 2100, expenditure: 800 },
//   { timestamp: "2024-01-25T10:34:56Z", income: 2400, expenditure: 1000 },
//   // ... other data for 2024

//   { timestamp: "2025-01-05T01:23:45Z", income: 1800, expenditure: 600 },
//   { timestamp: "2025-01-15T05:48:45Z", income: 2100, expenditure: 800 },
//   { timestamp: "2025-01-25T10:34:56Z", income: 2000, expenditure: 100 },
//   // ... other data for 2025

//   { timestamp: "2026-01-05T01:23:45Z", income: 6800, expenditure: 900 },
//   { timestamp: "2026-01-15T05:48:45Z", income: 6500, expenditure: 700 },
//   { timestamp: "2026-01-25T10:34:56Z", income: 6500, expenditure: 1200 },
//   // ... other data for 2026
// ];

export function Analytics() {
	// const { from, to } = dashboardRoute.useSearch(); //from means the start date and to means the end date

	//assume that we made mock database calls to get the data

	//Assume user chose the range of dates from 2024-05-03 to 2024-05-03
	// const mockData: RevenueData[] = [
	//   { timestamp: "2024-05-03T01:23:45Z", income: 1800, expenditure: 600 },
	//   { timestamp: "2024-05-03T01:48:45Z", income: 1800, expenditure: 600 },

	//   { timestamp: "2024-05-03T02:34:56Z", income: 4100, expenditure: 1000 },
	//   { timestamp: "2024-05-03T03:45:01Z", income: 5200, expenditure: 8400 },
	//   { timestamp: "2024-05-03T04:56:12Z", income: 3700, expenditure: 3300 },
	//   { timestamp: "2024-05-03T05:01:23Z", income: 4000, expenditure: 5100 },
	//   { timestamp: "2024-05-03T06:12:34Z", income: 4300, expenditure: 1900 },
	//   { timestamp: "2024-05-03T07:23:45Z", income: 6600, expenditure: 3800 },
	//   { timestamp: "2024-05-03T08:34:56Z", income: 6900, expenditure: 2700 },
	//   { timestamp: "2024-05-03T09:45:01Z", income: 7200, expenditure: 1300 },
	//   { timestamp: "2024-05-03T10:56:12Z", income: 7500, expenditure: 5600 },
	//   { timestamp: "2024-05-03T11:01:23Z", income: 7800, expenditure: 2900 },
	//   { timestamp: "2024-05-03T12:12:34Z", income: 8100, expenditure: 4200 },
	//   // ... add more data if needed
	// ];

	// const mockDataSample2: RevenueData[] = [
	//   { timestamp: "2024-05-01T01:23:45Z", income: 1800, expenditure: 600 },
	//   { timestamp: "2024-05-02T05:48:45Z", income: 2100, expenditure: 800 },
	//   { timestamp: "2024-05-03T10:34:56Z", income: 2400, expenditure: 1000 },
	//   { timestamp: "2024-05-04T15:45:01Z", income: 2700, expenditure: 1200 },
	//   { timestamp: "2024-05-05T20:56:12Z", income: 3000, expenditure: 1400 },
	//   { timestamp: "2024-05-06T01:23:45Z", income: 3300, expenditure: 1600 },
	//   { timestamp: "2024-05-07T05:48:45Z", income: 3600, expenditure: 1800 },
	//   { timestamp: "2024-05-01T10:34:56Z", income: 3900, expenditure: 2000 },
	//   { timestamp: "2024-05-02T15:45:01Z", income: 4200, expenditure: 2200 },
	//   { timestamp: "2024-05-03T20:56:12Z", income: 4500, expenditure: 2400 },
	// ];

	// const mockDataSample3: RevenueData[] = [
	//   { timestamp: "2024-05-01T01:23:45Z", income: 1800, expenditure: 600 },
	//   { timestamp: "2024-05-02T05:48:45Z", income: 2100, expenditure: 800 },
	//   { timestamp: "2024-05-03T10:34:56Z", income: 2400, expenditure: 1000 },
	//   { timestamp: "2024-05-04T15:45:01Z", income: 2700, expenditure: 1200 },
	//   { timestamp: "2024-05-05T20:56:12Z", income: 3000, expenditure: 1400 },
	//   { timestamp: "2024-05-06T01:23:45Z", income: 3300, expenditure: 1600 },
	//   { timestamp: "2024-05-07T05:48:45Z", income: 3600, expenditure: 1800 },
	//   { timestamp: "2024-05-08T10:34:56Z", income: 3900, expenditure: 2000 },
	//   { timestamp: "2024-05-09T15:45:01Z", income: 4200, expenditure: 2200 },
	//   { timestamp: "2024-05-10T20:56:12Z", income: 4500, expenditure: 2400 },
	//   { timestamp: "2024-05-11T01:23:45Z", income: 4800, expenditure: 2600 },
	//   { timestamp: "2024-05-12T05:48:45Z", income: 5100, expenditure: 2800 },
	//   { timestamp: "2024-05-13T10:34:56Z", income: 5400, expenditure: 3000 },
	//   { timestamp: "2024-05-14T15:45:01Z", income: 5700, expenditure: 3200 },
	//   { timestamp: "2024-05-15T20:56:12Z", income: 6000, expenditure: 3400 },
	//   { timestamp: "2024-05-16T01:23:45Z", income: 6300, expenditure: 3600 },
	//   { timestamp: "2024-05-17T05:48:45Z", income: 6600, expenditure: 3800 },
	//   { timestamp: "2024-05-18T10:34:56Z", income: 6900, expenditure: 4000 },
	//   { timestamp: "2024-05-19T15:45:01Z", income: 7200, expenditure: 4200 },
	//   { timestamp: "2024-05-20T20:56:12Z", income: 7500, expenditure: 4400 },
	//   { timestamp: "2024-05-21T01:23:45Z", income: 7800, expenditure: 4600 },
	//   { timestamp: "2024-05-22T05:48:45Z", income: 8100, expenditure: 4800 },
	//   { timestamp: "2024-05-23T10:34:56Z", income: 8400, expenditure: 5000 },
	//   { timestamp: "2024-05-24T15:45:01Z", income: 8700, expenditure: 5200 },
	//   { timestamp: "2024-05-25T20:56:12Z", income: 9000, expenditure: 5400 },
	//   { timestamp: "2024-05-26T01:23:45Z", income: 9300, expenditure: 5600 },
	//   { timestamp: "2024-05-27T05:48:45Z", income: 9600, expenditure: 5800 },
	//   { timestamp: "2024-05-28T10:34:56Z", income: 9900, expenditure: 6000 },
	//   { timestamp: "2024-05-29T15:45:01Z", income: 10200, expenditure: 6200 },
	//   { timestamp: "2024-05-30T20:56:12Z", income: 10500, expenditure: 6400 },
	//   { timestamp: "2024-05-31T01:23:45Z", income: 10800, expenditure: 6600 },
	// ];

	const mockDataSample4: RevenueData[] = [
		{ timestamp: "2024-01-05T01:23:45Z", income: 1800, expenditure: 600 },
		{ timestamp: "2024-01-15T05:48:45Z", income: 2100, expenditure: 800 },
		{ timestamp: "2024-01-25T10:34:56Z", income: 2400, expenditure: 1000 },
		{ timestamp: "2024-02-08T15:45:01Z", income: 2700, expenditure: 1200 },
		{ timestamp: "2024-02-18T20:56:12Z", income: 3000, expenditure: 1400 },
		{ timestamp: "2024-02-28T01:23:45Z", income: 3300, expenditure: 1600 },
		{ timestamp: "2024-03-05T05:48:45Z", income: 3600, expenditure: 1800 },
		{ timestamp: "2024-03-15T10:34:56Z", income: 3900, expenditure: 2000 },
		{ timestamp: "2024-04-08T15:45:01Z", income: 4200, expenditure: 2200 },
		{ timestamp: "2024-04-18T20:56:12Z", income: 4500, expenditure: 2400 },
		{ timestamp: "2024-04-28T01:23:45Z", income: 4800, expenditure: 2600 },
		{ timestamp: "2024-05-05T05:48:45Z", income: 5100, expenditure: 2800 },
		{ timestamp: "2024-05-15T10:34:56Z", income: 5400, expenditure: 3000 },
		{ timestamp: "2024-06-08T15:45:01Z", income: 5700, expenditure: 3200 },
		{ timestamp: "2024-06-18T20:56:12Z", income: 6000, expenditure: 3400 },
		{ timestamp: "2024-06-28T01:23:45Z", income: 6300, expenditure: 3600 },
		{ timestamp: "2024-07-05T05:48:45Z", income: 6600, expenditure: 3800 },
		{ timestamp: "2024-07-15T10:34:56Z", income: 6900, expenditure: 4000 },
		{ timestamp: "2024-08-08T15:45:01Z", income: 7200, expenditure: 4200 },
		{ timestamp: "2024-08-18T20:56:12Z", income: 7500, expenditure: 4400 },
		{ timestamp: "2024-08-28T01:23:45Z", income: 7800, expenditure: 4600 },
		{ timestamp: "2024-09-05T05:48:45Z", income: 8100, expenditure: 4800 },
		{ timestamp: "2024-09-15T10:34:56Z", income: 8400, expenditure: 5000 },
		{ timestamp: "2024-10-08T15:45:01Z", income: 8700, expenditure: 5200 },
		{ timestamp: "2024-10-18T20:56:12Z", income: 9000, expenditure: 5400 },
		{ timestamp: "2024-10-28T01:23:45Z", income: 9300, expenditure: 5600 },
		{ timestamp: "2024-11-05T05:48:45Z", income: 9600, expenditure: 5800 },
		{ timestamp: "2024-11-15T10:34:56Z", income: 9900, expenditure: 6000 },
		{ timestamp: "2024-12-08T15:45:01Z", income: 10200, expenditure: 6200 },
		{ timestamp: "2024-12-18T20:56:12Z", income: 10500, expenditure: 6400 },
		{ timestamp: "2024-12-28T01:23:45Z", income: 10800, expenditure: 6600 },
	];

	// const weeklyData = groupDataByWeek(mockDataSample3);

	const monthlyData = groupDataByMonth(mockDataSample4);

	// const yearlyData = groupDataByYear(mockDataSample5);

	const { data, isLoading } = useQuery<RevenueData[], Error>({
		queryKey: ["yearlyData"],
		queryFn: () => monthlyData,
	});

	return (
		<>
			<div className="gap-4 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
				<Card className="w-full">
					<CardHeader className="flex flex-row justify-between items-center space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Total Income</CardTitle>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="none"
							stroke="green"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							className="w-4 h-4 text-muted-foreground"
						>
							<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
						</svg>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">$45,231.89</div>
						<p className="text-muted-foreground text-xs">
							+20.1% from last month
						</p>
					</CardContent>
				</Card>

				<Card className="w-full">
					<CardHeader className="flex flex-row justify-between items-center space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Total Expenditure
						</CardTitle>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="none"
							stroke="red"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							className="w-4 h-4"
						>
							<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
						</svg>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">+2350</div>
						<p className="text-muted-foreground text-xs">
							+180.1% from last month
						</p>
					</CardContent>
				</Card>

				<Card className="w-full">
					<CardHeader className="flex flex-row justify-between items-center space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Average Check Size
						</CardTitle>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							className="w-4 h-4 text-muted-foreground"
						>
							<rect width="20" height="14" x="2" y="5" rx="2" />
							<path d="M2 10h20" />
						</svg>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">+12,234</div>
						<p className="text-muted-foreground text-xs">
							+19% from last month
						</p>
					</CardContent>
				</Card>

				<Card className="w-full">
					<CardHeader className="flex flex-row justify-between items-center space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Gross Profit Margin
						</CardTitle>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							className="w-4 h-4 text-muted-foreground"
						>
							<path d="M22 12h-4m-2 0a6 6 0 01-6 6m6-6a6 6 0 006-6m6 0H2" />
						</svg>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">50%</div>
						<p className="text-muted-foreground text-xs">+5% from last month</p>
					</CardContent>
				</Card>
			</div>

			<div className="gap-4 grid md:grid-cols-2 lg:grid-cols-7 mt-4 pb-4">
				{/* Revenue Chart */}
				<Card className="order-1 lg:order-1 col-span-full lg:col-span-4 h-full">
					<Tabs defaultValue="line" className="flex flex-col p-0">
						<CardHeader>
							<CardTitle className="flex flex-row justify-between">
								<div>Revenue Chart</div>
								<div className="flex flex-row gap-2">
									<TabsList>
										<TabsTrigger value="line">Line</TabsTrigger>
										<TabsTrigger value="area">Area</TabsTrigger>
									</TabsList>
								</div>
							</CardTitle>
						</CardHeader>
						<CardContent className="relative m-0 p-0 h-full">
							{isLoading ? (
								<div className="top-1/2 left-1/2 absolute -translate-x-1/2 -translate-y-1/2 transform">
									<Loader className="animate-spin" />
								</div>
							) : (
								<>
									<TabsContent value="line">
										{/* <div className="border-2 border-red-500">test</div> */}
										<AnalyticsLineChart data={data!} />
									</TabsContent>
									<TabsContent value="area">
										<AnalyticsAreaChart data={data!} />
									</TabsContent>
								</>
							)}
						</CardContent>
					</Tabs>
				</Card>

				{/* Pie Chart */}
				<Card className="order-2 lg:order-2 col-span-full lg:col-span-3 h-full">
					<CardHeader>
						<CardTitle>Sales by Menu Category</CardTitle>
						<CardDescription>
							Percentage of sales by menu category.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<AnalyticsPieChart />
					</CardContent>
				</Card>
			</div>
		</>
	);
}
