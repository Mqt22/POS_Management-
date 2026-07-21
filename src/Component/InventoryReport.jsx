import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiSearch,
} from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const normalizeInventoryProduct = (product) => ({
  id: product.id,
  productId: product.product_id,
  productName: product.title,
  category: product.category,
  supplier: product.supplier,
  purchaseCost: product.purchase_cost,
  sellingPrice: product.price,
  currentStock: product.stock_quantity,
  minimumStock: product.minimum_stock,
});

const formatAmount = (amount) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(amount);

const getStockStatus = ({ currentStock, minimumStock }) => {
  if (currentStock === 0) return "out-of-stock";
  if (currentStock <= minimumStock) return "low-stock";
  return "in-stock";
};

const statusStyles = {
  "in-stock": "border-[#49723e] bg-[#63b447]/10 text-[#8bd174]",
  "low-stock": "border-amber-700/60 bg-amber-500/10 text-amber-300",
  "out-of-stock": "border-red-800/60 bg-red-500/10 text-red-300",
};

const InventoryReport = ({
  items = [],
  setItems = () => undefined,
  loading = false,
  error = "",
  onInventoryUpdated,
}) => {
  // Inventory table controls: search, status filter, pagination, and edit dialog.
  const { state } = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingItem, setEditingItem] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const itemsPerPage = 5;
  const highlightedId = state?.searchType === "Products" ? state.searchTarget : null;

  useEffect(() => {
    if (!highlightedId) return undefined;
    const itemIndex = items.findIndex((item) => item.productId === highlightedId);
    if (itemIndex < 0) return undefined;

    const timeout = window.setTimeout(() => {
      setSearch("");
      setStatusFilter("all");
      setCurrentPage(Math.floor(itemIndex / itemsPerPage) + 1);
      window.setTimeout(() => {
      document.querySelector(`[data-search-target="${highlightedId}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [highlightedId, items]);

  // Derive visible rows from the current query and stock-status filter.
  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !query ||
        [item.productId, item.productName, item.category, item.supplier]
          .some((value) => value.toLowerCase().includes(query));
      const matchesStatus =
        statusFilter === "all" || getStockStatus(item) === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [items, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const firstItemIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(
    firstItemIndex,
    firstItemIndex + itemsPerPage,
  );

  const updateSearch = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const updateFilter = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  // Export the currently filtered inventory rows as a CSV file.
  const exportInventory = () => {
    const headers = ["Product ID", "Product", "Category", "Supplier", "Purchase Cost", "Selling Price", "Current Stock", "Minimum Stock", "Status"];
    const rows = filteredItems.map((item) => [
      item.productId,
      item.productName,
      item.category,
      item.supplier,
      item.purchaseCost,
      item.sellingPrice,
      item.currentStock,
      item.minimumStock,
      getStockStatus(item),
    ]);
    const escapeValue = (value) => `"${String(value).replaceAll('"', '""')}"`;
    const csv = [headers, ...rows].map((row) => row.map(escapeValue).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "inventory-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const saveItem = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setSaveError("");
    try {
      const response = await fetch(
        `${API_URL}/UpdateInventory/${encodeURIComponent(editingItem.productId)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: editingItem.productName,
            category: editingItem.category,
            supplier: editingItem.supplier,
            purchase_cost: Number(editingItem.purchaseCost),
            price: Number(editingItem.sellingPrice),
            stock_quantity: Number(editingItem.currentStock),
            minimum_stock: Number(editingItem.minimumStock),
          }),
        }
      );
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.detail || "Unable to update inventory.");
      }
      const updatedItem = normalizeInventoryProduct(await response.json());
      setItems((currentItems) => currentItems.map(
        (item) => item.productId === updatedItem.productId ? updatedItem : item
      ));
      onInventoryUpdated?.();
      setEditingItem(null);
    } catch (requestError) {
      setSaveError(requestError.message || "Unable to update inventory.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateEditingItem = (field, value) => {
    setEditingItem((item) => ({ ...item, [field]: value }));
  };

  return (
    <>
      <section className="col-span-1 w-full overflow-hidden rounded-xl border border-white/5 bg-[#121812] lg:col-span-3">
        <div className="flex flex-col gap-4 border-b border-white/10 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Inventory</h2>
            <p className="mt-1 text-sm text-[#8f9b8d]">Manage products, pricing, and stock levels.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="relative min-w-[220px] flex-1">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8f9b8d]" />
              <input
                value={search}
                onChange={(event) => updateSearch(event.target.value)}
                placeholder="Search inventory"
                className="w-full rounded-lg border border-[#36562f] bg-[#0b100b] py-2 pl-9 pr-3 text-sm text-white outline-none placeholder:text-[#6f796d] focus:border-[#63b447]"
              />
            </label>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(event) => updateFilter(event.target.value)}
                className="appearance-none rounded-lg border border-[#36562f] bg-[#0b100b] py-2 pl-3 pr-9 text-sm font-semibold text-[#c7d0c5] outline-none focus:border-[#63b447]"
              >
                <option value="all">All stock</option>
                <option value="in-stock">In stock</option>
                <option value="low-stock">Low stock</option>
                <option value="out-of-stock">Out of stock</option>
              </select>
              <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
            </div>

            <button type="button" onClick={exportInventory} className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#36562f] px-4 py-2 text-sm font-semibold text-[#c7d0c5] hover:bg-white/5">
              <FiDownload />
              Export
            </button>
          </div>
        </div>

        <div className="sales-table-scrollbar overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead className="bg-[#182218]">
              <tr className="text-xs uppercase tracking-wide text-[#c7d0c5]">
                {["Product ID", "Product", "Category", "Supplier", "Purchase Cost", "Selling Price", "Stock", "Status", "Actions"].map((heading) => (
                  <th key={heading} className={`px-5 py-4 font-semibold ${heading === "Actions" ? "text-right" : ""}`}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan="9" className="px-5 py-10 text-center text-gray-400">Loading inventory...</td></tr>
              )}
              {!loading && error && (
                <tr><td colSpan="9" className="px-5 py-10 text-center text-red-300">{error}. Make sure FastAPI is running.</td></tr>
              )}
              {!loading && !error && paginatedItems.length === 0 && (
                <tr><td colSpan="9" className="px-5 py-10 text-center text-gray-400">No inventory products found.</td></tr>
              )}
              {!loading && !error && paginatedItems.map((item) => {
                const status = getStockStatus(item);
                return (
                  <tr
                    key={item.id}
                    data-search-target={item.productId}
                    className={`border-b border-white/10 text-sm text-[#c7d0c5] last:border-b-0 ${item.productId === highlightedId ? "search-result-highlight" : ""}`}
                  >
                    <td className="whitespace-nowrap px-5 py-5 font-semibold text-[#74c957]">{item.productId}</td>
                    <td className="px-5 py-5 font-bold text-white">{item.productName}</td>
                    <td className="whitespace-nowrap px-5 py-5">{item.category}</td>
                    <td className="px-5 py-5">{item.supplier}</td>
                    <td className="whitespace-nowrap px-5 py-5">{formatAmount(item.purchaseCost)}</td>
                    <td className="whitespace-nowrap px-5 py-5 font-semibold text-white">{formatAmount(item.sellingPrice)}</td>
                    <td className="whitespace-nowrap px-5 py-5">{item.currentStock} <span className="text-xs text-[#8f9b8d]">/ min {item.minimumStock}</span></td>
                    <td className="min-w-36 px-5 py-5">
                      <span className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-xs font-bold capitalize ${statusStyles[status]}`}>
                        {status.replaceAll("-", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-5 text-right">
                      <button type="button" onClick={() => setEditingItem({ ...item })} className="cursor-pointer rounded-lg border border-[#36562f] px-3 py-1.5 text-xs font-semibold hover:bg-[#315f25] hover:text-white">
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-white/10 px-5 py-4 text-sm text-[#c7d0c5]">
          <p>Showing <strong className="text-white">{paginatedItems.length}</strong> of <strong className="text-white">{filteredItems.length}</strong> products</p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} className="grid size-9 cursor-pointer place-items-center rounded-lg hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Previous inventory page"><FiChevronLeft /></button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button key={page} type="button" onClick={() => setCurrentPage(page)} className={`grid size-9 cursor-pointer place-items-center rounded-lg font-semibold ${page === currentPage ? "bg-[#63b447] text-black" : "hover:bg-white/5"}`}>{page}</button>
            ))}
            <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} className="grid size-9 cursor-pointer place-items-center rounded-lg hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Next inventory page"><FiChevronRight /></button>
          </div>
        </div>
      </section>

      {editingItem && (
        <div className="fixed inset-0 z-[100] grid place-items-center p-4">
          <button type="button" onClick={() => { if (!isSaving) setEditingItem(null); }} className="fixed inset-0 bg-black/65 backdrop-blur-md" aria-label="Close edit product dialog" />
          <form onSubmit={saveItem} className="relative z-10 w-full max-w-2xl rounded-2xl border border-[#36562f] bg-[#121812] p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-white">Edit Product</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                ["Product ID", "productId", "text"],
                ["Product name", "productName", "text"],
                ["Category", "category", "text"],
                ["Supplier", "supplier", "text"],
                ["Purchase cost", "purchaseCost", "number"],
                ["Selling price", "sellingPrice", "number"],
                ["Current stock", "currentStock", "number"],
                ["Minimum stock", "minimumStock", "number"],
              ].map(([label, field, type]) => (
                <label key={field} className="grid gap-2 text-sm font-semibold text-[#c7d0c5]">
                  {label}
                  <input required min={type === "number" ? "0" : undefined} type={type} value={editingItem[field]} readOnly={field === "productId"} onChange={(event) => updateEditingItem(field, event.target.value)} className={`rounded-lg border border-[#36562f] px-3 py-2.5 outline-none ${field === "productId" ? "cursor-not-allowed bg-white/5 text-gray-400" : "bg-[#0b100b] text-white focus:border-[#63b447]"}`} />
                </label>
              ))}
            </div>
            {saveError && <p className="mt-4 rounded-lg border border-red-900/60 bg-red-500/10 px-4 py-3 text-sm text-red-300">{saveError}</p>}
            <div className="mt-7 flex justify-end gap-3">
              <button type="button" onClick={() => setEditingItem(null)} disabled={isSaving} className="cursor-pointer rounded-lg border border-[#36562f] px-5 py-2.5 font-semibold text-[#c7d0c5] hover:bg-white/5 disabled:opacity-50">Cancel</button>
              <button type="submit" disabled={isSaving} className="cursor-pointer rounded-lg bg-[#63b447] px-5 py-2.5 font-bold text-black hover:bg-[#74c957] disabled:opacity-50">{isSaving ? "Saving..." : "Save changes"}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default InventoryReport;
