import { MdInventory2, MdOutlineInventory, MdSwapVert } from "react-icons/md";
import { FiAlertTriangle, FiPackage } from "react-icons/fi";
import Box from "../Component/Box.jsx";
import InventoryReport from "../Component/InventoryReport.jsx";
import { FaBoxOpen } from "react-icons/fa";

const lowStockItems = [
    { 
        name: "Thermal Paper", 
        quantity: 7, 
        level: "Critical" 
    },
    { 
        name: "USB-C Adapter", 
        quantity: 14, 
        level: "Low" 
    },
    { 
        name: "Shipping Labels", 
        quantity: 18, 
        level: "Low" 
    },
];

const stockMovements = [
    { product: "Claw Hammer 16oz", type: "Purchase", quantity: 20, direction: "in" },
    { product: "PVC Pipe 1 inch", type: "Sale", quantity: 6, direction: "out" },
    { product: "Steel Nails 2 inch", type: "Adjustment", quantity: 3, direction: "out" },
];

const Inventory = () => {
    return (
        <main className="min-h-0 flex-1 overflow-y-auto bg-[#080b08] p-4 text-white md:p-6 lg:p-8">
            {/* Dashboard summary cards grid */}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-4 mb-6">
                <Box
                    width="100%"
                    height="120px"
                    Subtitle="Total Products"
                    Title="All inventory items"
                    Amount="80"
                    Icon={MdInventory2}
                    color="#74c957"
                />
                <Box
                    width="100%"
                    height="120px"
                    Subtitle="Total Stock"
                    Title="Units currently available"
                    Amount="1,240"
                    Icon={FiPackage}
                    color="white"
                />
                <Box
                    width="100%"
                    height="120px"
                    Subtitle="Low Stock"
                    Title="Items needing reorder"
                    Amount="12"
                    Icon={FiAlertTriangle}
                    color="#facc15"
                />
                <Box
                    width="100%"
                    height="120px"
                    Subtitle="Out of Stock"
                    Title="Currently unavailable"
                    Amount="5"
                    Icon={MdOutlineInventory}
                    color="#f87171"
                />
            </div>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
                <InventoryReport />
                <aside className="grid min-w-0 gap-4 sm:grid-cols-2 xl:col-span-1 xl:grid-cols-1 xl:grid-rows-2">
                    {/* Inventory low-stock widget */}
                    <section className="flex min-h-0 w-full flex-col rounded-2xl border border-[#36562f] bg-gradient-to-br from-[#172117] to-[#0e120e] p-5 shadow-lg">
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
                                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${item.level === "Critical"
                                        ? "bg-[#63b447]/20 text-[#8bd174]"
                                        : "bg-white/10 text-gray-300"
                                        }`}>
                                        {item.level}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Recent stock-movement widget */}
                    <section className="flex min-h-0 w-full flex-col rounded-2xl border border-[#36562f] bg-gradient-to-br from-[#172117] to-[#0e120e] p-5 shadow-lg">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-[#77bd60]">Activity</p>
                                <h3 className="mt-1 text-lg font-bold text-white">Stock Movement</h3>
                            </div>
                            <span className="grid size-11 place-items-center rounded-xl bg-[#63b447]/15 text-2xl text-[#74c957]">
                                <MdSwapVert />
                            </span>
                        </div>

                        <div className="space-y-2">
                            {stockMovements.map((movement) => (
                                <div key={`${movement.product}-${movement.type}`} className="flex items-center justify-between gap-3 rounded-xl bg-black/15 px-3 py-2.5">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-white">{movement.product}</p>
                                        <p className="text-xs text-gray-400">{movement.type}</p>
                                    </div>
                                    <span className={`shrink-0 text-sm font-bold ${movement.direction === "in" ? "text-[#8bd174]" : "text-red-300"}`}>
                                        {movement.direction === "in" ? "+" : "-"}{movement.quantity}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>
                </aside>
            </div>
        </main>
    )
}

export default Inventory
