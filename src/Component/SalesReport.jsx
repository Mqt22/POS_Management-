import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from "react-router-dom";
import { FiCalendar, FiChevronDown, FiChevronLeft, FiChevronRight, FiDownload, FiFileText, FiFilter, FiPrinter } from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const PAGE_LOADED_AT = Date.now();

const normalizeSale = (sale) => ({
    invoiceId: sale.invoice_id,
    customer: {
        name: sale.customer_name,
        email: sale.customer_email,
        initials: sale.customer_name
            .split(" ")
            .filter(Boolean)
            .map((word) => word[0].toUpperCase())
            .join("")
            .slice(0, 2),
    },
    date: sale.invoice_date,
    displayDate: new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
    }).format(new Date(`${sale.invoice_date}T00:00:00Z`)),
    dueDate: sale.due_date,
    amount: sale.amount,
    currency: sale.currency,
    status: sale.status,
});

const SalesReport = ({ salesData, setSalesData, loading, error }) => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const [internalSales, setInternalSales] = useState([]);
    const [internalLoading, setInternalLoading] = useState(false);
    const [internalError, setInternalError] = useState("");
    const [activeFilter, setActiveFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [editingSale, setEditingSale] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const [highlightActive, setHighlightActive] = useState(false);
    const [printingInvoiceId, setPrintingInvoiceId] = useState("");
    const [downloadingInvoiceId, setDownloadingInvoiceId] = useState("");
    const salesPerPage = 5;
    const highlightedId =
        state?.searchType === "Sales Invoices" &&
        state?.searchRequestId >= PAGE_LOADED_AT
            ? state.searchTarget
            : null;
    const displayedSales = salesData ?? internalSales;
    const updateSales = setSalesData ?? setInternalSales;
    const isLoading = loading ?? internalLoading;
    const loadError = error ?? internalError;

    // The Dashboard uses SalesReport directly, so load API data when no parent supplies it.
    useEffect(() => {
        if (salesData !== undefined) return undefined;

        const loadSales = async () => {
            try {
                setInternalLoading(true);
                setInternalError("");
                const response = await fetch(`${API_URL}/ShowSales`);
                if (!response.ok) throw new Error(`Unable to load sales (${response.status})`);
                const sales = await response.json();
                setInternalSales(sales.map(normalizeSale));
            } catch (requestError) {
                setInternalError(requestError.message);
            } finally {
                setInternalLoading(false);
            }
        };

        loadSales();
        return undefined;
    }, [salesData]);

    useEffect(() => {
        if (!highlightedId) return undefined;
        const saleIndex = displayedSales.findIndex((sale) => sale.invoiceId === highlightedId);
        if (saleIndex < 0) return undefined;

        const startTimeout = window.setTimeout(() => {
            setActiveFilter("all");
            setCurrentPage(Math.floor(saleIndex / salesPerPage) + 1);
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
    }, [highlightedId, displayedSales, salesPerPage, state?.searchRequestId, navigate]);

    const filteredSales = activeFilter === "all"
        ? displayedSales
        : displayedSales.filter((sale) => sale.status === activeFilter);
    const totalPages = Math.max(1, Math.ceil(filteredSales.length / salesPerPage));
    const firstSaleIndex = (currentPage - 1) * salesPerPage;
    const paginatedSales = filteredSales.slice(firstSaleIndex, firstSaleIndex + salesPerPage);

    const changeFilter = (filter) => {
        setActiveFilter(filter);
        setCurrentPage(1);
        setFiltersOpen(false);
    };

    const exportSalesToCsv = () => {
        const csvHeaders = ["Invoice ID", "Customer", "Email", "Date", "Amount", "Currency", "Status"];
        const csvRows = filteredSales.map((sale) => [
            sale.invoiceId,
            sale.customer.name,
            sale.customer.email,
            sale.displayDate,
            sale.amount,
            sale.currency,
            sale.status,
        ]);
        const escapeCsvValue = (value) => `"${String(value).replaceAll('"', '""')}"`;
        const csvContent = [csvHeaders, ...csvRows]
            .map((row) => row.map(escapeCsvValue).join(","))
            .join("\n");
        const csvFile = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const downloadUrl = URL.createObjectURL(csvFile);
        const downloadLink = document.createElement("a");

        downloadLink.href = downloadUrl;
        downloadLink.download = `recent-sales-${activeFilter}.csv`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        downloadLink.remove();
        URL.revokeObjectURL(downloadUrl);
    };

    const openEditModal = (sale) => {
        setDeleteError("");
        setSaveError("");
        setEditingSale({
            ...sale,
            originalInvoiceId: sale.invoiceId,
            customer: { ...sale.customer },
        });
    };

    const updateEditingSale = (field, value) => {
        setEditingSale((sale) => ({
            ...sale,
            [field]: value,
        }));
    };

    const updateEditingCustomer = (field, value) => {
        setEditingSale((sale) => ({
            ...sale,
            customer: {
                ...sale.customer,
                [field]: value,
            },
        }));
    };

    const statusStyles = {
        paid: "border-[#63b447] bg-[#315f25]/60 text-[#9ade83]",
        pending: "border-gray-600 bg-white/5 text-gray-300",
        overdue: "border-[#49723e] bg-[#63b447]/10 text-[#74c957]",
    };

    const formatAmount = (amount, currency) =>
        new Intl.NumberFormat("en-PK", {
            style: "currency",
            currency,
            maximumFractionDigits: 0,
        }).format(amount);

    const buildInvoiceDocument = (invoice) => {
        const rows = invoice.items.length > 0
            ? invoice.items.map((item) => `
                <tr>
                    <td>${item.product_title}</td>
                    <td>${item.quantity}</td>
                    <td>${formatAmount(item.unit_price, invoice.currency)}</td>
                    <td>${formatAmount(item.line_total, invoice.currency)}</td>
                </tr>
            `).join("")
            : `
                <tr>
                    <td colspan="4">Detailed invoice items are not available for this record.</td>
                </tr>
            `;

        return `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Invoice ${invoice.invoice_id}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 32px; color: #111827; }
                        h1, h2, p { margin: 0; }
                        .muted { color: #4b5563; }
                        .section { margin-top: 24px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
                        th, td { border: 1px solid #d1d5db; padding: 10px; text-align: left; font-size: 14px; }
                        th { background: #f3f4f6; }
                        .totals { margin-top: 18px; width: 320px; margin-left: auto; }
                        .totals div { display: flex; justify-content: space-between; padding: 6px 0; }
                        .grand-total { font-weight: 700; border-top: 1px solid #d1d5db; margin-top: 6px; padding-top: 10px; }
                    </style>
                </head>
                <body>
                    <h1>Mirza Traders</h1>
                    <p class="muted">Invoice ${invoice.invoice_id}</p>

                    <div class="section">
                        <p><strong>Date:</strong> ${new Intl.DateTimeFormat("en-PK", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                        }).format(new Date(invoice.created_at || `${invoice.invoice_date}T00:00:00`))}</p>
                        <p><strong>Customer:</strong> ${invoice.customer_name}</p>
                        <p><strong>Email:</strong> ${invoice.customer_email}</p>
                        <p><strong>Status:</strong> ${invoice.status}</p>
                        <p><strong>Payment:</strong> ${invoice.payment_method}</p>
                    </div>

                    <div class="section">
                        <h2>Invoice Items</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Qty</th>
                                    <th>Price</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </div>

                    <div class="totals">
                        <div><span>Subtotal</span><span>${formatAmount(invoice.subtotal, invoice.currency)}</span></div>
                        <div><span>Tax</span><span>${formatAmount(invoice.tax, invoice.currency)}</span></div>
                        <div class="grand-total"><span>Total</span><span>${formatAmount(invoice.total, invoice.currency)}</span></div>
                    </div>
                </body>
            </html>
        `;
    };

    const loadInvoiceDetails = async (invoiceId) => {
        const response = await fetch(`${API_URL}/InvoiceDetails/${encodeURIComponent(invoiceId)}`);
        if (!response.ok) {
            const responseBody = await response.json().catch(() => null);
            throw new Error(responseBody?.detail || "Unable to load invoice details.");
        }
        return response.json();
    };

    const printInvoice = async (invoiceId) => {
        setDeleteError("");
        setSaveError("");
        setPrintingInvoiceId(invoiceId);
        try {
            const invoice = await loadInvoiceDetails(invoiceId);
            const printWindow = window.open("", "_blank", "width=900,height=1000");
            if (!printWindow) throw new Error("Popup blocked");
            printWindow.document.write(buildInvoiceDocument(invoice));
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
        } catch (requestError) {
            setDeleteError(requestError.message || "Unable to print invoice.");
        } finally {
            setPrintingInvoiceId("");
        }
    };

    const downloadInvoicePdf = async (invoiceId) => {
        setDeleteError("");
        setSaveError("");
        setDownloadingInvoiceId(invoiceId);
        try {
            const invoice = await loadInvoiceDetails(invoiceId);
            const pdfWindow = window.open("", "_blank", "width=900,height=1000");
            if (!pdfWindow) throw new Error("Popup blocked");
            pdfWindow.document.write(buildInvoiceDocument(invoice));
            pdfWindow.document.close();
            pdfWindow.focus();
            pdfWindow.print();
        } catch (requestError) {
            setDeleteError(requestError.message || "Unable to open invoice PDF.");
        } finally {
            setDownloadingInvoiceId("");
        }
    };

    const saveEditedSale = async (event) => {
        event.preventDefault();
        setIsSaving(true);
        setSaveError("");

        try {
            const response = await fetch(
                `${API_URL}/updatesales/${encodeURIComponent(editingSale.originalInvoiceId)}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        customer_name: editingSale.customer.name,
                        customer_email: editingSale.customer.email,
                        invoice_date: editingSale.date,
                        due_date: editingSale.dueDate,
                        amount: Number(editingSale.amount),
                        currency: editingSale.currency,
                        status: editingSale.status,
                    }),
                }
            );

            if (!response.ok) {
                const responseBody = await response.json().catch(() => null);
                throw new Error(responseBody?.detail || "Unable to update the sale.");
            }

            const updatedSale = normalizeSale(await response.json());
            updateSales((sales) =>
                sales.map((sale) =>
                    sale.invoiceId === editingSale.originalInvoiceId ? updatedSale : sale
                )
            );
            setEditingSale(null);
        } catch (requestError) {
            setSaveError(requestError.message || "Unable to update the sale.");
        } finally {
            setIsSaving(false);
        }
    };

    // Delete the active invoice in FastAPI, then remove it from cards and table state.
    const deleteSale = async () => {
        setIsDeleting(true);
        setDeleteError("");

        try {
            const response = await fetch(
                `${API_URL}/Deletesales/${encodeURIComponent(editingSale.originalInvoiceId)}`,
                { method: "DELETE" }
            );

            if (!response.ok) {
                const responseBody = await response.json().catch(() => null);
                throw new Error(responseBody?.detail || "Unable to delete the sale.");
            }

            updateSales((sales) =>
                sales.filter(
                    (sale) => sale.invoiceId !== editingSale.originalInvoiceId
                )
            );
            setEditingSale(null);
        } catch (requestError) {
            setDeleteError(requestError.message || "Unable to delete the sale.");
        } finally {
            setIsDeleting(false);
        }
    };
    return (
        <>
            {/* Recent sales report container */}
            <section className="w-full overflow-hidden rounded-xl border border-[#2f4a2b] bg-[#121812]">
                {/* Report title and action controls */}
                <div className="flex flex-col gap-4 border-b border-white/10 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                    <h2 className="text-2xl font-bold text-white">
                        Recent Sales
                    </h2>

                    {/* Sales filters, filter button, and export button */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* All, Paid, and Pending status tabs */}
                        <div className="flex overflow-hidden rounded-lg border border-[#36562f]">
                            {["all", "paid", "pending"].map((filter) => (
                                <button
                                    key={filter}
                                    type="button"
                                    onClick={() => changeFilter(filter)}
                                    className={`px-4 py-2 text-sm font-semibold capitalize transition-colors cursor-pointer ${activeFilter === filter
                                        ? "bg-[#315f25] text-white"
                                        : "text-gray-300 hover:bg-white/5"
                                        }`}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setFiltersOpen((isOpen) => !isOpen)}
                                aria-expanded={filtersOpen}
                                className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#36562f] px-4 py-2 text-sm font-semibold text-gray-300 hover:bg-white/5"
                            >
                                <FiFilter />
                                Filters
                            </button>

                            {filtersOpen && (
                                <div className="absolute right-0 top-full z-20 mt-2 min-w-40 overflow-hidden rounded-lg border border-[#36562f] bg-[#182218] p-1 shadow-xl">
                                    {["all", "paid", "pending", "overdue"].map((filter) => (
                                        <button
                                            key={filter}
                                            type="button"
                                            onClick={() => changeFilter(filter)}
                                            className={`block w-full rounded-md px-3 py-2 text-left text-sm font-semibold capitalize ${activeFilter === filter
                                                ? "bg-[#315f25] text-white"
                                                : "text-gray-300 hover:bg-white/5"
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
                            onClick={exportSalesToCsv}
                            className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#36562f] px-4 py-2 text-sm font-semibold text-gray-300 hover:bg-white/5"
                        >
                            <FiDownload />
                            Export
                        </button>
                    </div>
                </div>

                {/* Horizontally scrollable table wrapper for smaller screens */}
                <div className="sales-table-scrollbar overflow-x-auto">
                    <table className="w-full min-w-[760px] border-collapse text-left">
                        {/* Sales table column headings */}
                        <thead className="bg-[#182218]">
                            <tr className="text-xs uppercase tracking-wide text-gray-300">
                                <th className="px-4 py-3 font-semibold">Invoice ID</th>
                                <th className="px-4 py-3 font-semibold">Customer</th>
                                <th className="px-4 py-3 font-semibold">Date</th>
                                <th className="px-4 py-3 font-semibold">Amount</th>
                                <th className="px-4 py-3 font-semibold">Status</th>
                                <th className="px-4 py-3 text-right font-semibold">Actions</th>
                            </tr>
                        </thead>
                        {/* Sales records loaded from the FastAPI /ShowSales endpoint */}
                        <tbody>
                            {isLoading && (
                                <tr>
                                    <td colSpan="6" className="px-5 py-10 text-center text-gray-400">
                                        Loading sales...
                                    </td>
                                </tr>
                            )}
                            {!isLoading && loadError && (
                                <tr>
                                    <td colSpan="6" className="px-5 py-10 text-center text-red-300">
                                        {loadError}. Make sure the FastAPI server is running.
                                    </td>
                                </tr>
                            )}
                            {!isLoading && !loadError && paginatedSales.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-5 py-10 text-center text-gray-400">
                                        No sales found.
                                    </td>
                                </tr>
                            )}
                            {paginatedSales.map((sale) => (
                                <tr
                                    key={sale.invoiceId}
                                    data-search-target={sale.invoiceId}
                                    className={`border-b border-white/10 text-sm text-gray-300 last:border-b-0 ${sale.invoiceId === highlightedId && highlightActive ? "search-result-highlight" : ""}`}
                                >
                                    <td className="whitespace-nowrap px-4 py-3.5 text-sm">
                                        #{sale.invoiceId}
                                    </td>
                                    <td className="px-4 py-3.5">
                                        {/* Customer avatar initials, name, and email */}
                                        <div className="flex items-center gap-2">
                                            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#294324] text-[10px] font-bold text-white">
                                                {sale.customer.initials}
                                            </span>
                                            <div>
                                                <p className="font-bold text-white">{sale.customer.name}</p>
                                                <p className="text-xs text-gray-400">{sale.customer.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3.5">{sale.displayDate}</td>
                                    <td className="whitespace-nowrap px-4 py-3.5 font-bold text-white">
                                        {formatAmount(sale.amount, sale.currency)}
                                    </td>
                                    <td className="px-4 py-3.5">
                                        {/* Status badge */}
                                        <span className={`inline-flex rounded-full border px-4 py-1 text-xs font-bold uppercase tracking-wider ${statusStyles[sale.status]}`}>
                                            {sale.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => printInvoice(sale.invoiceId)}
                                                className="cursor-pointer rounded-lg border border-[#36562f] px-3 py-1.5 text-xs font-semibold text-gray-300 transition-colors hover:bg-[#315f25] hover:text-white"
                                                aria-label={`Print ${sale.invoiceId}`}
                                            >
                                                {printingInvoiceId === sale.invoiceId ? <span>Printing...</span> : <FiPrinter />}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => downloadInvoicePdf(sale.invoiceId)}
                                                className="cursor-pointer rounded-lg border border-[#36562f] px-3 py-1.5 text-xs font-semibold text-gray-300 transition-colors hover:bg-[#315f25] hover:text-white"
                                                aria-label={`Download PDF for ${sale.invoiceId}`}
                                            >
                                                {downloadingInvoiceId === sale.invoiceId ? <span>Opening...</span> : <FiFileText />}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => openEditModal(sale)}
                                                className="cursor-pointer rounded-lg border border-[#36562f] px-3 py-1.5 text-xs font-semibold text-gray-300 transition-colors hover:bg-[#315f25] hover:text-white"
                                                aria-label={`Edit ${sale.invoiceId}`}
                                            >
                                                Edit
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Report footer containing result count and pagination */}
                <div className="flex flex-col gap-3 border-t border-white/10 px-4 py-3 text-sm text-gray-300 sm:flex-row sm:items-center sm:justify-between">
                    {/* Visible and total sales count */}
                    <p>
                        Showing <strong className="text-white">{paginatedSales.length}</strong> of{" "}
                        <strong className="text-white">{filteredSales.length}</strong> sales
                    </p>

                    {/* Pagination controls */}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                            disabled={currentPage === 1}
                            className="grid size-9 place-items-center rounded-lg hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                            aria-label="Previous page"
                        >
                            <FiChevronLeft />
                        </button>
                        {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                            <button
                                key={page}
                                type="button"
                                onClick={() => setCurrentPage(page)}
                                className={`grid size-9 place-items-center rounded-lg font-semibold cursor-pointer ${page === currentPage
                                    ? "bg-[#63b447] text-black"
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
                            className="grid size-9 place-items-center rounded-lg hover:bg-white/5 disabled:opacity-40 cursor-pointer"
                            aria-label="Next page"
                        >
                            <FiChevronRight />
                        </button>
                    </div>
                </div>
            </section>

            {/* Edit sale modal and blurred dashboard backdrop */}
            {editingSale && (
                <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto p-4">
                    <button
                        type="button"
                        onClick={() => {
                            if (!isDeleting && !isSaving) setEditingSale(null);
                        }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-md"
                        aria-label="Close edit sale dialog"
                    />

                    <form
                        onSubmit={saveEditedSale}
                        className="relative z-10 my-auto w-full max-w-2xl rounded-2xl border border-[#36562f] bg-[#121812] p-5 shadow-2xl sm:p-7"
                    >
                        <div className="mb-6 flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-white">Edit Sale</h2>
                                <p className="mt-1 text-sm text-gray-400">Update the invoice and customer details.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditingSale(null)}
                                disabled={isDeleting || isSaving}
                                className="grid size-9 place-items-center rounded-lg text-xl text-[#c7d0c5] hover:bg-white/10 hover:text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                                aria-label="Close edit sale dialog"
                            >
                                ×
                            </button>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="grid gap-2 text-sm font-semibold text-[#c7d0c5]">
                                Invoice ID
                                <input
                                    required
                                    value={editingSale.invoiceId}
                                    readOnly
                                    className="cursor-not-allowed rounded-lg border border-[#36562f] bg-white/5 px-3 py-2.5 text-gray-400 outline-none"
                                />
                            </label>

                            <label className="grid gap-2 text-sm font-semibold text-[#c7d0c5]">
                                Date
                                <div className="relative">
                                    <input
                                        required
                                        type="date"
                                        value={editingSale.date}
                                        onChange={(event) => updateEditingSale("date", event.target.value)}
                                        className="custom-date-input w-full rounded-lg border border-[#36562f] bg-[#0b100b] py-2.5 pl-3 pr-10 text-[#ffffff] outline-none focus:border-[#63b447]"
                                    />
                                    <FiCalendar className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-lg text-white" />
                                </div>
                            </label>

                            <label className="grid gap-2 text-sm font-semibold text-[#c7d0c5]">
                                Customer name
                                <input
                                    required
                                    value={editingSale.customer.name}
                                    onChange={(event) => updateEditingCustomer("name", event.target.value)}
                                    className="rounded-lg border border-[#36562f] bg-[#0b100b] px-3 py-2.5 text-[#ffffff] outline-none focus:border-[#63b447]"
                                />
                            </label>

                            <label className="grid gap-2 text-sm font-semibold text-[#c7d0c5]">
                                Customer email
                                <input
                                    required
                                    type="email"
                                    value={editingSale.customer.email}
                                    onChange={(event) => updateEditingCustomer("email", event.target.value)}
                                    className="rounded-lg border border-[#36562f] bg-[#0b100b] px-3 py-2.5 text-[#ffffff] outline-none focus:border-[#63b447]"
                                />
                            </label>

                            <label className="grid gap-2 text-sm font-semibold text-[#c7d0c5]">
                                Due date
                                <div className="relative">
                                    <input
                                        required
                                        type="date"
                                        value={editingSale.dueDate}
                                        onChange={(event) => updateEditingSale("dueDate", event.target.value)}
                                        className="custom-date-input w-full rounded-lg border border-[#36562f] bg-[#0b100b] py-2.5 pl-3 pr-10 text-[#ffffff] outline-none focus:border-[#63b447]"
                                    />
                                    <FiCalendar className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-lg text-white" />
                                </div>
                            </label>

                            <label className="grid gap-2 text-sm font-semibold text-[#c7d0c5]">
                                Amount
                                <input
                                    required
                                    min="0"
                                    step="0.01"
                                    type="number"
                                    value={editingSale.amount}
                                    onChange={(event) => updateEditingSale("amount", event.target.value)}
                                    className="rounded-lg border border-[#36562f] bg-[#0b100b] px-3 py-2.5 text-[#ffffff] outline-none focus:border-[#63b447]"
                                />
                            </label>

                            <label className="grid gap-2 text-sm font-semibold text-[#c7d0c5]">
                                Currency
                                <div className="relative">
                                    <select
                                        value={editingSale.currency}
                                        onChange={(event) => updateEditingSale("currency", event.target.value)}
                                        className="w-full appearance-none rounded-lg border border-[#36562f] bg-[#0b100b] py-2.5 pl-3 pr-10 text-[#ffffff] outline-none focus:border-[#63b447]"
                                    >
                                        <option value="PKR">PKR</option>
                                    </select>
                                    <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-lg text-white" />
                                </div>
                            </label>

                            <label className="grid gap-2 text-sm font-semibold text-[#c7d0c5]">
                                Status
                                <div className="relative">
                                    <select
                                        value={editingSale.status}
                                        onChange={(event) => updateEditingSale("status", event.target.value)}
                                        className="w-full appearance-none rounded-lg border border-[#36562f] bg-[#0b100b] py-2.5 pl-3 pr-10 capitalize text-[#ffffff] outline-none focus:border-[#63b447]"
                                    >
                                        <option value="paid">Paid</option>
                                        <option value="pending">Pending</option>
                                        <option value="overdue">Overdue</option>
                                    </select>
                                    <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-lg text-white" />
                                </div>
                            </label>
                        </div>

                        {(saveError || deleteError) && (
                            <p className="mt-5 rounded-lg border border-red-900/60 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                                {saveError || deleteError}
                            </p>
                        )}

                        <div className="mt-7 flex items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={deleteSale}
                                disabled={isDeleting || isSaving}
                                className="cursor-pointer rounded-lg border border-red-800/70 bg-red-500/10 px-5 py-2.5 font-bold text-red-300 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isDeleting ? "Deleting..." : "Delete"}
                            </button>
                            <button
                                type="submit"
                                disabled={isDeleting || isSaving}
                                className="rounded-lg bg-[#63b447] px-5 py-2.5 font-bold text-[#000000] transition-colors hover:bg-[#74c957] cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isSaving ? "Saving..." : "Save changes"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </>
    )
}

export default SalesReport
