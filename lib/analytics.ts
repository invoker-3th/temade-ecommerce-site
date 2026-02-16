export type AnalyticsItem = {
  item_id: string
  item_name: string
  price: number
  quantity: number
  item_variant?: string
  item_category?: string
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

function safeGtag(...args: unknown[]) {
  if (typeof window === "undefined") return
  if (typeof window.gtag !== "function") return
  window.gtag(...args)
}

export function trackAddToCart(params: {
  currency: string
  value: number
  items: AnalyticsItem[]
}) {
  safeGtag("event", "add_to_cart", params)
}

export function trackRemoveFromCart(params: {
  currency: string
  value: number
  items: AnalyticsItem[]
}) {
  safeGtag("event", "remove_from_cart", params)
}

export function trackViewItem(params: {
  currency: string
  value: number
  items: AnalyticsItem[]
}) {
  safeGtag("event", "view_item", params)
}

export function trackViewItemList(params: {
  item_list_name: string
  items: AnalyticsItem[]
}) {
  safeGtag("event", "view_item_list", params)
}

export function trackViewCart(params: {
  currency: string
  value: number
  items: AnalyticsItem[]
}) {
  safeGtag("event", "view_cart", params)
}

export function trackBeginCheckout(params: {
  currency: string
  value: number
  items: AnalyticsItem[]
}) {
  safeGtag("event", "begin_checkout", params)
}

export function trackPurchase(params: {
  transaction_id: string
  currency: string
  value: number
  items: AnalyticsItem[]
}) {
  safeGtag("event", "purchase", params)
}
