import {
  FiArrowDownRight,
  FiArrowUpRight,
  FiDownload,
  FiFileText,
  FiTrendingUp,
} from "react-icons/fi";
import {
  expenseBreakdown,
  financialSummary,
  monthlyFinancials,
  profitSources,
  reportActivity,
} from "../Data/ReportsData.jsx";

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

const Reports = () => {
  return (
    <main className="min-h-0 flex-1 overflow-y-auto bg-[#080b08] p-4 text-white md:p-6 lg:p-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#74c957]">Financial Overview</p>
          <h1 className="mt-1 text-2xl font-bold md:text-3xl">Profit &amp; Loss Report</h1>
          <p className="mt-1 text-sm text-[#8f9b8d]">Monitor revenue, expenses, and business profitability.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="rounded-lg border border-[#36562f] bg-[#121812] px-4 py-2.5 text-sm font-semibold text-[#c7d0c5] hover:bg-white/5">Last 30 Days</button>
          <button type="button" className="flex items-center gap-2 rounded-lg border border-[#36562f] bg-[#121812] px-4 py-2.5 text-sm font-semibold text-[#c7d0c5] hover:bg-white/5"><FiFileText />Export PDF</button>
          <button type="button" className="flex items-center gap-2 rounded-lg bg-[#63b447] px-4 py-2.5 text-sm font-bold text-black hover:bg-[#74c957]"><FiDownload />Excel</button>
        </div>
      </header>

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

      <section className="mt-4 grid min-w-0 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
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
                  <span className="w-2/5 rounded-t bg-[#63b447]" style={{ height: `${item.revenue}%` }} title={`Revenue ${item.revenue}%`} />
                  <span className="w-2/5 rounded-t bg-[#4b6f45]" style={{ height: `${item.expenses}%` }} title={`Expenses ${item.expenses}%`} />
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
          </div>
          <div className="mt-8 flex gap-3 rounded-xl bg-[#63b447]/10 p-4">
            <FiTrendingUp className="mt-0.5 shrink-0 text-xl text-[#74c957]" />
            <div>
              <p className="text-xs font-bold uppercase text-[#74c957]">Optimization tip</p>
              <p className="mt-1 text-sm text-[#c7d0c5]">Hardware sales are currently your strongest profit source.</p>
            </div>
          </div>
        </article>
      </section>

      <section className="mt-4 grid min-w-0 gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <article className="rounded-2xl border border-[#36562f] bg-[#121812] p-5">
          <h2 className="text-lg font-bold">Activity Logs</h2>
          <div className="mt-5 space-y-5">
            {reportActivity.map((activity) => (
              <div key={activity.id} className="flex gap-3">
                <span className="mt-1 size-2 shrink-0 rounded-full bg-[#63b447]" />
                <div className="min-w-0">
                  <div className="flex flex-wrap justify-between gap-2">
                    <p className="text-sm font-bold">{activity.title}</p>
                    <span className="text-[10px] text-[#8f9b8d]">{activity.time}</span>
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
                  <tr key={expense.id} className="border-b border-white/10 text-sm last:border-b-0">
                    <td className="px-5 py-5 font-semibold">{expense.category}</td>
                    <td className="px-5 py-5 text-[#c7d0c5]">{expense.vendor}</td>
                    <td className="whitespace-nowrap px-5 py-5 text-[#c7d0c5]">{expense.date}</td>
                    <td className="whitespace-nowrap px-5 py-5 text-right font-bold">{formatAmount(expense.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </main>
  );
};

export default Reports;
