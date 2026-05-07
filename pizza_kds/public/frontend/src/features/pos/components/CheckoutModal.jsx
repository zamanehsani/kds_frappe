import { useState } from "react";
import {
  X,
  User,
  Phone,
  MapPin,
  Clock,
  CreditCard,
  Loader,
} from "lucide-react";

export default function CheckoutModal({
  cart,
  subtotal,
  tax,
  total,
  onClose,
  onSuccess,
}) {
  const [step, setStep] = useState(1); // 1: Customer Info, 2: Review & Payment
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [orderType, setOrderType] = useState("Pickup");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");

  const handleNext = () => {
    // Validate customer info
    if (!customerName.trim()) {
      setError("Please enter customer name");
      return;
    }
    if (!customerPhone.trim()) {
      setError("Please enter customer phone");
      return;
    }
    if (orderType === "Delivery" && !deliveryAddress.trim()) {
      setError("Please enter delivery address");
      return;
    }
    if (orderType === "Delivery" && !deliveryDate) {
      setError("Please select delivery date");
      return;
    }

    setError("");
    setStep(2);
  };

  const handlePayment = async () => {
    if (loading) return; // prevent double clicks

    setLoading(true);
    setError("");

    try {
      // 1. Get CSRF token
      const csrfToken = window.frappe?.csrf_token || "";

      // 2. Create Sales Order
      const soResponse = await fetch(
        "/api/method/pizza_app.api.create_sales_order_for_pos",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Frappe-CSRF-Token": csrfToken,
          },
          body: JSON.stringify({
            customer_name: customerName,
            customer_phone: customerPhone,
            order_type: orderType,
            delivery_address: orderType === "Delivery" ? deliveryAddress : "",
            delivery_date: orderType === "Delivery" ? deliveryDate : "",
            notes: notes,
            items: cart.map((item) => ({
              item_code: item.item_code,
              qty: item.qty,
              rate: item.standard_rate,
              description: item.notes || "",
            })),
          }),
        }
      );

      const soData = await soResponse.json();

      // Enhanced Frappe Error Check
      if (!soResponse.ok || soData.exception || soData._server_messages) {
        const errorMsg = soData.exception || "Failed to create sales order";
        throw new Error(errorMsg);
      }

      const salesOrderName = soData?.message?.name;
      if (!salesOrderName) {
        throw new Error("Invalid sales order response");
      }

      // 3. Create Stripe Checkout Session
      const checkoutResponse = await fetch(
        "/api/method/pizza_app.api.create_stripe_checkout",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Frappe-CSRF-Token": csrfToken,
          },
          body: JSON.stringify({
            sales_order: salesOrderName,
            amount: parseFloat(total).toFixed(2), // Ensure valid decimal format
            customer_name: customerName,
            customer_phone: customerPhone,
          }),
        }
      );

      const checkoutData = await checkoutResponse.json();

      if (!checkoutResponse.ok || checkoutData.exception) {
        throw new Error(
          checkoutData.exception || "Failed to create checkout session"
        );
      }

      // 4. Redirect to Stripe Checkout (Modern Approach)
      // Redirect directly to the Stripe-hosted URL returned by your backend
      if (checkoutData.message && checkoutData.message.url) {
        window.location.assign(checkoutData.message.url);
      } else {
        throw new Error("Stripe session created but no URL was returned.");
      }
    } catch (err) {
      console.error("Payment Process Error:", err);
      // Extract cleaner error message if it's a JSON string from Frappe
      let displayError = err.message;
      try {
        const parsed = JSON.parse(err.message);
        displayError = parsed.message || displayError;
      } catch (e) {
        /* use original string */
      }

      setError(displayError);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Checkout - Step {step} of 2
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {step === 1 ? (
            <CustomerInfoForm
              orderType={orderType}
              setOrderType={setOrderType}
              customerName={customerName}
              setCustomerName={setCustomerName}
              customerPhone={customerPhone}
              setCustomerPhone={setCustomerPhone}
              deliveryAddress={deliveryAddress}
              setDeliveryAddress={setDeliveryAddress}
              deliveryDate={deliveryDate}
              setDeliveryDate={setDeliveryDate}
              notes={notes}
              setNotes={setNotes}
            />
          ) : (
            <ReviewAndPayment
              cart={cart}
              orderType={orderType}
              customerName={customerName}
              customerPhone={customerPhone}
              deliveryAddress={deliveryAddress}
              deliveryDate={deliveryDate}
              notes={notes}
              subtotal={subtotal}
              tax={tax}
              total={total}
            />
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={step === 1 ? onClose : () => setStep(1)}
            className="px-6 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-100"
            disabled={loading}
          >
            {step === 1 ? "Cancel" : "Back"}
          </button>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-xl font-bold text-green-600">
                AED {total.toFixed(2)}
              </p>
            </div>
            <button
              onClick={step === 1 ? handleNext : handlePayment}
              disabled={loading}
              className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : step === 1 ? (
                "Next"
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Pay Now
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomerInfoForm({
  orderType,
  setOrderType,
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  deliveryAddress,
  setDeliveryAddress,
  deliveryDate,
  setDeliveryDate,
  notes,
  setNotes,
}) {
  return (
    <div className="space-y-6">
      {/* Order Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Order Type *
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setOrderType("Pickup")}
            className={`p-4 border-2 rounded-lg font-medium transition-all ${
              orderType === "Pickup"
                ? "border-green-600 bg-green-50 text-green-700"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <Clock className="w-6 h-6 mx-auto mb-2" />
            Pickup
          </button>
          <button
            onClick={() => setOrderType("Delivery")}
            className={`p-4 border-2 rounded-lg font-medium transition-all ${
              orderType === "Delivery"
                ? "border-green-600 bg-green-50 text-green-700"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <MapPin className="w-6 h-6 mx-auto mb-2" />
            Delivery
          </button>
        </div>
      </div>

      {/* Customer Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <User className="w-4 h-4 inline mr-1" />
          Customer Name *
        </label>
        <input
          type="text"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Enter customer name"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Customer Phone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Phone className="w-4 h-4 inline mr-1" />
          Customer Phone *
        </label>
        <input
          type="tel"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          placeholder="Enter phone number"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Delivery Fields */}
      {orderType === "Delivery" && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Delivery Address *
            </label>
            <textarea
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Enter delivery address"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Delivery Date *
            </label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </>
      )}

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any special instructions..."
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
    </div>
  );
}

function ReviewAndPayment({
  cart,
  orderType,
  customerName,
  customerPhone,
  deliveryAddress,
  deliveryDate,
  notes,
  subtotal,
  tax,
  total,
}) {
  return (
    <div className="space-y-6">
      {/* Customer Info Summary */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <h3 className="font-semibold text-gray-900 mb-3">Order Details</h3>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-gray-700">Type:</span>
          <span className="text-gray-600">{orderType}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <User className="w-4 h-4 text-gray-500" />
          <span className="text-gray-600">{customerName}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Phone className="w-4 h-4 text-gray-500" />
          <span className="text-gray-600">{customerPhone}</span>
        </div>
        {orderType === "Delivery" && (
          <>
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
              <span className="text-gray-600">{deliveryAddress}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">{deliveryDate}</span>
            </div>
          </>
        )}
        {notes && (
          <div className="text-sm pt-2 border-t border-gray-200">
            <span className="font-medium text-gray-700">Notes:</span>
            <p className="text-gray-600 mt-1">{notes}</p>
          </div>
        )}
      </div>

      {/* Order Items */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
        <div className="space-y-2">
          {cart.map((item) => (
            <div
              key={item.item_code}
              className="flex items-center justify-between py-2 border-b border-gray-100"
            >
              <div className="flex-1">
                <p className="font-medium text-sm">{item.item_name}</p>
                <p className="text-xs text-gray-500">
                  {item.qty} × AED {item.standard_rate.toFixed(2)}
                </p>
                {item.notes && (
                  <p className="text-xs text-gray-400 italic mt-1">
                    Note: {item.notes}
                  </p>
                )}
              </div>
              <span className="font-semibold text-gray-900">
                AED {(item.qty * item.standard_rate).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Price Summary */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium">AED {subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tax (5%)</span>
          <span className="font-medium">AED {tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
          <span>Total</span>
          <span className="text-green-600">AED {total.toFixed(2)}</span>
        </div>
      </div>

      {/* Payment Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <p className="font-medium mb-1">Payment Information</p>
        <p>
          You will be redirected to Stripe to complete your payment securely.
        </p>
      </div>
    </div>
  );
}
