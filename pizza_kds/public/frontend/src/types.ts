export interface OrderItemAddonObject {
  name?: string;
  item_name?: string;
  item_code?: string;
  addon_name?: string;
  label?: string;
  title?: string;
  qty?: number | string;
  price?: number | string;
}

export type OrderItemAddons =
  | string
  | string[]
  | OrderItemAddonObject
  | OrderItemAddonObject[]
  | null;

export interface OrderItem {
  item_code: string;
  item_name?: string;
  qty: number;
  price?: number;   // not present on KOT — only on Sales Order
  description?: string;
  prep_time?: number | null;
  custom_selected_addons?: OrderItemAddons;
}

export interface Order {
  name: string;
  customer: string;
  status: "New" | "Cooking" | "Ready" | "Completed" | "Cancelled" | string;
  created_ts: number;
  cooking_started_ts?: number | null;
  creation?: string;
  order_type?: string;  // "Dine In" | "Delivery" | "Takeaway" etc.
  table_no?: string;    // set when order_type is "Dine In"
  sales_order?: string;
  items: OrderItem[];
  total_amount?: number; // not present on KOT
}
