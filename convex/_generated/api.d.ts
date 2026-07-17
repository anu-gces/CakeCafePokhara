/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as calendar_calendar from "../calendar/calendar.js";
import type * as dashboard_dailyStats from "../dashboard/dailyStats.js";
import type * as dashboard_revenue from "../dashboard/revenue.js";
import type * as dashboard_seedBalance from "../dashboard/seedBalance.js";
import type * as functions from "../functions.js";
import type * as http from "../http.js";
import type * as imageUpload from "../imageUpload.js";
import type * as restaurant_assetsLedger from "../restaurant/assetsLedger.js";
import type * as restaurant_billing from "../restaurant/billing.js";
import type * as restaurant_branches from "../restaurant/branches.js";
import type * as restaurant_expenseLedger from "../restaurant/expenseLedger.js";
import type * as restaurant_inventoryHistory from "../restaurant/inventoryHistory.js";
import type * as restaurant_menuItems from "../restaurant/menuItems.js";
import type * as restaurant_notifications from "../restaurant/notifications.js";
import type * as restaurant_orderTickets from "../restaurant/orderTickets.js";
import type * as restaurant_payLaterCustomerTransactions from "../restaurant/payLaterCustomerTransactions.js";
import type * as restaurant_payLaterCustomers from "../restaurant/payLaterCustomers.js";
import type * as restaurant_vendors from "../restaurant/vendors.js";
import type * as salaryLedger_salaryLedger from "../salaryLedger/salaryLedger.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  "calendar/calendar": typeof calendar_calendar;
  "dashboard/dailyStats": typeof dashboard_dailyStats;
  "dashboard/revenue": typeof dashboard_revenue;
  "dashboard/seedBalance": typeof dashboard_seedBalance;
  functions: typeof functions;
  http: typeof http;
  imageUpload: typeof imageUpload;
  "restaurant/assetsLedger": typeof restaurant_assetsLedger;
  "restaurant/billing": typeof restaurant_billing;
  "restaurant/branches": typeof restaurant_branches;
  "restaurant/expenseLedger": typeof restaurant_expenseLedger;
  "restaurant/inventoryHistory": typeof restaurant_inventoryHistory;
  "restaurant/menuItems": typeof restaurant_menuItems;
  "restaurant/notifications": typeof restaurant_notifications;
  "restaurant/orderTickets": typeof restaurant_orderTickets;
  "restaurant/payLaterCustomerTransactions": typeof restaurant_payLaterCustomerTransactions;
  "restaurant/payLaterCustomers": typeof restaurant_payLaterCustomers;
  "restaurant/vendors": typeof restaurant_vendors;
  "salaryLedger/salaryLedger": typeof salaryLedger_salaryLedger;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
