import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiCalendar,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiFilter,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const PAGE_LOADED_AT = Date.now();

const paymentStatusStyles = {
  paid: "border-[#63b447] bg-[#315f25]/60 text-[#9ade83]",
  pending: "border-gray-600 bg-white/5 text-gray-300",
  partial: "border-[#49723e] bg-[#63b447]/10 text-[#8bd174]",
  overdue: "border-gray-500 bg-white/10 text-gray-200",
};

const orderStatusStyles = {
  received: "text-[#74c957]",
  ordered: "text-gray-200",
  "partially-received": "text-[#8bd174]",
  cancelled: "text-gray-400",
};

const formatAmount = (amount, currency) =>
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

const normalizePurchase = (purchase) => ({
  id: purchase.id,
  purchaseOrderId: purchase.purchase_order_id,
  invoiceNumber: purchase.invoice_number,
  supplier: {
    name: purchase.supplier_name,
    email: purchase.supplier_email,
    initials: purchase.supplier_name.split(" ").filter(Boolean).map((word) => word[0]).join("").slice(0, 2).toUpperCase(),
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

const emptyPurchase = {
  purchaseOrderId: "", invoiceNumber: "",
  supplier: { name: "", email: "", initials: "" },
  orderDate: "", expectedDeliveryDate: "",
  itemCount: 0, itemsReceived: 0,
  subtotal: 0, tax: 0, discount: 0, shippingCost: 0,
  totalAmount: 0, outstandingAmount: 0,
  currency: "PKR", paymentStatus: "pending", orderStatus: "ordered",
  paymentMethod: "bank-transfer", warehouse: "", notes: "",
  items: [],
};

const PurchaseReport = ({
  purchaseData = [],
  setPurchaseData = () => undefined,
  loading = false,
  error = "",
}) => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState("");
  const [highlightActive, setHighlightActive] = useState(false);
  const [productOptions, setProductOptions] = useState([]);
  const purchasesPerPage = 5;
  const highlightedId =
    state?.searchType === "Purchase Orders" && state?.searchRequestId >= PAGE_LOADED_AT
      ? state.searchTarget
      : null;

  useEffect(() => {
    if (!highlightedId) return undefined;
    const purchaseIndex = purchaseData.findIndex(
      (purchase) => purchase.purchaseOrderId === highlightedId
    );
    if (purchaseIndex < 0) return undefined;

    const startTimeout = window.setTimeout(() => {
      setActiveFilter("all");
      setCurrentPage(Math.floor(purchaseIndex / purchasesPerPage) + 1);
      setHighlightActive(true);
      window.setTimeout(() => {
        document.querySelector(`[data-search-target="${highlightedId}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
    }, 0);
    const endTimeout = window.setTimeout(() => {
      setHighlightActive(false);
      navigate(".", { replace: true, state: null });
    }, 3500);
    return () => {
      window.clearTimeout(startTimeout);
      window.clearTimeout(endTimeout);
    };
  }, [highlightedId, purchaseData, state?.searchRequestId, navigate]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch(`${API_URL}/ShowInventory`);
        if (!response.ok) return;
        const products = await response.json();
        setProductOptions(products);
      } catch {
        // The purchase page still works even if product suggestions fail to load.
      }
    };

    loadProducts();
  }, []);

  const filteredPurchases = activeFilter === "all"
    ? purchaseData
    : purchaseData.filter((purchase) => purchase.paymentStatus === activeFilter);
  const totalPages = Math.max(1, Math.ceil(filteredPurchases.length / purchasesPerPage));
  const firstPurchaseIndex = (currentPage - 1) * purchasesPerPage;
  const paginatedPurchases = filteredPurchases.slice(
    firstPurchaseIndex,
    firstPurchaseIndex + purchasesPerPage,
  );

  const changeFilter = (filter) => {
    setActiveFilter(filter);
    setCurrentPage(1);
    setFiltersOpen(false);
  };

  const exportPurchasesToCsv = () => {
    const headers = [
      "Purchase Order",
      "Invoice Number",
      "Supplier",
      "Supplier Email",
      "Order Date",
      "Expected Delivery",
      "Items",
      "Items Received",
      "Total Amount",
      "Outstanding Amount",
      "Currency",
      "Payment Status",
      "Order Status",
    ];
    const rows = filteredPurchases.map((purchase) => [
      purchase.purchaseOrderId,
      purchase.invoiceNumber,
      purchase.supplier.name,
      purchase.supplier.email,
      purchase.displayOrderDate,
      purchase.expectedDeliveryDate,
      purchase.itemCount,
      purchase.itemsReceived,
      purchase.totalAmount,
      purchase.outstandingAmount,
      purchase.currency,
      purchase.paymentStatus,
      purchase.orderStatus,
    ]);
    const escapeCsvValue = (value) => `"${String(value).replaceAll('"', '""')}"`;
    const csvContent = [headers, ...rows]
      .map((row) => row.map(escapeCsvValue).join(","))
      .join("\n");
    const csvFile = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const downloadUrl = URL.createObjectURL(csvFile);
    const downloadLink = document.createElement("a");

    downloadLink.href = downloadUrl;
    downloadLink.download = `purchase-report-${activeFilter}.csv`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    URL.revokeObjectURL(downloadUrl);
  };

  const openEditModal = (purchase) => {
    setActionError("");
    setEditingPurchase({
      ...purchase,
      originalPurchaseOrderId: purchase.purchaseOrderId,
      supplier: { ...purchase.supplier },
    });
  };

  const openCreateModal = () => {
    setActionError("");
    setEditingPurchase({ ...emptyPurchase, supplier: { ...emptyPurchase.supplier } });
  };

  const updatePurchase = (field, value) => {
    setEditingPurchase((purchase) => ({
      ...purchase,
      [field]: value,
    }));
  };

  const syncPurchaseTotals = (items) => ({
    itemCount: items.reduce((total, item) => total + Number(item.quantityOrdered || 0), 0),
    itemsReceived: items.reduce((total, item) => total + Number(item.quantityReceived || 0), 0),
  });

  const updateSupplier = (field, value) => {
    setEditingPurchase((purchase) => ({
      ...purchase,
      supplier: {
        ...purchase.supplier,
        [field]: value,
      },
    }));
  };

  const addPurchaseItem = () => {
    setEditingPurchase((purchase) => {
      const nextItems = [
        ...(purchase.items || []),
        {
          productId: "",
          productTitle: "",
          quantityOrdered: 0,
          quantityReceived: 0,
          unitCost: 0,
        },
      ];
      return {
        ...purchase,
        items: nextItems,
        ...syncPurchaseTotals(nextItems),
      };
    });
  };

  const removePurchaseItem = (indexToRemove) => {
    setEditingPurchase((purchase) => {
      const nextItems = purchase.items.filter((_, index) => index !== indexToRemove);
      return {
        ...purchase,
        items: nextItems,
        ...syncPurchaseTotals(nextItems),
      };
    });
  };

  const updatePurchaseItem = (indexToUpdate, field, value) => {
    setEditingPurchase((purchase) => {
      const nextItems = purchase.items.map((item, index) => {
        if (index !== indexToUpdate) return item;

        if (field === "productId") {
          const selectedProduct = productOptions.find((product) => product.product_id === value);
          return {
            ...item,
            productId: value,
            productTitle: selectedProduct?.title || "",
            unitCost: selectedProduct?.purchase_cost ?? item.unitCost,
          };
        }

        return {
          ...item,
          [field]: value,
        };
      });

      return {
        ...purchase,
        items: nextItems,
        ...syncPurchaseTotals(nextItems),
      };
    });
  };

  const savePurchase = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setActionError("");
    const isEditing = Boolean(editingPurchase.originalPurchaseOrderId);
    const payload = {
      purchase_order_id: editingPurchase.purchaseOrderId,
      invoice_number: editingPurchase.invoiceNumber,
      supplier_name: editingPurchase.supplier.name,
      supplier_email: editingPurchase.supplier.email,
      order_date: editingPurchase.orderDate,
      expected_delivery_date: editingPurchase.expectedDeliveryDate,
      item_count: Number(editingPurchase.itemCount),
      items_received: Number(editingPurchase.itemsReceived),
      subtotal: Number(editingPurchase.subtotal),
      tax: Number(editingPurchase.tax),
      discount: Number(editingPurchase.discount),
      shipping_cost: Number(editingPurchase.shippingCost),
      total_amount: Number(editingPurchase.totalAmount),
      outstanding_amount: Number(editingPurchase.outstandingAmount),
      currency: editingPurchase.currency,
      payment_status: editingPurchase.paymentStatus,
      order_status: editingPurchase.orderStatus,
      payment_method: editingPurchase.paymentMethod,
      warehouse: editingPurchase.warehouse,
      notes: editingPurchase.notes || null,
      items: editingPurchase.items
        .filter((item) => item.productId)
        .map((item) => ({
          product_id: item.productId,
          quantity_ordered: Number(item.quantityOrdered),
          quantity_received: Number(item.quantityReceived),
          unit_cost: Number(item.unitCost),
        })),
    };

    try {
      const response = await fetch(
        isEditing
          ? `${API_URL}/UpdatePurchases/${encodeURIComponent(editingPurchase.originalPurchaseOrderId)}`
          : `${API_URL}/InsertPurchases`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.detail || "Unable to save purchase order.");
      }
      const savedPurchase = normalizePurchase(await response.json());
      setPurchaseData((current) => isEditing
        ? current.map((purchase) => purchase.purchaseOrderId === editingPurchase.originalPurchaseOrderId ? savedPurchase : purchase)
        : [savedPurchase, ...current]
      );
      setEditingPurchase(null);
    } catch (requestError) {
      setActionError(requestError.message || "Unable to save purchase order.");
    } finally {
      setIsSaving(false);
    }
  };

  const deletePurchase = async () => {
    if (!editingPurchase.originalPurchaseOrderId) return;
    setIsDeleting(true);
    setActionError("");
    try {
      const response = await fetch(
        `${API_URL}/DeletePurchases/${encodeURIComponent(editingPurchase.originalPurchaseOrderId)}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Unable to delete purchase order.");
      setPurchaseData((current) => current.filter(
        (purchase) => purchase.purchaseOrderId !== editingPurchase.originalPurchaseOrderId
      ));
      setEditingPurchase(null);
    } catch (requestError) {
      setActionError(requestError.message || "Unable to delete purchase order.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Purchase report container */}
      <section className="mt-6 w-full overflow-hidden rounded-xl border border-white/5 bg-[#121812]">
        {/* Purchase report title and controls */}
        <div className="flex flex-col gap-4 border-b border-white/10 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-2xl font-bold text-[#ffffff]">Purchase Report</h2>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={openCreateModal}
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-[#63b447] px-4 py-2 text-sm font-bold text-black hover:bg-[#74c957]"
            >
              <FiPlus />
              New Purchase
            </button>
            {/* Quick payment filters */}
            <div className="flex overflow-hidden rounded-lg border border-[#36562f]">
              {["all", "paid", "pending"].map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => changeFilter(filter)}
                  className={`cursor-pointer px-4 py-2 text-sm font-semibold capitalize transition-colors ${
                    activeFilter === filter
                      ? "bg-[#315f25] text-white"
                      : "text-[#c7d0c5] hover:bg-white/5"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Complete payment-status filter menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setFiltersOpen((isOpen) => !isOpen)}
                aria-expanded={filtersOpen}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#36562f] px-4 py-2 text-sm font-semibold text-[#c7d0c5] hover:bg-white/5"
              >
                <FiFilter />
                Filters
              </button>

              {filtersOpen && (
                <div className="absolute right-0 top-full z-20 mt-2 min-w-40 overflow-hidden rounded-lg border border-[#36562f] bg-[#182218] p-1 shadow-xl">
                  {["all", "paid", "pending", "partial", "overdue"].map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => changeFilter(filter)}
                      className={`block w-full rounded-md px-3 py-2 text-left text-sm font-semibold capitalize ${
                        activeFilter === filter
                          ? "bg-[#315f25] text-white"
                          : "text-[#c7d0c5] hover:bg-white/5"
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={exportPurchasesToCsv}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#36562f] px-4 py-2 text-sm font-semibold text-[#c7d0c5] hover:bg-white/5"
            >
              <FiDownload />
              Export
            </button>
          </div>
        </div>

        {/* Responsive purchase table */}
        <div className="sales-table-scrollbar overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left">
            <thead className="bg-[#182218]">
              <tr className="text-xs uppercase tracking-wide text-[#c7d0c5]">
                <th className="px-5 py-4 font-semibold">Purchase Order</th>
                <th className="px-5 py-4 font-semibold">Supplier</th>
                <th className="px-5 py-4 font-semibold">Order Date</th>
                <th className="px-5 py-4 font-semibold">Items</th>
                <th className="px-5 py-4 font-semibold">Total</th>
                <th className="px-5 py-4 font-semibold">Payment</th>
                <th className="px-5 py-4 font-semibold">Order Status</th>
                <th className="px-5 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan="8" className="px-5 py-10 text-center text-gray-400">Loading purchases...</td></tr>
              )}
              {!loading && error && (
                <tr><td colSpan="8" className="px-5 py-10 text-center text-red-300">{error}. Make sure FastAPI is running.</td></tr>
              )}
              {!loading && !error && paginatedPurchases.length === 0 && (
                <tr><td colSpan="8" className="px-5 py-10 text-center text-gray-400">No purchase orders found.</td></tr>
              )}
              {!loading && !error && paginatedPurchases.map((purchase) => (
                <tr
                  key={purchase.id}
                  data-search-target={purchase.purchaseOrderId}
                  className={`border-b border-white/10 text-sm text-[#c7d0c5] last:border-b-0 ${purchase.purchaseOrderId === highlightedId && highlightActive ? "search-result-highlight" : ""}`}
                >
                  <td className="whitespace-nowrap px-5 py-5">
                    <p className="font-semibold text-[#ffffff]">#{purchase.purchaseOrderId}</p>
                    <p className="mt-1 text-xs text-[#8f9b8d]">{purchase.invoiceNumber}</p>
                  </td>
                  <td className="px-5 py-5">
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#294324] text-xs font-bold text-[#ffffff]">
                        {purchase.supplier.initials}
                      </span>
                      <div>
                        <p className="font-bold text-[#ffffff]">{purchase.supplier.name}</p>
                        <p className="text-xs text-[#8f9b8d]">{purchase.supplier.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-5">{purchase.displayOrderDate}</td>
                  <td className="whitespace-nowrap px-5 py-5">
                    {purchase.itemsReceived}/{purchase.itemCount}
                  </td>
                  <td className="whitespace-nowrap px-5 py-5 font-bold text-[#ffffff]">
                    {formatAmount(purchase.totalAmount, purchase.currency)}
                  </td>
                  <td className="px-5 py-5">
                    <span className={`inline-flex rounded-full border px-4 py-1 text-xs font-bold uppercase tracking-wider ${paymentStatusStyles[purchase.paymentStatus]}`}>
                      {purchase.paymentStatus}
                    </span>
                  </td>
                  <td className={`whitespace-nowrap px-5 py-5 font-semibold capitalize ${orderStatusStyles[purchase.orderStatus]}`}>
                    {purchase.orderStatus.replaceAll("-", " ")}
                  </td>
                  <td className="px-5 py-5 text-right">
                    <button
                      type="button"
                      onClick={() => openEditModal(purchase)}
                      className="cursor-pointer rounded-lg border border-[#36562f] px-3 py-1.5 text-xs font-semibold text-[#c7d0c5] transition-colors hover:bg-[#315f25] hover:text-white"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Purchase count and pagination */}
        <div className="flex flex-col gap-4 border-t border-white/10 px-5 py-4 text-sm text-[#c7d0c5] sm:flex-row sm:items-center sm:justify-between">
          <p>
            Showing <strong className="text-[#ffffff]">{paginatedPurchases.length}</strong> of{" "}
            <strong className="text-[#ffffff]">{filteredPurchases.length}</strong> purchases
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="grid size-9 cursor-pointer place-items-center rounded-lg hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Previous purchase page"
            >
              <FiChevronLeft />
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`grid size-9 cursor-pointer place-items-center rounded-lg font-semibold ${
                  page === currentPage
                    ? "bg-[#63b447] text-[#000000]"
                    : "hover:bg-white/5"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
              className="grid size-9 cursor-pointer place-items-center rounded-lg hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Next purchase page"
            >
              <FiChevronRight />
            </button>
          </div>
        </div>
      </section>

      {/* Edit purchase modal */}
      {editingPurchase && (
        <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto p-4">
          <button
            type="button"
            onClick={() => { if (!isSaving && !isDeleting) setEditingPurchase(null); }}
            className="fixed inset-0 bg-[#000000]/65 backdrop-blur-md"
            aria-label="Close edit purchase dialog"
          />

          <form
            onSubmit={savePurchase}
            className="relative z-10 my-auto w-full max-w-3xl rounded-2xl border border-[#36562f] bg-[#121812] p-5 shadow-2xl sm:p-7"
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-[#ffffff]">
                  {editingPurchase.originalPurchaseOrderId ? "Edit Purchase" : "New Purchase"}
                </h2>
                <p className="mt-1 text-sm text-[#8f9b8d]">Update the order, supplier, payment, and delivery details.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingPurchase(null)}
                disabled={isSaving || isDeleting}
                className="grid size-9 cursor-pointer place-items-center rounded-lg text-xl text-[#c7d0c5] hover:bg-white/10 hover:text-white"
                aria-label="Close edit purchase dialog"
              >
                ×
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="grid gap-2 text-sm font-semibold text-[#c7d0c5]">
                Purchase order ID
                <input required value={editingPurchase.purchaseOrderId} onChange={(event) => updatePurchase("purchaseOrderId", event.target.value)} className="rounded-lg border border-[#36562f] bg-[#0b100b] px-3 py-2.5 text-[#ffffff] outline-none focus:border-[#63b447]" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-[#c7d0c5]">
                Invoice number
                <input required value={editingPurchase.invoiceNumber} onChange={(event) => updatePurchase("invoiceNumber", event.target.value)} className="rounded-lg border border-[#36562f] bg-[#0b100b] px-3 py-2.5 text-[#ffffff] outline-none focus:border-[#63b447]" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-[#c7d0c5]">
                Supplier name
                <input required value={editingPurchase.supplier.name} onChange={(event) => updateSupplier("name", event.target.value)} className="rounded-lg border border-[#36562f] bg-[#0b100b] px-3 py-2.5 text-[#ffffff] outline-none focus:border-[#63b447]" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-[#c7d0c5]">
                Supplier email
                <input required type="email" value={editingPurchase.supplier.email} onChange={(event) => updateSupplier("email", event.target.value)} className="rounded-lg border border-[#36562f] bg-[#0b100b] px-3 py-2.5 text-[#ffffff] outline-none focus:border-[#63b447]" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-[#c7d0c5]">
                Warehouse
                <input required value={editingPurchase.warehouse} onChange={(event) => updatePurchase("warehouse", event.target.value)} className="rounded-lg border border-[#36562f] bg-[#0b100b] px-3 py-2.5 text-[#ffffff] outline-none focus:border-[#63b447]" />
              </label>
              {[
                ["Order date", "orderDate"],
                ["Expected delivery", "expectedDeliveryDate"],
              ].map(([label, field]) => (
                <label key={field} className="grid gap-2 text-sm font-semibold text-[#c7d0c5]">
                  {label}
                  <div className="relative">
                    <input required type="date" value={editingPurchase[field]} onChange={(event) => updatePurchase(field, event.target.value)} className="custom-date-input w-full rounded-lg border border-[#36562f] bg-[#0b100b] py-2.5 pl-3 pr-10 text-[#ffffff] outline-none focus:border-[#63b447]" />
                    <FiCalendar className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-lg text-white" />
                  </div>
                </label>
              ))}
              {[
                ["Subtotal", "subtotal"],
                ["Tax", "tax"],
                ["Discount", "discount"],
                ["Shipping cost", "shippingCost"],
                ["Total amount", "totalAmount"],
                ["Outstanding amount", "outstandingAmount"],
              ].map(([label, field]) => (
                <label key={field} className="grid gap-2 text-sm font-semibold text-[#c7d0c5]">
                  {label}
                  <input required min="0" step={["itemCount", "itemsReceived"].includes(field) ? "1" : "0.01"} type="number" value={editingPurchase[field]} onChange={(event) => updatePurchase(field, event.target.value)} className="rounded-lg border border-[#36562f] bg-[#0b100b] px-3 py-2.5 text-[#ffffff] outline-none focus:border-[#63b447]" />
                </label>
              ))}
              {[
                ["Currency", "currency", ["PKR"]],
                ["Payment status", "paymentStatus", ["paid", "pending", "partial", "overdue"]],
                ["Order status", "orderStatus", ["ordered", "partially-received", "received", "cancelled"]],
                ["Payment method", "paymentMethod", ["cash", "bank-transfer", "credit-card"]],
              ].map(([label, field, options]) => (
                <label key={field} className="grid gap-2 text-sm font-semibold text-[#c7d0c5]">
                  {label}
                  <div className="relative">
                    <select value={editingPurchase[field]} onChange={(event) => updatePurchase(field, event.target.value)} className="w-full appearance-none rounded-lg border border-[#36562f] bg-[#0b100b] py-2.5 pl-3 pr-10 capitalize text-[#ffffff] outline-none focus:border-[#63b447]">
                      {options.map((option) => (
                        <option key={option} value={option}>{option.replaceAll("-", " ")}</option>
                      ))}
                    </select>
                    <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-lg text-white" />
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-[#36562f] bg-[#0b100b] p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-white">Purchase Items</h3>
                  <p className="text-sm text-[#8f9b8d]">Receiving quantity here is what updates inventory stock.</p>
                </div>
                <button
                  type="button"
                  onClick={addPurchaseItem}
                  className="cursor-pointer rounded-lg border border-[#36562f] px-4 py-2 text-sm font-semibold text-[#c7d0c5] hover:bg-white/5"
                >
                  Add item
                </button>
              </div>

              <div className="space-y-3">
                {editingPurchase.items.map((item, index) => (
                  <div key={`${item.productId || "item"}-${index}`} className="grid gap-3 rounded-xl border border-[#243624] bg-[#121812] p-3 lg:grid-cols-[1.6fr,0.8fr,0.8fr,0.8fr,auto]">
                    <label className="grid gap-2 text-sm font-semibold text-[#c7d0c5]">
                      Product
                      <select
                        value={item.productId}
                        onChange={(event) => updatePurchaseItem(index, "productId", event.target.value)}
                        className="w-full appearance-none rounded-lg border border-[#36562f] bg-[#0b100b] py-2.5 pl-3 pr-10 text-[#ffffff] outline-none focus:border-[#63b447]"
                      >
                        <option value="">Select product</option>
                        {productOptions.map((product) => (
                          <option key={product.product_id} value={product.product_id}>
                            {product.product_id} - {product.title}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="grid gap-2 text-sm font-semibold text-[#c7d0c5]">
                      Ordered
                      <input
                        min="0"
                        type="number"
                        value={item.quantityOrdered}
                        onChange={(event) => updatePurchaseItem(index, "quantityOrdered", event.target.value)}
                        className="rounded-lg border border-[#36562f] bg-[#0b100b] px-3 py-2.5 text-[#ffffff] outline-none focus:border-[#63b447]"
                      />
                    </label>

                    <label className="grid gap-2 text-sm font-semibold text-[#c7d0c5]">
                      Received
                      <input
                        min="0"
                        type="number"
                        value={item.quantityReceived}
                        onChange={(event) => updatePurchaseItem(index, "quantityReceived", event.target.value)}
                        className="rounded-lg border border-[#36562f] bg-[#0b100b] px-3 py-2.5 text-[#ffffff] outline-none focus:border-[#63b447]"
                      />
                    </label>

                    <label className="grid gap-2 text-sm font-semibold text-[#c7d0c5]">
                      Unit cost
                      <input
                        min="0"
                        step="0.01"
                        type="number"
                        value={item.unitCost}
                        onChange={(event) => updatePurchaseItem(index, "unitCost", event.target.value)}
                        className="rounded-lg border border-[#36562f] bg-[#0b100b] px-3 py-2.5 text-[#ffffff] outline-none focus:border-[#63b447]"
                      />
                    </label>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removePurchaseItem(index)}
                        className="grid size-11 cursor-pointer place-items-center rounded-lg border border-red-800/70 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                        aria-label="Remove purchase item"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                ))}

                {editingPurchase.items.length === 0 && (
                  <p className="rounded-xl border border-dashed border-[#36562f] px-4 py-5 text-center text-sm text-[#8f9b8d]">
                    Add the products in this purchase order so received stock can increase inventory correctly.
                  </p>
                )}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-black/20 px-4 py-3">
                  <p className="text-xs text-[#8f9b8d]">Total items ordered</p>
                  <p className="mt-1 text-lg font-bold text-white">{editingPurchase.itemCount}</p>
                </div>
                <div className="rounded-xl bg-black/20 px-4 py-3">
                  <p className="text-xs text-[#8f9b8d]">Total items received</p>
                  <p className="mt-1 text-lg font-bold text-white">{editingPurchase.itemsReceived}</p>
                </div>
              </div>
            </div>

            <label className="mt-4 grid gap-2 text-sm font-semibold text-[#c7d0c5]">
              Notes
              <textarea value={editingPurchase.notes} onChange={(event) => updatePurchase("notes", event.target.value)} rows={3} className="resize-y rounded-lg border border-[#36562f] bg-[#0b100b] px-3 py-2.5 text-[#ffffff] outline-none focus:border-[#63b447]" />
            </label>

            {actionError && (
              <p className="mt-4 rounded-lg border border-red-900/60 bg-red-500/10 px-4 py-3 text-sm text-red-300">{actionError}</p>
            )}

            <div className="mt-7 flex items-center justify-between gap-3">
              <div>
                {editingPurchase.originalPurchaseOrderId && (
                  <button type="button" onClick={deletePurchase} disabled={isSaving || isDeleting} className="cursor-pointer rounded-lg border border-red-800/70 bg-red-500/10 px-5 py-2.5 font-bold text-red-300 hover:bg-red-500/20 disabled:opacity-50">
                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setEditingPurchase(null)} disabled={isSaving || isDeleting} className="cursor-pointer rounded-lg border border-[#36562f] px-5 py-2.5 font-semibold text-[#c7d0c5] hover:bg-white/5 disabled:opacity-50">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving || isDeleting} className="cursor-pointer rounded-lg bg-[#63b447] px-5 py-2.5 font-bold text-[#000000] transition-colors hover:bg-[#74c957] disabled:opacity-50">
                  {isSaving ? "Saving..." : editingPurchase.originalPurchaseOrderId ? "Save changes" : "Create purchase"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default PurchaseReport;
