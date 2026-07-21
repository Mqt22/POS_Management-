import { useEffect, useMemo, useState } from "react";
import { FaRegClock } from "react-icons/fa";
import { CiWarning } from "react-icons/ci";
import { FaChartColumn } from "react-icons/fa6";
import Box from "../Component/Box";
import { MdPointOfSale } from "react-icons/md";
import SalesReport from "../Component/SalesReport";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const getInitials = (name) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase())
    .join("")
    .slice(0, 2);

const formatDate = (date) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));

const Sales = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSales = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/ShowSales`);
        if (!response.ok) {
          throw new Error(`Unable to load sales (${response.status})`);
        }

        const sales = await response.json();
        setSalesData(
          sales.map((sale) => ({
            invoiceId: sale.invoice_id,
            customer: {
              name: sale.customer_name,
              email: sale.customer_email,
              initials: getInitials(sale.customer_name),
            },
            date: sale.invoice_date,
            displayDate: formatDate(sale.invoice_date),
            dueDate: sale.due_date,
            amount: sale.amount,
            currency: sale.currency,
            status: sale.status,
          }))
        );
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    };

    loadSales();
  }, []);

  const summary = useMemo(() => {
    const overdueSales = salesData.filter((sale) => sale.status === "overdue");
    const today = new Date();
    const overdueDays = overdueSales.map((sale) => {
      const dueDate = new Date(`${sale.dueDate}T00:00:00`);
      return Math.max(0, Math.floor((today - dueDate) / 86400000));
    });

    return {
      totalSales: salesData.reduce((total, sale) => total + sale.amount, 0),
      pendingInvoices: salesData.filter((sale) => sale.status === "pending").length,
      overdueInvoices: overdueSales.length,
      averageOverdueDays: overdueDays.length
        ? Math.round(overdueDays.reduce((total, days) => total + days, 0) / overdueDays.length)
        : 0,
    };
  }, [salesData]);

  const formatAmount = (amount) =>
    new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <main className="min-h-0 flex-1 overflow-y-auto bg-[#080b08] p-4 text-white md:p-6 lg:p-8">
      <div className="mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#74c957]">
            Sales &amp; Billing
          </p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Sales Overview</h1>
        </div>
      </div>

      {/* Dashboard summary cards grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-4 mb-6">
        <Box
          width="100%"
          height="120px"
          Subtitle="Total sales"
          Title="All recorded invoices"
          Amount={loading ? "Loading..." : formatAmount(summary.totalSales)}
          Icon={MdPointOfSale}
          color="#63b447"
        />
        <Box
          width="100%"
          height="120px"  
          Subtitle="Pending Invoices"
          Title="Awaiting payment"
          Amount={loading ? "..." : summary.pendingInvoices}
          Icon={FaRegClock}
          color="white"
        />
        <Box
          width="100%"
          height="120px"
          Subtitle="Overdue"
          Title="Past due date"
          Amount={loading ? "..." : summary.overdueInvoices}
          Icon={CiWarning}
          color="white"
        />
        <Box
          width="100%"
          height="120px"
          Subtitle="Avg. Overdue"
          Title="Average late period"
          Amount={loading ? "..." : `${summary.averageOverdueDays} days`}
          Icon={FaChartColumn}
          color="white"
        />
      </div>
      <SalesReport
        salesData={salesData}
        setSalesData={setSalesData}
        loading={loading}
        error={error}
      />
    </main>
  )
}

export default Sales
