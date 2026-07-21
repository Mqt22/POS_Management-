import { useEffect, useMemo, useState } from "react";
import { FiX } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";


const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const PAGE_LOADED_AT = Date.now();

const formatCurrency = (amount, currency = "PKR") =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (date) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));

const POH = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [highlightActive, setHighlightActive] = useState(false);

  useEffect(() => {
    const loadPurchaseHistory = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await fetch(`${API_URL}/ShowPurchases`);
        if (!response.ok) {
          throw new Error(`Unable to load purchase history (${response.status})`);
        }
        setPurchases(await response.json());
      } catch (requestError) {
        setError(requestError.message || "Unable to load purchase history.");
      } finally {
        setLoading(false);
      }
    };

    loadPurchaseHistory();
  }, []);

  const completedPurchases = useMemo(
    () => purchases.filter((purchase) => purchase.order_status === "received"),
    [purchases]
  );

  const highlightedId =
    state?.searchType === "Purchase Orders" && state?.searchRequestId >= PAGE_LOADED_AT
      ? state.searchTarget
      : null;

  useEffect(() => {
    if (!highlightedId) return undefined;
    if (!completedPurchases.some((purchase) => purchase.purchase_order_id === highlightedId)) {
      return undefined;
    }

    const startTimeout = window.setTimeout(() => {
      setHighlightActive(true);
      document
        .querySelector(`[data-search-target="${highlightedId}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
    const endTimeout = window.setTimeout(() => {
      setHighlightActive(false);
      navigate(".", { replace: true, state: null });
    }, 3500);
    return () => {
      window.clearTimeout(startTimeout);
      window.clearTimeout(endTimeout);
    };
  }, [highlightedId, completedPurchases, state?.searchRequestId, navigate]);

  return (
    <main className="min-h-0 flex-1 overflow-y-auto bg-[#080b08] p-4 text-white md:p-6 lg:p-8">
      <section className="w-full overflow-hidden rounded-xl border border-white/5 bg-[#121812]">
        <div className="border-b border-white/10 p-5">
          <h1 className="text-2xl font-bold text-white">Purchase History</h1>
          <p className="mt-1 text-sm text-[#8f9b8d]">
            Review completed and fully received purchase orders.
          </p>
        </div>

        <div className="sales-table-scrollbar overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-left">
            <thead className="bg-[#182218]">
              <tr className="text-xs uppercase tracking-wide text-[#c7d0c5]">
                <th className="px-5 py-4 font-semibold">Purchase Order</th>
                <th className="px-5 py-4 font-semibold">Invoice #</th>
                <th className="px-5 py-4 font-semibold">Supplier</th>
                <th className="px-5 py-4 font-semibold">Purchase Date</th>
                <th className="px-5 py-4 font-semibold">Items Received</th>
                <th className="px-5 py-4 font-semibold">Total</th>
                <th className="px-5 py-4 font-semibold">Payment</th>
                <th className="px-5 py-4 text-right font-semibold">Details</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan="8" className="px-5 py-12 text-center text-gray-400">Loading purchase history...</td></tr>
              )}
              {!loading && error && (
                <tr><td colSpan="8" className="px-5 py-12 text-center text-red-300">{error}. Make sure FastAPI is running.</td></tr>
              )}
              {!loading && !error && completedPurchases.length === 0 && (
                <tr><td colSpan="8" className="px-5 py-12 text-center text-gray-400">No completed purchases found.</td></tr>
              )}
              {!loading && !error && completedPurchases.map((purchase) => (
                <tr
                  key={purchase.id}
                  data-search-target={purchase.purchase_order_id}
                  className={`border-b border-white/10 text-sm text-[#c7d0c5] last:border-b-0 hover:bg-white/[0.02] ${purchase.purchase_order_id === highlightedId && highlightActive ? "search-result-highlight" : ""}`}
                >
                  <td className="whitespace-nowrap px-5 py-5 font-bold text-white">#{purchase.purchase_order_id}</td>
                  <td className="whitespace-nowrap px-5 py-5 text-[#74c957]">{purchase.invoice_number}</td>
                  <td className="px-5 py-5">
                    <p className="font-semibold text-white">{purchase.supplier_name}</p>
                    <p className="mt-1 text-xs text-gray-500">{purchase.supplier_email}</p>
                  </td>
                  <td className="whitespace-nowrap px-5 py-5">{formatDate(purchase.order_date)}</td>
                  <td className="whitespace-nowrap px-5 py-5">{purchase.items_received}/{purchase.item_count}</td>
                  <td className="whitespace-nowrap px-5 py-5 font-bold text-white">{formatCurrency(purchase.total_amount, purchase.currency)}</td>
                  <td className="px-5 py-5 capitalize">{purchase.payment_status}</td>
                  <td className="px-5 py-5 text-right">
                    <button type="button" onClick={() => setSelectedPurchase(purchase)} className="cursor-pointer rounded-lg border border-[#36562f] px-3 py-1.5 text-xs font-semibold hover:bg-[#315f25] hover:text-white">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-white/10 px-5 py-4 text-sm text-gray-400">
          Showing <strong className="text-white">{completedPurchases.length}</strong> completed purchases
        </div>
      </section>

      {selectedPurchase && (
        <div className="fixed inset-0 z-[140] grid place-items-center overflow-y-auto p-4">
          <button type="button" onClick={() => setSelectedPurchase(null)} className="fixed inset-0 bg-black/70 backdrop-blur-md" aria-label="Close purchase details" />
          <section className="relative z-10 my-auto w-full max-w-2xl rounded-2xl border border-[#36562f] bg-[#121812] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#74c957]">Completed Purchase</p>
                <h2 className="mt-1 text-2xl font-bold">{selectedPurchase.purchase_order_id}</h2>
                <p className="mt-1 text-sm text-gray-400">Invoice {selectedPurchase.invoice_number}</p>
              </div>
              <button type="button" onClick={() => setSelectedPurchase(null)} className="grid size-9 cursor-pointer place-items-center rounded-lg text-xl text-gray-400 hover:bg-white/10 hover:text-white" aria-label="Close purchase details"><FiX /></button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                ["Supplier", selectedPurchase.supplier_name],
                ["Supplier email", selectedPurchase.supplier_email],
                ["Order date", formatDate(selectedPurchase.order_date)],
                ["Expected delivery", formatDate(selectedPurchase.expected_delivery_date)],
                ["Items received", `${selectedPurchase.items_received}/${selectedPurchase.item_count}`],
                ["Warehouse", selectedPurchase.warehouse],
                ["Payment method", selectedPurchase.payment_method.replaceAll("-", " ")],
                ["Payment status", selectedPurchase.payment_status],
                ["Subtotal", formatCurrency(selectedPurchase.subtotal, selectedPurchase.currency)],
                ["Tax", formatCurrency(selectedPurchase.tax, selectedPurchase.currency)],
                ["Discount", formatCurrency(selectedPurchase.discount, selectedPurchase.currency)],
                ["Shipping", formatCurrency(selectedPurchase.shipping_cost, selectedPurchase.currency)],
                ["Total", formatCurrency(selectedPurchase.total_amount, selectedPurchase.currency)],
                ["Outstanding", formatCurrency(selectedPurchase.outstanding_amount, selectedPurchase.currency)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-black/20 p-3">
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="mt-1 break-words text-sm font-semibold capitalize text-white">{value}</p>
                </div>
              ))}
            </div>

            {selectedPurchase.notes && (
              <div className="mt-3 rounded-xl bg-black/20 p-3">
                <p className="text-xs text-gray-500">Notes</p>
                <p className="mt-1 text-sm leading-relaxed text-gray-300">{selectedPurchase.notes}</p>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
};

export default POH;
