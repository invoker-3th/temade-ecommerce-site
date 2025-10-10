"use client"

import type React from "react"

import Image from "next/image"
import Link from "next/link"
import { useState, useMemo } from "react"
import { useCart } from "../context/CartContext"
import { useAuth } from "../context/AuthContext"
import dynamic from "next/dynamic"
import CheckoutOverlay from "../components/CheckoutOverlay"

const PaystackCheckout = dynamic(
  () => import("../components/PaystackCheckout"),
  { ssr: false }
)

const CheckoutPage = () => {
  const [isOverlayVisible, setIsOverlayVisible] = useState(false)
  const { cartItems, getTotal, clearCart } = useCart()
  const { user } = useAuth()
  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = getTotal()
  const tax = subtotal * 0.1
  const shipping = 1000
  const total = subtotal + tax + shipping

  const [formData, setFormData] = useState<{
    firstname: string
    lastname: string
    email: string
    address: string
    city: string
    state: string
    phone: string
    country: string
    postalcode: string
  }>({
    firstname: "",
    lastname: "",
    email: user?.email || "",
    address: typeof user?.address === "string" ? user.address : "",
    city: "",
    state: "",
    phone: user?.phone || "",
    country: "",
    postalcode: "",
  })

  const [isProcessing, setIsProcessing] = useState(false)

  // Paystack configuration - memoized to prevent recreation on every render
  const config = useMemo(() => ({
    reference: new Date().getTime().toString(),
    email: user?.email || formData.email,
    amount: Math.round(total * 100), // Amount in kobo (multiply by 100)
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_test_your_public_key",
    currency: "NGN",
    metadata: {
      custom_fields: [
        {
          display_name: "Full Name",
          variable_name: "full_name",
          value: `${formData.firstname} ${formData.lastname}`
        },
        {
          display_name: "Phone",
          variable_name: "phone",
          value: formData.phone
        }
      ]
    }
  }), [user?.email, formData.email, total, formData.firstname, formData.lastname, formData.phone])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cartItems.length === 0) return

    // Validate required fields
    const requiredFields = ['firstname', 'lastname', 'email', 'address', 'city', 'state', 'phone', 'country', 'postalcode']
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]?.trim())
    
    if (missingFields.length > 0) {
      alert(`Please fill in all required fields: ${missingFields.join(', ')}`)
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      alert('Please enter a valid email address')
      return
    }

    // Check if Paystack public key is available
    if (!process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY === "pk_test_your_public_key") {
      alert('Payment system is not configured. Please contact support.')
      return
    }

    setIsProcessing(true)

    // Initialize Paystack payment
    // ...existing code for Paystack initialization...
  }

  const handlePaystackSuccess = async (reference: { reference: string }) => {
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?._id || null,
          items: cartItems,
          shippingAddress: formData,
          paymentMethod: "card",
          paymentReference: reference.reference,
          paymentStatus: "completed",
          subtotal,
          tax,
          shipping,
          total,
        }),
      })

      if (response.ok) {
        // Attach invoice to the order using PATCH
        const { order } = await response.json()
        await fetch("/api/orders", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: order?._id,
            reference: reference.reference,
            paymentMethod: "paystack",
            shippingAddress: {
              userName: `${formData.firstname} ${formData.lastname}`,
              email: formData.email,
              phone: formData.phone,
              city: formData.city,
              state: formData.state,
              address: formData.address,
            },
            items: cartItems,
            subtotal,
            tax,
            shipping,
            total,
            customer: { name: `${formData.firstname} ${formData.lastname}`, email: formData.email, phone: formData.phone },
          }),
        })
        clearCart()
        setIsOverlayVisible(true)
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Failed to create order")
      }
    } catch (error) {
      console.error("Order creation error:", error)
      alert(`Payment successful but order creation failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please contact support with your payment reference: ${reference.reference}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePaystackClose = () => {
    setIsProcessing(false)
  }

  return (
    <div className="min-h-screen bg-[#FFFBEB] py-10 px-4 md:px-16 font-sans">
      <CheckoutOverlay visible={isOverlayVisible} onClose={() => setIsOverlayVisible(false)} />
      <nav className="text-sm sm:text-base text-gray-600 mb-6">
        <ul className="flex flex-wrap gap-1">
          <li>
            <Link href="/" className="text-pink-600 hover:underline">
              Home
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href={``} className="text-pink-600 hover:underline">
              cart
            </Link>
          </li>
          <li>/</li>
          <li className="text-gray-500">Checkout</li>
        </ul>
      </nav>

      {!user && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6 text-center">
          <p className="text-blue-800">
            <Link href="/auth/login" className="underline font-medium">
              Sign in
            </Link>{" "}
            or{" "}
            <Link href="/auth/register" className="underline font-medium">
              create an account
            </Link>{" "}
            to save your order history and track your purchases.
          </p>
        </div>
      )}

      {cartItems.length === 0 ? (
        <div className="text-center text-gray-600">
          <p>Your cart is empty.</p>
          <Link href="/shop" className="text-[#CA6F86] hover:underline">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="">
          {/* Left column: Order summary + form */}
          <div className="order-2 lg:order-1 flex  flex-col-reverse justify-between items-start gap-4 md:flex-row-reverse">
            <div className="bg-[#F2E5E8] p-6 rounded-[5px] shadow-sm flex-1 ">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xl font-semibold text-[#222222]">Order Summary</h2>
                {totalQuantity > 0 && (
                  <span className="text-sm md:text-base font-semibold px-3 py-1 bg-[#CA6F86] rounded-full text-white ml-2">
                    {totalQuantity}
                  </span>
                )}
              </div>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 ">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        width={80}
                        height={80}
                        className="rounded object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-[20px] text-[#222222]">{item.name}</p>
                        <p className="text-xs text-gray-500">Color: {item.color}</p>
                        <p className="text-xs text-gray-400">Size: {item.size}</p>
                      </div>
                    </div>
                    <p className="text-[18px] text-[#222222] font-semibold">
                      ₦{(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-6 border-t pt-4 space-y-2 text-[#475367] text-sm font-medium">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₦{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (10%)</span>
                  <span>₦{tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>₦{shipping.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-medium pt-2 border-t">
                  <span>Total</span>
                  <span className="text-[#1D2739] text-base font-semibold">₦{total.toLocaleString()}</span>
                </div>
              </div>

              {/* Replace the existing button with: */}
              <PaystackCheckout 
                config={config}
                onSuccess={handlePaystackSuccess}
                onClose={handlePaystackClose}
                disabled={isProcessing || cartItems.length === 0}
                isProcessing={isProcessing}
              />

            </div>

            <form
              id="checkout-form"
              onSubmit={handleSubmit}
              className="space-y-6 p-6 border border-[#D3D3D3] flex-1 rounded-lg"
            >
              <h2 className="text-[24px] font-semibold text-[#222222]">Delivery Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstname" className="block text-sm font-medium text-[#333] mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstname"
                    name="firstname"
                    placeholder="Enter your first name"
                    value={formData.firstname}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-md p-3 outline-[#CA6F86] bg-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="lastname" className="block text-sm font-medium text-[#333] mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastname"
                    name="lastname"
                    placeholder="Enter your last name"
                    value={formData.lastname}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-md p-3 outline-[#CA6F86] bg-transparent"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-[#333] mb-1">
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  placeholder="Enter full address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-md p-3 outline-[#CA6F86] bg-transparent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-[#333] mb-1">
                    State
                  </label>
                  <select
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-md p-3  bg-transparent"
                  >
                    <option value="">Select a state</option>
                    <option value="Lagos">Lagos</option>
                    <option value="Abuja">Abuja</option>
                    <option value="Enugu">Enugu</option>
                    <option value="Kano">Kano</option>
                    <option value="Rivers">Rivers</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-[#333] mb-1">
                    Town/City
                  </label>
                  <select
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-md p-3 bg-transparent"
                  >
                    <option value="">Select a city</option>
                    <option value="Ikeja">Ikeja</option>
                    <option value="Wuse">Wuse</option>
                    <option value="Nsukka">Nsukka</option>
                    <option value="Port Harcourt">Port Harcourt</option>
                    <option value="Kano City">Kano City</option>
                  </select>
                </div>
                {/* select country */}
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-[#333] mb-1">
                    Country
                  </label>
                  <select
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-md p-3 bg-transparent"
                  >
                    <option value="">Select a country</option>
                    <option value="Nigeria">Nigeria</option>
                    <option value="Ghana">Ghana</option>
                    <option value="Kenya">Kenya</option>
                    <option value="South Africa">South Africa</option>
                    <option value="Uganda">Uganda</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="postalcode" className="block text-sm font-medium text-[#333] mb-1">
                    Postalcode
                  </label>
                  <input
                    type="text"
                    id="postalcode"
                    name="postalcode"
                    placeholder="Enter your postalcode"
                    value={formData.postalcode}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-md p-3 outline-[#CA6F86] bg-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-[#333] mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-md p-3 outline-[#CA6F86] bg-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#333] mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-md p-3 outline-[#CA6F86] bg-transparent"
                  />
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default CheckoutPage