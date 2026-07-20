import { useEffect, useState } from 'react'
import { useLocation } from "react-router-dom";
import { recentSales, recentSalesSummary } from "../Data/SampleData.jsx";
import { FiCalendar, FiChevronDown, FiChevronLeft, FiChevronRight, FiDownload, FiFilter } from "react-icons/fi";

const SalesReport = () => {
    const { state } = useLocation();
    const [salesData, setSalesData] = useState(recentSales);
    const [activeFilter, setActiveFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(recentSalesSummary.currentPage);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [editingSale, setEditingSale] = useState(null);
    const salesPerPage = recentSalesSummary.displayedSales;
    const highlightedId = state?.searchType === "Sales Invoices" ? state.searchTarget : null;

    useEffect(() => {
        if (!highlightedId) return undefined;
        const saleIndex = salesData.findIndex((sale) => sale.invoiceId === highlightedId);
        if (saleIndex < 0) return undefined;

        const timeout = window.setTimeout(() => {
            setActiveFilter("all");
            setCurrentPage(Math.floor(saleIndex / salesPerPage) + 1);
            window.setTimeout(() => {
                document.querySelector(`[data-search-target="${highlightedId}"]`)
                    ?.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 50);
        }, 0);
        return () => window.clearTimeout(timeout);
    }, [highlightedId, salesData, salesPerPage]);

    const filteredSales = activeFilter === "all"
        ? salesData
        : salesData.filter((sale) => sale.status === activeFilter);
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
        setEditingSale({
            ...sale,
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

    const saveEditedSale = (event) => {
        event.preventDefault();

        const displayDate = new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            timeZone: "UTC",
        }).format(new Date(`${editingSale.date}T00:00:00Z`));
        const updatedSale = {
            ...editingSale,
            amount: Number(editingSale.amount),
            displayDate,
        };

        setSalesData((sales) =>
            sales.map((sale) => sale.id === updatedSale.id ? updatedSale : sale)
        );
        setEditingSale(null);
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
                                <th className="px-5 py-4 font-semibold">Invoice ID</th>
                                <th className="px-5 py-4 font-semibold">Customer</th>
                                <th className="px-5 py-4 font-semibold">Date</th>
                                <th className="px-5 py-4 font-semibold">Amount</th>
                                <th className="px-5 py-4 font-semibold">Status</th>
                                <th className="px-5 py-4 text-right font-semibold">Actions</th>
                            </tr>
                        </thead>
                        {/* Sales records loaded from SampleData\\.jsx */}
                        <tbody>
                            {paginatedSales.map((sale) => (
                                <tr
                                    key={sale.id}
                                    data-search-target={sale.invoiceId}
                                    className={`border-b border-white/10 text-sm text-gray-300 last:border-b-0 ${sale.invoiceId === highlightedId ? "search-result-highlight" : ""}`}
                                >
                                    <td className="whitespace-nowrap px-5 py-5 text-base">
                                        #{sale.invoiceId}
                                    </td>
                                    <td className="px-5 py-5">
                                        {/* Customer avatar initials, name, and email */}
                                        <div className="flex items-center gap-3">
                                            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#294324] text-xs font-bold text-white">
                                                {sale.customer.initials}
                                            </span>
                                            <div>
                                                <p className="font-bold text-white">{sale.customer.name}</p>
                                                <p className="text-xs text-gray-400">{sale.customer.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-5 py-5">{sale.displayDate}</td>
                                    <td className="whitespace-nowrap px-5 py-5 font-bold text-white">
                                        {formatAmount(sale.amount, sale.currency)}
                                    </td>
                                    <td className="px-5 py-5">
                                        {/* Status badge */}
                                        <span className={`inline-flex rounded-full border px-4 py-1 text-xs font-bold uppercase tracking-wider ${statusStyles[sale.status]}`}>
                                            {sale.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-5 text-right">
                                        <button
                                            type="button"
                                            onClick={() => openEditModal(sale)}
                                            className="cursor-pointer rounded-lg border border-[#36562f] px-3 py-1.5 text-xs font-semibold text-gray-300 transition-colors hover:bg-[#315f25] hover:text-white"
                                            aria-label={`Edit ${sale.invoiceId}`}
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Report footer containing result count and pagination */}
                <div className="flex flex-col gap-4 border-t border-white/10 px-5 py-4 text-sm text-gray-300 sm:flex-row sm:items-center sm:justify-between">
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
                        onClick={() => setEditingSale(null)}
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
                                className="grid size-9 place-items-center rounded-lg text-xl text-[#c7d0c5] hover:bg-white/10 hover:text-white cursor-pointer"
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
                                    onChange={(event) => updateEditingSale("invoiceId", event.target.value)}
                                    className="rounded-lg border border-[#36562f] bg-[#0b100b] px-3 py-2.5 text-[#ffffff] outline-none focus:border-[#63b447]"
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
                                Customer initials
                                <input
                                    required
                                    maxLength={3}
                                    value={editingSale.customer.initials}
                                    onChange={(event) => updateEditingCustomer("initials", event.target.value.toUpperCase())}
                                    className="rounded-lg border border-[#36562f] bg-[#0b100b] px-3 py-2.5 uppercase text-[#ffffff] outline-none focus:border-[#63b447]"
                                />
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

                        <div className="mt-7 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setEditingSale(null)}
                                className="rounded-lg border border-[#36562f] px-5 py-2.5 font-semibold text-[#c7d0c5] hover:bg-white/5 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="rounded-lg bg-[#63b447] px-5 py-2.5 font-bold text-[#000000] transition-colors hover:bg-[#74c957] cursor-pointer"
                            >
                                Save changes
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </>
    )
}

export default SalesReport
