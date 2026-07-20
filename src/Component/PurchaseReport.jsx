import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { purchases } from "../Data/PurchaseData.jsx";
import {
  FiCalendar,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiFilter,
} from "react-icons/fi";

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

const PurchaseReport = () => {
  const { state } = useLocation();
  const [purchaseData, setPurchaseData] = useState(purchases);
  const [activeFilter, setActiveFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const purchasesPerPage = 5;
  const highlightedId = state?.searchType === "Purchase Orders" ? state.searchTarget : null;

  useEffect(() => {
    if (!highlightedId) return undefined;
    const purchaseIndex = purchaseData.findIndex(
      (purchase) => purchase.purchaseOrderId === highlightedId
    );
    if (purchaseIndex < 0) return undefined;

    const timeout = window.setTimeout(() => {
      setActiveFilter("all");
      setCurrentPage(Math.floor(purchaseIndex / purchasesPerPage) + 1);
      window.setTimeout(() => {
        document.querySelector(`[data-search-target="${highlightedId}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [highlightedId, purchaseData]);

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
    setEditingPurchase({
      ...purchase,
      supplier: { ...purchase.supplier },
    });
  };

  const updatePurchase = (field, value) => {
    setEditingPurchase((purchase) => ({
      ...purchase,
      [field]: value,
    }));
  };

  const updateSupplier = (field, value) => {
    setEditingPurchase((purchase) => ({
      ...purchase,
      supplier: {
        ...purchase.supplier,
        [field]: value,
      },
    }));
  };

  const savePurchase = (event) => {
    event.preventDefault();

    const numberFields = [
      "itemCount",
      "itemsReceived",
      "totalAmount",
      "outstandingAmount",
    ];
    const updatedPurchase = {
      ...editingPurchase,
      displayOrderDate: formatDate(editingPurchase.orderDate),
    };

    numberFields.forEach((field) => {
      updatedPurchase[field] = Number(updatedPurchase[field]);
    });

    setPurchaseData((currentPurchases) =>
      currentPurchases.map((purchase) =>
        purchase.id === updatedPurchase.id ? updatedPurchase : purchase
      )
    );
    setEditingPurchase(null);
  };

  return (
    <>
      {/* Purchase report container */}
      <section className="mt-6 w-full overflow-hidden rounded-xl border border-white/5 bg-[#121812]">
        {/* Purchase report title and controls */}
        <div className="flex flex-col gap-4 border-b border-white/10 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-2xl font-bold text-[#ffffff]">Purchase Report</h2>

          <div className="flex flex-wrap items-center gap-3">
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
          <table className="w-full min-w-[1050px] border-collapse text-left">
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
              {paginatedPurchases.map((purchase) => (
                <tr
                  key={purchase.id}
                  data-search-target={purchase.purchaseOrderId}
                  className={`border-b border-white/10 text-sm text-[#c7d0c5] last:border-b-0 ${purchase.purchaseOrderId === highlightedId ? "search-result-highlight" : ""}`}
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
            onClick={() => setEditingPurchase(null)}
            className="fixed inset-0 bg-[#000000]/65 backdrop-blur-md"
            aria-label="Close edit purchase dialog"
          />

          <form
            onSubmit={savePurchase}
            className="relative z-10 my-auto w-full max-w-3xl rounded-2xl border border-[#36562f] bg-[#121812] p-5 shadow-2xl sm:p-7"
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-[#ffffff]">Edit Purchase</h2>
                <p className="mt-1 text-sm text-[#8f9b8d]">Update the order, supplier, payment, and delivery details.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingPurchase(null)}
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
                Supplier initials
                <input required maxLength={3} value={editingPurchase.supplier.initials} onChange={(event) => updateSupplier("initials", event.target.value.toUpperCase())} className="rounded-lg border border-[#36562f] bg-[#0b100b] px-3 py-2.5 uppercase text-[#ffffff] outline-none focus:border-[#63b447]" />
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
                ["Item count", "itemCount"],
                ["Items received", "itemsReceived"],
                ["Total amount", "totalAmount"],
                ["Outstanding amount", "outstandingAmount"],
              ].map(([label, field]) => (
                <label key={field} className="grid gap-2 text-sm font-semibold text-[#c7d0c5]">
                  {label}
                  <input required min="0" step={field.includes("Amount") ? "0.01" : "1"} type="number" value={editingPurchase[field]} onChange={(event) => updatePurchase(field, event.target.value)} className="rounded-lg border border-[#36562f] bg-[#0b100b] px-3 py-2.5 text-[#ffffff] outline-none focus:border-[#63b447]" />
                </label>
              ))}
              {[
                ["Currency", "currency", ["PKR"]],
                ["Payment status", "paymentStatus", ["paid", "pending", "partial", "overdue"]],
                ["Order status", "orderStatus", ["ordered", "partially-received", "received", "cancelled"]],
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

            <label className="mt-4 grid gap-2 text-sm font-semibold text-[#c7d0c5]">
              Notes
              <textarea value={editingPurchase.notes} onChange={(event) => updatePurchase("notes", event.target.value)} rows={3} className="resize-y rounded-lg border border-[#36562f] bg-[#0b100b] px-3 py-2.5 text-[#ffffff] outline-none focus:border-[#63b447]" />
            </label>

            <div className="mt-7 flex justify-end gap-3">
              <button type="button" onClick={() => setEditingPurchase(null)} className="cursor-pointer rounded-lg border border-[#36562f] px-5 py-2.5 font-semibold text-[#c7d0c5] hover:bg-white/5">
                Cancel
              </button>
              <button type="submit" className="cursor-pointer rounded-lg bg-[#63b447] px-5 py-2.5 font-bold text-[#000000] transition-colors hover:bg-[#74c957]">
                Save changes
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default PurchaseReport;
