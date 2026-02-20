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
    posthog?: {
      capture?: (event: string, properties?: Record<string, unknown>) => void
    }
  }
}

function safeGtag(...args: unknown[]) {
  if (typeof window === "undefined") return
  if (typeof window.gtag !== "function") return
  window.gtag(...args)
}

function safePosthogCapture(event: string, properties: Record<string, unknown>) {
  if (typeof window === "undefined") return
  if (typeof window.posthog?.capture !== "function") return
  window.posthog.capture(event, properties)
}

export function trackAddToCart(params: {
  currency: string
  value: number
  items: AnalyticsItem[]
}) {
  safeGtag("event", "add_to_cart", params)
  safePosthogCapture("add_to_cart", {
    currency: params.currency,
    value: params.value,
    items: params.items,
  })
}

export function trackRemoveFromCart(params: {
  currency: string
  value: number
  items: AnalyticsItem[]
}) {
  safeGtag("event", "remove_from_cart", params)
  safePosthogCapture("remove_from_cart", {
    currency: params.currency,
    value: params.value,
    items: params.items,
  })
}

export function trackViewItem(params: {
  currency: string
  value: number
  items: AnalyticsItem[]
}) {
  safeGtag("event", "view_item", params)
  safePosthogCapture("product_viewed", {
    currency: params.currency,
    value: params.value,
    items: params.items,
  })
}

export function trackViewItemList(params: {
  item_list_name: string
  items: AnalyticsItem[]
}) {
  safeGtag("event", "view_item_list", params)
  safePosthogCapture("product_list_viewed", {
    item_list_name: params.item_list_name,
    items: params.items,
  })
}

export function trackViewCart(params: {
  currency: string
  value: number
  items: AnalyticsItem[]
}) {
  safeGtag("event", "view_cart", params)
  safePosthogCapture("view_cart", {
    currency: params.currency,
    value: params.value,
    items: params.items,
  })
}

export function trackBeginCheckout(params: {
  currency: string
  value: number
  items: AnalyticsItem[]
}) {
  safeGtag("event", "begin_checkout", params)
  safePosthogCapture("begin_checkout", {
    currency: params.currency,
    value: params.value,
    items: params.items,
  })
}

export function trackPurchase(params: {
  transaction_id: string
  currency: string
  value: number
  items: AnalyticsItem[]
}) {
  safeGtag("event", "purchase", params)
  safePosthogCapture("purchase_completed", {
    order_id: params.transaction_id,
    transaction_id: params.transaction_id,
    currency: params.currency,
    value: params.value,
    items: params.items,
  })
}
