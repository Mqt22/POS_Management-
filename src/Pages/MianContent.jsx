import { useEffect, useMemo, useState } from "react";
import Box from "../Component/Box.jsx";
import { BiSolidPurchaseTag } from "react-icons/bi";
import { FaBox } from "react-icons/fa";
import { IoPieChartSharp } from "react-icons/io5";
import { MdInventory2, MdPointOfSale } from "react-icons/md";
import SalesReport from "../Component/SalesReport.jsx";
import PurchaseReport from "../Component/PurchaseReport.jsx";
import DashboardInsights from "../Component/DashboardInsights.jsx";
import {FiUsers} from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

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
    displayOrderDate: new Intl.DateTimeFormat("en-US", {
        month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
    }).format(new Date(`${purchase.order_date}T00:00:00Z`)),
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
});

const MianContent = () => {
    const [sales, setSales] = useState([]);
    const [salesLoading, setSalesLoading] = useState(true);
    const [salesError, setSalesError] = useState("");
    const [purchases, setPurchases] = useState([]);
    const [purchasesLoading, setPurchasesLoading] = useState(true);
    const [purchasesError, setPurchasesError] = useState("");
    const [directoryCounts, setDirectoryCounts] = useState({
        items: 0,
        customers: 0,
        suppliers: 0,
    });
    const [countsLoading, setCountsLoading] = useState(true);
    const [countsError, setCountsError] = useState("");

    useEffect(() => {
        const loadDashboardSales = async () => {
            try {
                setSalesLoading(true);
                setSalesError("");
                const response = await fetch(`${API_URL}/ShowSales`);
                if (!response.ok) {
                    throw new Error(`Unable to load sales (${response.status})`);
                }

                const backendSales = await response.json();
                setSales(backendSales.map(normalizeSale));
            } catch (requestError) {
                setSalesError(requestError.message || "Unable to load sales.");
            } finally {
                setSalesLoading(false);
            }
        };

        loadDashboardSales();
    }, []);

    useEffect(() => {
        const loadDashboardPurchases = async () => {
            try {
                setPurchasesLoading(true);
                setPurchasesError("");
                const response = await fetch(`${API_URL}/ShowPurchases`);
                if (!response.ok) {
                    throw new Error(`Unable to load purchases (${response.status})`);
                }
                const backendPurchases = await response.json();
                setPurchases(backendPurchases.map(normalizePurchase));
            } catch (requestError) {
                setPurchasesError(requestError.message || "Unable to load purchases.");
            } finally {
                setPurchasesLoading(false);
            }
        };

        loadDashboardPurchases();
    }, []);

    // Load the live record counts used by the dashboard summary cards.
    useEffect(() => {
        const loadDirectoryCounts = async () => {
            try {
                setCountsLoading(true);
                const [itemsResponse, customersResponse, suppliersResponse] = await Promise.all([
                    fetch(`${API_URL}/ShowInventory`),
                    fetch(`${API_URL}/ShowCustomers`),
                    fetch(`${API_URL}/ShowSuppliers`),
                ]);

                if (!itemsResponse.ok || !customersResponse.ok || !suppliersResponse.ok) {
                    throw new Error("Unable to load dashboard totals.");
                }

                const [items, customers, suppliers] = await Promise.all([
                    itemsResponse.json(),
                    customersResponse.json(),
                    suppliersResponse.json(),
                ]);
                setDirectoryCounts({
                    items: items.length,
                    customers: customers.length,
                    suppliers: suppliers.length,
                });
                setCountsError("");
            } catch (requestError) {
                setCountsError(requestError.message || "Unable to load dashboard totals.");
            } finally {
                setCountsLoading(false);
            }
        };

        loadDirectoryCounts();
    }, []);

    const totalSales = useMemo(
        () => sales.reduce((total, sale) => total + sale.amount, 0),
        [sales]
    );

    const totalPurchases = useMemo(
        () => purchases.reduce((total, purchase) => total + purchase.totalAmount, 0),
        [purchases]
    );

    const formattedTotalSales = new Intl.NumberFormat("en-PK", {
        style: "currency",
        currency: "PKR",
        maximumFractionDigits: 0,
    }).format(totalSales);

    const formattedTotalPurchases = new Intl.NumberFormat("en-PK", {
        style: "currency",
        currency: "PKR",
        maximumFractionDigits: 0,
    }).format(totalPurchases);

    return (
        // Main scrollable dashboard content area
        <main className="min-h-0 flex-1 overflow-y-auto bg-[#080b08] p-4 md:p-6 lg:p-8">
            {/* Dashboard summary cards grid */}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-4">
                <Box
                    width="100%"
                    height="120px"
                    Subtitle="Total sales"
                    Title="All recorded invoices"
                    Amount={salesLoading ? "Loading..." : salesError ? "Unavailable" : formattedTotalSales}
                    Icon={MdPointOfSale}
                    color="#63b447"
                />
                <Box
                    width="100%"
                    height="120px"
                    Subtitle="Total Purchases"
                    Title="All purchase value"
                    Amount={purchasesLoading ? "Loading..." : purchasesError ? "Unavailable" : formattedTotalPurchases}
                    Icon={BiSolidPurchaseTag}
                    color="white"
                />
                <Box
                    width="100%"
                    height="120px"
                    Subtitle="Total Items"
                    Title="Available products"
                    Amount={countsLoading ? "Loading..." : countsError ? "Unavailable" : directoryCounts.items}
                    Icon={MdInventory2}
                    color="white"
                />
                <Box
                    width="100%"
                    height="120px"
                    Subtitle="Total Customers"
                    Title="Registered customers"
                    Amount={countsLoading ? "Loading..." : countsError ? "Unavailable" : directoryCounts.customers}
                    Icon={FiUsers}
                    color="white"
                />
                <Box
                    width="100%"
                    height="120px"
                    Subtitle="Total Suppliers"
                    Title="Registered suppliers"
                    Amount={countsLoading ? "Loading..." : countsError ? "Unavailable" : directoryCounts.suppliers}
                    Icon={FaBox}
                    color="white"
                />                
                <Box
                    width="100%"
                    height="120px"
                    Subtitle="Total Revenue"
                    Title="All recorded revenue"
                    Amount={salesLoading ? "Loading..." : salesError ? "Unavailable" : formattedTotalSales}
                    Icon={IoPieChartSharp}
                    color="white"
                />
            </div>
            {/* Sales report and remaining module insights */}
            <div className="mt-6 grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
                <SalesReport
                    salesData={sales}
                    setSalesData={setSales}
                    loading={salesLoading}
                    error={salesError}
                />
                <DashboardInsights/>
            </div>
            <PurchaseReport
                purchaseData={purchases}
                setPurchaseData={setPurchases}
                loading={purchasesLoading}
                error={purchasesError}
            />
        </main>
    );
}

export default MianContent
