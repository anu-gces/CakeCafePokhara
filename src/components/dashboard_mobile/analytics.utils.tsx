import { addDays, differenceInDays, format, parseISO } from "date-fns";
import type { RevenueData } from "./analytics";

export function groupDataByHour(dataArray: RevenueData[]) {
	return Object.values(
		dataArray
			.map((data) => ({
				timestamp: format(parseISO(data.timestamp), "HH:00"),
				income: data.income,
				expenditure: data.expenditure,
			}))
			.reduce(
				(acc, data) => {
					if (!acc[data.timestamp]) {
						acc[data.timestamp] = {
							timestamp: data.timestamp,
							income: 0,
							expenditure: 0,
						};
					}

					acc[data.timestamp].income += data.income;
					acc[data.timestamp].expenditure += data.expenditure;

					return acc;
				},
				{} as { [key: string]: RevenueData },
			),
	);
}

export function groupDataByDay(dataArray: RevenueData[]) {
	return Object.values(
		dataArray
			.map((data) => ({
				timestamp: format(parseISO(data.timestamp), "MMM-dd"),
				income: data.income,
				expenditure: data.expenditure,
			}))
			.reduce(
				(acc, data) => {
					if (!acc[data.timestamp]) {
						acc[data.timestamp] = {
							timestamp: data.timestamp,
							income: 0,
							expenditure: 0,
						};
					}

					acc[data.timestamp].income += data.income;
					acc[data.timestamp].expenditure += data.expenditure;

					return acc;
				},
				{} as { [key: string]: RevenueData },
			),
	);
}

export function groupDataByWeek(dataArray: RevenueData[]) {
	const firstDate = parseISO(dataArray[0].timestamp);

	return Object.values(
		dataArray
			.map((data) => {
				const date = parseISO(data.timestamp);
				const diffDays = differenceInDays(date, firstDate);
				const diffWeeks = Math.floor(diffDays / 7);
				const weekStart = addDays(firstDate, diffWeeks * 7);

				return {
					timestamp: format(weekStart, "MMM-dd"),
					income: data.income,
					expenditure: data.expenditure,
				};
			})
			.reduce(
				(acc, data) => {
					if (!acc[data.timestamp]) {
						acc[data.timestamp] = {
							timestamp: data.timestamp,
							income: 0,
							expenditure: 0,
						};
					}

					acc[data.timestamp].income += data.income;
					acc[data.timestamp].expenditure += data.expenditure;

					return acc;
				},
				{} as {
					[key: string]: {
						timestamp: string;
						income: number;
						expenditure: number;
					};
				},
			),
	);
}

export function groupDataByMonth(dataArray: RevenueData[]) {
	return Object.values(
		dataArray
			.map((data) => {
				const date = parseISO(data.timestamp);
				const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);

				return {
					timestamp: format(monthStart, "MMM"),
					income: data.income,
					expenditure: data.expenditure,
				};
			})
			.reduce(
				(acc, data) => {
					if (!acc[data.timestamp]) {
						acc[data.timestamp] = {
							timestamp: data.timestamp,
							income: 0,
							expenditure: 0,
						};
					}

					acc[data.timestamp].income += data.income;
					acc[data.timestamp].expenditure += data.expenditure;

					return acc;
				},
				{} as {
					[key: string]: {
						timestamp: string;
						income: number;
						expenditure: number;
					};
				},
			),
	);
}

export function groupDataByYear(dataArray: RevenueData[]) {
	return Object.values(
		dataArray
			.map((data) => {
				const date = parseISO(data.timestamp);
				const yearStart = new Date(date.getFullYear(), 0, 1);

				return {
					timestamp: format(yearStart, "yyyy"),
					income: data.income,
					expenditure: data.expenditure,
				};
			})
			.reduce(
				(acc, data) => {
					if (!acc[data.timestamp]) {
						acc[data.timestamp] = {
							timestamp: data.timestamp,
							income: 0,
							expenditure: 0,
						};
					}

					acc[data.timestamp].income += data.income;
					acc[data.timestamp].expenditure += data.expenditure;

					return acc;
				},
				{} as {
					[key: string]: {
						timestamp: string;
						income: number;
						expenditure: number;
					};
				},
			),
	);
}

export function formatCompactNumber(value: number): string {
	if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
	if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
	if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
	return value.toString();
}
