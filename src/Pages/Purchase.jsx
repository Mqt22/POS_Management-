import { useEffect, useMemo, useState } from "react";
import { CiDeliveryTruck } from "react-icons/ci";
import { FiPackage } from "react-icons/fi";
import Box from "../Component/Box";
import { GiCash } from "react-icons/gi";
import PurchaseReport from "../Component/PurchaseReport";
import { BiSolidPurchaseTag } from "react-icons/bi";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const getInitials = (name) =>
  name.split(" ").filter(Boolean).map((word) => word[0].toUpperCase()).join("").slice(0, 2);

const formatDate = (date) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));

const normalizePurchase = (purchase) => ({
  id: purchase.id,
  purchaseOrderId: purchase.purchase_order_id,
  invoiceNumber: purchase.invoice_number,
  supplier: {
    name: purchase.supplier_name,
    email: purchase.supplier_email,
    initials: getInitials(purchase.supplier_name),
  },
  orderDate: purchase.order_date,
  displayOrderDate: formatDate(purchase.order_date),
  expectedDeliveryDate: purchase.expected_delivery_date,
  itemCount: purchase.item_count,
  itemsReceived: purchase.items_received,
  subtotal: purchase.subtotal,
  tax: purchase.tax,
  discount: purchase.discount,
  shippingCost: purchase.shipping_cost,
  totalAmount: purchase.total_amount,
  outstandingAmount: purchase.outstanding_amount,
  currency: purchase.currency,
  paymentStatus: purchase.payment_status,
  orderStatus: purchase.order_status,
  paymentMethod: purchase.payment_method,
  warehouse: purchase.warehouse,
  notes: purchase.notes || "",
  items: (purchase.items || []).map((item) => ({
    id: item.id,
    productId: item.product_id,
    productTitle: item.product_title,
    quantityOrdered: item.quantity_ordered,
    quantityReceived: item.quantity_received,
    unitCost: item.unit_cost,
  })),
});

const Purchase = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPurchases = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await fetch(`${API_URL}/ShowPurchases`);
        if (!response.ok) throw new Error(`Unable to load purchases (${response.status})`);
        const records = await response.json();
        setPurchases(records.map(normalizePurchase));
      } catch (requestError) {
        setError(requestError.message || "Unable to load purchases.");
      } finally {
        setLoading(false);
      }
    };
    loadPurchases();
  }, []);

  const summary = useMemo(() => ({
    totalPurchases: purchases.reduce((total, purchase) => total + purchase.totalAmount, 0),
    amountPaid: purchases.reduce(
      (total, purchase) => total + Math.max(0, purchase.totalAmount - purchase.outstandingAmount), 0
    ),
    purchaseOrders: purchases.length,
    pendingDeliveries: purchases.filter(
      (purchase) => !["received", "cancelled"].includes(purchase.orderStatus)
    ).length,
  }), [purchases]);

  const formatAmount = (amount) => new Intl.NumberFormat("en-PK", {
    style: "currency", currency: "PKR", maximumFractionDigits: 0,
  }).format(amount);

  return (
    <main className="min-h-0 flex-1 overflow-y-auto bg-[#080b08] p-4 text-white md:p-6 lg:p-8">
      {/* Dashboard summary cards grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-4 mb-6">
        <Box
          width="100%"
          height="120px"
          Subtitle="Total Purchases"
          Title="All purchase value"
          Amount={loading ? "Loading..." : error ? "Unavailable" : formatAmount(summary.totalPurchases)}
          Icon={BiSolidPurchaseTag}
          color="white"
        />
        <Box
          width="100%"
          height="120px"
          Subtitle="Amount Paid"
          Title="Paid to suppliers"
          Amount={loading ? "Loading..." : error ? "Unavailable" : formatAmount(summary.amountPaid)}
          Icon={GiCash}
          color="white"
        />
        <Box
          width="100%"
          height="120px"
          Subtitle="Purchase Orders"
          Title="All recorded orders"
          Amount={loading ? "..." : error ? "Unavailable" : summary.purchaseOrders}
          Icon={FiPackage}
          color="white"
        />
        <Box
          width="100%"
          height="120px"
          Subtitle="Pending Deliveries"
          Title="Not fully received"
          Amount={loading ? "..." : error ? "Unavailable" : summary.pendingDeliveries}
          Icon={CiDeliveryTruck}
          color="white"
        />
      </div>
      <PurchaseReport
        purchaseData={purchases}
        setPurchaseData={setPurchases}
        loading={loading}
        error={error}
      />ok 
    </main>
  )
}

export default Purchase