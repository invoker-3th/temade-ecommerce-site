// src/data/orders.ts

export type Order = {
  id: string
  product: string
  quantity: number
  price: number
  status: "pending" | "shipped" | "delivered" | "cancelled"
  date: string
}

export const orders: Order[] = [
  {
    id: "ORD-001",
    product: "Wireless Headphones",
    quantity: 1,
    price: 120,
    status: "delivered",
    date: "2025-09-15",
  },
  {
    id: "ORD-002",
    product: "Smartphone",
    quantity: 1,
    price: 850,
    status: "shipped",
    date: "2025-09-20",
  },
  {
    id: "ORD-003",
    product: "Laptop Backpack",
    quantity: 2,
    price: 75,
    status: "pending",
    date: "2025-09-23",
  },
  {
    id: "ORD-004",
    product: "Bluetooth Speaker",
    quantity: 1,
    price: 60,
    status: "cancelled",
    date: "2025-09-25",
  },
]
