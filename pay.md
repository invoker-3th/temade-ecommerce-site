# Payment Flow Documentation - Temade E-commerce

This document describes the complete payment flow for both registered and unregistered users, from browsing products to successful checkout with Paystack integration.

## Overview

The Temade e-commerce platform supports seamless checkout for both registered and unregistered users. All users can browse products, add items to cart, and complete purchases. Registered users benefit from order history tracking and saved preferences.

## User Journey: Registered vs Unregistered

### Registered User Flow
1. User is logged in with an account
2. User can browse products and categories
3. User adds items to cart (cart persists in user profile)
4. User proceeds to checkout
5. User fills delivery information (pre-filled from profile if available)
6. User completes payment via Paystack
7. Order is created with `userId` linked to account
8. User receives order confirmation email
9. User can view order history in profile

### Unregistered User Flow
1. User browses products and categories (no login required)
2. User adds items to cart (cart stored in browser localStorage)
3. User proceeds to checkout
4. User fills delivery information manually
5. User completes payment via Paystack
6. Order is created without `userId` (guest checkout)
7. User receives order confirmation email
8. User can optionally register later to track orders

## Detailed Payment Flow

### Step 1: Product Browsing
- **Endpoint**: `GET /api/products` (public, no auth required)
- **Endpoint**: `GET /api/categories` (public, no auth required)
- **Endpoint**: `GET /api/products/[id]` (public, no auth required)
- Users can browse all products and categories without authentication
- Product details include: name, description, price (NGN/USD/GBP), sizes, color variants, images

### Step 2: Add to Cart
- Cart items stored in:
  - **Registered users**: MongoDB user profile + browser localStorage
  - **Unregistered users**: Browser localStorage only
- Cart items include: product ID, name, price, quantity, size, color, image

### Step 3: Checkout Page (`/checkout`)
- **Access**: Available to all users (registered and unregistered)
- **Form Fields Required**:
  - First Name
  - Last Name
  - Email Address
  - Phone Number
  - Address
  - City
  - State
  - Country
  - Postal Code
- **Pre-filled Data** (for registered users):
  - Email (from user profile)
  - Phone (from user profile)
  - Address (from user profile, if available)

### Step 4: Order Creation
- **Endpoint**: `POST /api/orders`
- **Request Body**:
  ```json
  {
    "userId": "user_id_or_null",
    "items": [
      {
        "id": "product_id",
        "name": "Product Name",
        "price": 10000,
        "quantity": 1,
        "size": "M",
        "color": "Red",
        "image": "image_url"
      }
    ],
    "shippingAddress": {
      "userName": "John Doe",
      "email": "user@example.com",
      "phone": "+1234567890",
      "city": "Lagos",
      "state": "Lagos",
      "address": "123 Main Street"
    },
    "paymentMethod": "paystack",
    "paymentStatus": "pending",
    "orderStatus": "pending",
    "currency": "NGN",
    "subtotal": 10000,
    "tax": 1000,
    "total": 11000
  }
  ```
- **Response**:
  ```json
  {
    "message": "Order created successfully",
    "order": {
      "_id": "order_id",
      "userId": "user_id_or_null",
      "items": [...],
      "shippingAddress": {...},
      "paymentStatus": "pending",
      "orderStatus": "pending",
      "total": 11000,
      "currency": "NGN",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
  ```
- Order is created with `paymentStatus: "pending"` and `orderStatus: "pending"`
- Order ID is stored in `sessionStorage` for Paystack integration
- Admin notification is created for new order
- Admin email notification is sent (if configured)

### Step 5: Paystack Payment Initialization
- **Component**: `PaystackCheckout` (client-side)
- **Configuration**:
  ```javascript
  {
    reference: "unique_timestamp_reference",
    email: "user@example.com",
    amount: 1100000, // Amount in smallest currency unit (kobo for NGN, cents for USD)
    publicKey: "pk_test_...",
    currency: "NGN", // NGN, USD, or EUR
    metadata: {
      orderId: "order_id",
      amount: 1100000,
      currency: "NGN",
      originalCurrency: "NGN",
      originalAmount: 1100000,
      userId: "user_id_or_undefined",
      custom_fields: [
        {
          display_name: "Full Name",
          variable_name: "full_name",
          value: "John Doe"
        },
        {
          display_name: "Phone",
          variable_name: "phone",
          value: "+1234567890"
        }
      ]
    }
  }
  ```
- Paystack popup opens for payment
- User completes payment in Paystack interface

### Step 6: Payment Success Handling
- **Client-side**: `handlePaystackSuccess` callback
- **Endpoint**: `POST /api/paystack/verify`
- **Request Body**:
  ```json
  {
    "reference": "paystack_reference",
    "orderId": "order_id"
  }
  ```
- Client verifies payment with server
- Analytics event `purchase` is tracked
- Cart is cleared
- Success overlay is shown

### Step 7: Paystack Webhook (Server-side Verification)
- **Endpoint**: `POST /api/webhooks/paystack`
- **Headers Required**:
  - `x-paystack-signature`: HMAC SHA512 signature
- **Webhook Event**: `charge.success`
- **Webhook Payload**:
  ```json
  {
    "event": "charge.success",
    "data": {
      "reference": "paystack_reference",
      "amount": 1100000,
      "status": "success",
      "gateway_response": "Successful",
      "paid_at": "2024-01-01T00:00:00.000Z",
      "id": "transaction_id",
      "channel": "card",
      "metadata": {
        "orderId": "order_id",
        "amount": 1100000,
        "currency": "NGN"
      }
    }
  }
  ```
- **Webhook Processing**:
  1. Verify HMAC signature using `PAYSTACK_SECRET_KEY`
  2. Validate order ID exists
  3. Verify payment amount matches order total
  4. Create invoice with invoice number (`INV-{timestamp}`)
  5. Update order:
     - `paymentStatus: "completed"`
     - `orderStatus: "processing"`
     - `paymentReference`: Paystack reference
     - `paymentAmountMinor`: Amount in smallest currency unit
     - `paymentAmountMajor`: Amount in major currency unit
     - `paymentDate`: Payment timestamp
     - `paymentProviderStatus`: "success"
     - `paymentGatewayResponse`: Gateway response message
     - `paymentChannel`: Payment channel (card, bank, etc.)
     - `paymentTransactionId`: Paystack transaction ID
     - `invoice`: Complete invoice object
  6. Create admin notification for payment confirmation
  7. Send customer confirmation email with:
     - Invoice number
     - Order total
     - Item list
     - Shipping address
  8. Track purchase event in PostHog analytics

### Step 8: Order Confirmation
- **Customer Email** includes:
  - Invoice number
  - Order total with currency symbol
  - Itemized list of products
  - Shipping address
- **Admin Notification** includes:
  - Order ID
  - Payment reference
  - Payment amount
- **Order Status**: Updated to `processing`
- **Payment Status**: Updated to `completed`

## Transaction Details from Paystack

After successful payment, the order contains the following Paystack transaction details:

```json
{
  "paymentReference": "paystack_reference_code",
  "paymentAmountMinor": 1100000,
  "paymentAmountMajor": 11000,
  "paymentDate": "2024-01-01T00:00:00.000Z",
  "paymentLastCheckedAt": "2024-01-01T00:00:00.000Z",
  "paymentProviderStatus": "success",
  "paymentGatewayResponse": "Successful",
  "paymentChannel": "card",
  "paymentTransactionId": "paystack_transaction_id",
  "invoice": {
    "number": "INV-1704067200000",
    "issuedAt": "2024-01-01T00:00:00.000Z",
    "items": [
      {
        "name": "Product Name",
        "color": "Red",
        "size": "M",
        "price": 10000,
        "quantity": 1,
        "total": 10000
      }
    ],
    "subtotal": 10000,
    "tax": 1000,
    "total": 11000,
    "currency": "NGN",
    "shippingAddress": {...},
    "customer": {
      "name": "John Doe",
      "email": "user@example.com",
      "phone": "+1234567890"
    },
    "payment": {
      "method": "paystack",
      "reference": "paystack_reference_code"
    }
  }
}
```

## Security Features

1. **Webhook Signature Verification**: All Paystack webhooks are verified using HMAC SHA512 signature
2. **Amount Validation**: Server verifies payment amount matches order total
3. **Order ID Validation**: Ensures order exists before updating payment status
4. **Idempotency**: Duplicate webhook calls are handled (already completed orders return success)
5. **Server-side Authority**: Only Paystack webhook can mark orders as paid (client cannot)

## Error Handling

### Payment Failure
- Paystack popup shows error message
- Order remains in `pending` status
- User can retry payment

### Webhook Failure
- Webhook errors are logged
- Order remains in `pending` status
- Admin can manually verify payment via admin panel

### Network Errors
- Client-side retry logic for order creation
- Session storage preserves order ID for retry

## Currency Support

- **Supported Currencies**: NGN (Nigerian Naira), USD (US Dollar), EUR (Euro)
- **Paystack Currency Mapping**:
  - NGN → NGN (amount in kobo)
  - USD → USD (amount in cents)
  - GBP → NGN (converted to NGN, amount in kobo)
- **Display**: Currency symbol shown based on user selection (₦, $, £)

## Testing

### Test Mode
- Use Paystack test keys (`pk_test_...` and `sk_test_...`)
- Test card numbers available in Paystack dashboard
- Webhook testing via Paystack dashboard webhook simulator

### Production Mode
- Use Paystack live keys (`pk_live_...` and `sk_live_...`)
- Configure webhook URL in Paystack dashboard: `https://yourdomain.com/api/webhooks/paystack`

## Key Differences: Registered vs Unregistered

| Feature | Registered User | Unregistered User |
|---------|---------------|-------------------|
| Cart Persistence | MongoDB + localStorage | localStorage only |
| Order History | Available in profile | Not available |
| Pre-filled Checkout | Yes (email, phone, address) | No |
| Order Tracking | Via profile | Via email only |
| User ID in Order | Yes | No (null) |

## API Endpoints Summary

### Public Endpoints (No Auth Required)
- `GET /api/products` - List all products
- `GET /api/products/[id]` - Get product by ID
- `GET /api/categories` - List all categories
- `GET /api/products/category/[category]` - Get products by category
- `GET /api/products/search` - Search products
- `POST /api/orders` - Create order (checkout)
- `POST /api/paystack/verify` - Verify payment

### Admin Endpoints (Auth Required)
- `GET /api/admin/products` - List products (admin)
- `GET /api/admin/categories` - List categories (admin)
- `GET /api/admin/orders` - List orders (admin)
- `PATCH /api/admin/orders` - Update order status (admin)

### Webhook Endpoints
- `POST /api/webhooks/paystack` - Paystack payment webhook (signature verified)

## Environment Variables Required

```env
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_... or pk_live_...
PAYSTACK_SECRET_KEY=sk_test_... or sk_live_...
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
NEXT_PUBLIC_ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

## Conclusion

The payment flow is designed to be seamless for both registered and unregistered users. All users can complete purchases, with registered users having access to additional features like order history. The system uses Paystack for secure payment processing with server-side webhook verification to ensure payment authenticity.

