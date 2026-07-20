import { FaBoxOpen } from "react-icons/fa";
import { FiArrowUpRight } from "react-icons/fi";
import { IoPieChartSharp } from "react-icons/io5";

const lowStockItems = [
  { name: "Thermal Paper", quantity: 7, level: "Critical" },
  { name: "USB-C Adapter", quantity: 14, level: "Low" },
  { name: "Shipping Labels", quantity: 18, level: "Low" },
];

const DashboardInsights = () => {
  return (
    <aside className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-1">
      {/* Inventory low-stock widget */}
      <section className="rounded-2xl border border-[#36562f] bg-gradient-to-br from-[#172117] to-[#0e120e] p-5 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#77bd60]">Inventory</p>
            <h3 className="mt-1 text-lg font-bold text-white">Low Stock Alerts</h3>
          </div>
          <span className="grid size-11 place-items-center rounded-xl bg-[#63b447]/15 text-xl text-[#74c957]">
            <FaBoxOpen />
          </span>
        </div>

        <div className="space-y-2">
          {lowStockItems.map((item) => (
            <div key={item.name} className="flex items-center justify-between gap-3 rounded-xl bg-black/15 px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{item.name}</p>
                <p className="text-xs text-gray-400">{item.quantity} units remaining</p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                item.level === "Critical"
                  ? "bg-[#63b447]/20 text-[#8bd174]"
                  : "bg-white/10 text-gray-300"
              }`}>
                {item.level}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Finance cash-flow widget */}
      <section className="rounded-2xl border border-[#36562f] bg-gradient-to-br from-[#172117] to-[#0e120e] p-5 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#77bd60]">Finance</p>
            <h3 className="mt-1 text-lg font-bold text-white">Cash Flow</h3>
          </div>
          <span className="grid size-11 place-items-center rounded-xl bg-[#63b447]/15 text-xl text-[#74c957]">
            <IoPieChartSharp />
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-black/15 p-3">
            <p className="text-xs text-gray-400">Income</p>
            <p className="mt-1 text-lg font-bold text-[#74c957]">PKR 48,300</p>
          </div>
          <div className="rounded-xl bg-black/15 p-3">
            <p className="text-xs text-gray-400">Expenses</p>
            <p className="mt-1 text-lg font-bold text-gray-200">PKR 31,850</p>
          </div>
        </div>

        <div className="mt-3 flex items-end justify-between rounded-xl bg-black/15 p-3">
          <div>
            <p className="text-xs text-gray-400">Net profit</p>
            <p className="mt-1 text-xl font-bold text-white">PKR 16,450</p>
          </div>
          <span className="flex items-center gap-1 text-sm font-bold text-[#74c957]">
            <FiArrowUpRight />
            8.4%
          </span>
        </div>
      </section>
    </aside>
  );
};

export default DashboardInsights;
