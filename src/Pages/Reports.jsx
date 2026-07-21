import { useEffect, useState } from "react";
import {
  FiArrowDownRight,
  FiArrowUpRight,
  FiDownload,
  FiFileText,
  FiTrendingUp,
} from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const formatAmount = (amount) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(amount);

const summaryStyles = {
  green: "bg-[#63b447]/15 text-[#8bd174]",
  red: "bg-red-500/10 text-red-300",
  blue: "bg-blue-500/10 text-blue-300",
};

const formatDate = (date) => new Intl.DateTimeFormat("en-PK", {
  day: "2-digit",
  month: "short",
  year: "numeric",
}).format(new Date(`${date}T00:00:00`));

const formatActivityTime = (createdAt) => {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  return `${Math.floor(seconds / 86400)} day(s) ago`;
};

const Reports = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  // Load the calculated financial report instead of the old JSX sample data.
  useEffect(() => {
    const loadReport = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/reports?days=30`);
        if (!response.ok) throw new Error("Unable to load the financial report.");
        setReport(await response.json());
        setError("");
      } catch (requestError) {
        setError(requestError.message || "Unable to load the financial report.");
      } finally {
        setLoading(false);
      }
    };
    loadReport();
  }, []);

  const exportExpensesToExcel = () => {
    if (!report) return;

    setExportingExcel(true);
    try {
      const headers = ["Category", "Vendor", "Date", "Amount"];
      const rows = expenseBreakdown.map((expense) => ([
        expense.category,
        expense.vendor,
        expense.expense_date,
        expense.amount,
      ]));

      const escapeCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
      const csvContent = [headers, ...rows]
        .map((row) => row.map(escapeCell).join(","))
        .join("\n");

      const file = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const downloadUrl = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `report-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
    } finally {
      setExportingExcel(false);
    }
  };

  const exportReportToPdf = () => {
    if (!report) return;

    setExportingPdf(true);
    try {
      const reportWindow = window.open("", "_blank", "width=900,height=1000");
      if (!reportWindow) {
        throw new Error("Popup blocked");
      }

      const summaryMarkup = financialSummary.map((item) => `
        <tr>
          <td>${item.label}</td>
          <td>${formatAmount(item.value)}</td>
          <td>${item.change}</td>
        </tr>
      `).join("");

      const monthlyMarkup = monthlyFinancials.map((item) => `
        <tr>
          <td>${item.month}</td>
          <td>${formatAmount(item.revenue)}</td>
          <td>${formatAmount(item.expenses)}</td>
        </tr>
      `).join("");

      const expenseMarkup = expenseBreakdown.map((expense) => `
        <tr>
          <td>${expense.category}</td>
          <td>${expense.vendor}</td>
          <td>${formatDate(expense.expense_date)}</td>
          <td>${formatAmount(expense.amount)}</td>
        </tr>
      `).join("");

      reportWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Profit and Loss Report</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 32px; color: #111827; }
              h1, h2 { margin: 0 0 10px; }
              p { margin: 0 0 16px; color: #4b5563; }
              .section { margin-top: 28px; }
              table { width: 100%; border-collapse: collapse; margin-top: 12px; }
              th, td { border: 1px solid #d1d5db; padding: 10px; text-align: left; font-size: 14px; }
              th { background: #f3f4f6; }
              .tip { margin-top: 12px; padding: 12px; background: #f0fdf4; border: 1px solid #86efac; }
            </style>
          </head>
          <body>
            <h1>Profit & Loss Report</h1>
            <p>Generated on ${new Intl.DateTimeFormat("en-PK", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            }).format(new Date())}</p>

            <div class="section">
              <h2>Summary</h2>
              <table>
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Value</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>${summaryMarkup}</tbody>
              </table>
            </div>

            <div class="section">
              <h2>Monthly Financials</h2>
              <table>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Revenue</th>
                    <th>Expenses</th>
                  </tr>
                </thead>
                <tbody>${monthlyMarkup}</tbody>
              </table>
            </div>

            <div class="section">
              <h2>Expense Breakdown</h2>
              <table>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Vendor</th>
                    <th>Date</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>${expenseMarkup}</tbody>
              </table>
            </div>

            <div class="section">
              <h2>Optimization Tip</h2>
              <div class="tip">${report.optimization_tip || "No recommendation available."}</div>
            </div>
          </body>
        </html>
      `);
      reportWindow.document.close();
      reportWindow.focus();
      reportWindow.print();
    } finally {
      setExportingPdf(false);
    }
  };

  const summary = report?.summary;
  const financialSummary = summary ? [
    { label: "Total Revenue", value: summary.total_revenue, change: `${summary.revenue_change >= 0 ? "+" : ""}${summary.revenue_change}%`, tone: "green" },
    { label: "Total Expenses", value: summary.total_expenses, change: `${summary.expense_change >= 0 ? "+" : ""}${summary.expense_change}%`, tone: "red" },
    { label: "Gross Profit", value: summary.gross_profit, change: `${summary.gross_margin}% Margin`, tone: "green" },
    { label: "Net Profit", value: summary.net_profit, change: summary.net_profit >= 0 ? "Profit" : "Loss", tone: "blue" },
  ] : [];
  const monthlyFinancials = report?.monthly_financials || [];
  const profitSources = report?.profit_sources || [];
  const expenseBreakdown = report?.expense_breakdown || [];
  const reportActivity = report?.activity_logs || [];
  const chartMaximum = Math.max(
    1,
    ...monthlyFinancials.flatMap((item) => [item.revenue, item.expenses])
  );

  return (
    <main className="min-h-0 flex-1 overflow-y-auto bg-[#080b08] p-4 text-white md:p-6 lg:p-8">
      {/* Report heading and export controls */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#74c957]">Financial Overview</p>
          <h1 className="mt-1 text-2xl font-bold md:text-3xl">Profit &amp; Loss Report</h1>
          <p className="mt-1 text-sm text-[#8f9b8d]">Monitor revenue, expenses, and business profitability.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="rounded-lg border border-[#36562f] bg-[#121812] px-4 py-2.5 text-sm font-semibold text-[#c7d0c5] hover:bg-white/5">Last 30 Days</button>
          <button
            type="button"
            onClick={exportReportToPdf}
            disabled={loading || !report || exportingPdf}
            className="flex items-center gap-2 rounded-lg border border-[#36562f] bg-[#121812] px-4 py-2.5 text-sm font-semibold text-[#c7d0c5] hover:bg-white/5 disabled:opacity-50"
          >
            <FiFileText />
            {exportingPdf ? "Exporting..." : "Export PDF"}
          </button>
          <button
            type="button"
            onClick={exportExpensesToExcel}
            disabled={loading || !report || exportingExcel}
            className="flex items-center gap-2 rounded-lg bg-[#63b447] px-4 py-2.5 text-sm font-bold text-black hover:bg-[#74c957] disabled:opacity-50"
          >
            <FiDownload />
            {exportingExcel ? "Exporting..." : "Excel"}
          </button>
        </div>
      </header>

      {loading && <p className="mt-6 rounded-xl border border-[#36562f] bg-[#121812] p-5 text-center text-[#8f9b8d]">Loading financial report...</p>}
      {error && <p className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-center text-red-300">{error}</p>}

      {/* High-level revenue, expense, and profit cards */}
      <section className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(min(100%,210px),1fr))] gap-4">
        {financialSummary.map((item, index) => (
          <article key={item.label} className="rounded-2xl border border-[#36562f] bg-[#121812] p-5">
            <div className="flex items-start justify-between gap-3">
              <span className={`grid size-10 place-items-center rounded-xl text-lg ${summaryStyles[item.tone]}`}>
                {index === 1 ? <FiArrowDownRight /> : <FiArrowUpRight />}
              </span>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${summaryStyles[item.tone]}`}>{item.change}</span>
            </div>
            <p className="mt-5 text-xs font-semibold text-[#8f9b8d]">{item.label}</p>
            <p className="mt-1 text-xl font-bold md:text-2xl">{formatAmount(item.value)}</p>
          </article>
        ))}
      </section>

      {/* Monthly comparison chart and profit-source breakdown */}
      <section className="mt-4 grid min-w-0 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
        <article className="min-w-0 rounded-2xl border border-[#36562f] bg-[#121812] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Revenue vs Expenses</h2>
              <p className="mt-1 text-xs text-[#8f9b8d]">Monthly trend comparison for the current fiscal year</p>
            </div>
            <div className="flex gap-4 text-xs font-semibold text-[#c7d0c5]">
              <span className="flex items-center gap-2"><i className="size-2 rounded-full bg-[#63b447]" />Revenue</span>
              <span className="flex items-center gap-2"><i className="size-2 rounded-full bg-[#4b6f45]" />Expenses</span>
            </div>
          </div>

          <div className="mt-8 flex h-64 items-end justify-between gap-2 border-b border-white/10 px-1 sm:gap-4">
            {monthlyFinancials.map((item) => (
              <div key={item.month} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
                <div className="flex h-[85%] w-full max-w-14 items-end justify-center gap-1">
                  <span className="w-2/5 rounded-t bg-[#63b447]" style={{ height: `${(item.revenue / chartMaximum) * 100}%` }} title={`Revenue ${formatAmount(item.revenue)}`} />
                  <span className="w-2/5 rounded-t bg-[#4b6f45]" style={{ height: `${(item.expenses / chartMaximum) * 100}%` }} title={`Expenses ${formatAmount(item.expenses)}`} />
                </div>
                <span className="mt-3 text-[10px] font-bold uppercase text-[#8f9b8d]">{item.month}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-[#36562f] bg-[#121812] p-5">
          <h2 className="text-lg font-bold">Monthly Profit</h2>
          <p className="mt-1 text-xs text-[#8f9b8d]">Profitability breakdown</p>
          <div className="mt-6 space-y-6">
            {profitSources.map((source) => (
              <div key={source.label}>
                <div className="mb-2 flex justify-between gap-3 text-sm font-semibold">
                  <span>{source.label}</span>
                  <span>{source.value}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#243024]">
                  <div className="h-full rounded-full bg-[#63b447]" style={{ width: `${source.value}%` }} />
                </div>
              </div>
            ))}
            {profitSources.length === 0 && <p className="text-sm text-[#8f9b8d]">Profit sources will appear after checkout sales.</p>}
          </div>
          <div className="mt-8 flex gap-3 rounded-xl bg-[#63b447]/10 p-4">
            <FiTrendingUp className="mt-0.5 shrink-0 text-xl text-[#74c957]" />
            <div>
              <p className="text-xs font-bold uppercase text-[#74c957]">Optimization tip</p>
              <p className="mt-1 text-sm text-[#c7d0c5]">{report?.optimization_tip || "Complete checkout sales to receive a product recommendation."}</p>
            </div>
          </div>
        </article>
      </section>

      {/* Recent financial activity and detailed expense table */}
      <section className="mt-4 grid min-w-0 gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <article className="rounded-2xl border border-[#36562f] bg-[#121812] p-5">
          <h2 className="text-lg font-bold">Activity Logs</h2>
          <div className="mt-5 space-y-5">
            {reportActivity.map((activity) => (
              <div key={activity.id} className="flex gap-3">
                <span className="mt-1 size-2 shrink-0 rounded-full bg-[#63b447]" />
                <div className="min-w-0">
                  <div className="flex flex-wrap justify-between gap-2">
                    <p className="text-sm font-bold">{activity.title}</p>
                    <span className="text-[10px] text-[#8f9b8d]">{formatActivityTime(activity.created_at)}</span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-[#8f9b8d]">{activity.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="min-w-0 overflow-hidden rounded-2xl border border-[#36562f] bg-[#121812]">
          <div className="border-b border-white/10 p-5">
            <h2 className="text-lg font-bold">Expense Breakdown</h2>
            <p className="mt-1 text-xs text-[#8f9b8d]">Detailed view of operational costs</p>
          </div>
          <div className="sales-table-scrollbar overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead className="bg-[#182218] text-xs uppercase tracking-wide text-[#c7d0c5]">
                <tr>
                  <th className="px-5 py-4">Category</th>
                  <th className="px-5 py-4">Vendor</th>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenseBreakdown.map((expense) => (
                  <tr key={expense.expense_id} className="border-b border-white/10 text-sm last:border-b-0">
                    <td className="px-5 py-5 font-semibold">{expense.category}</td>
                    <td className="px-5 py-5 text-[#c7d0c5]">{expense.vendor}</td>
                    <td className="whitespace-nowrap px-5 py-5 text-[#c7d0c5]">{formatDate(expense.expense_date)}</td>
                    <td className="whitespace-nowrap px-5 py-5 text-right font-bold">{formatAmount(expense.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && expenseBreakdown.length === 0 && <p className="p-8 text-center text-sm text-[#8f9b8d]">No expenses recorded for this period.</p>}
          </div>
        </article>
      </section>
    </main>
  );
};

export default Reports;
