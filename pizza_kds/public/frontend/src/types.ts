export interface OrderItem {
  item_code: string;
  qty: number;
  price?: number;   // not present on KOT — only on Sales Order
  notes?: string;
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
