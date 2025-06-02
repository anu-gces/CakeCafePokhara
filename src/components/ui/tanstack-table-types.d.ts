import { ColumnMeta } from "@tanstack/react-table";

declare module "@tanstack/react-table" {
	interface ColumnMeta<TData> {
		label?: string; // Add 'label' as a string property
	}
}
