import { MdInventory2, MdOutlineInventory, MdSwapVert } from "react-icons/md";
import { FiAlertTriangle, FiPackage } from "react-icons/fi";
import Box from "../Component/Box.jsx";
import InventoryReport from "../Component/InventoryReport.jsx";
import { FaBoxOpen } from "react-icons/fa";

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

const Inventory = () => {
    const [items, setItems] = useState([]);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const refreshActivities = async () => {
        try {
            const response = await fetch(`${API_URL}/ShowInventoryActivities`);
            if (response.ok) setActivities(await response.json());
        } catch {
            // The product update remains successful even if activity refresh fails.
        }
    };

    useEffect(() => {
        const loadInventory = async () => {
            try {
                setLoading(true);
                setError("");
                const [productsResponse, activitiesResponse] = await Promise.all([
                    fetch(`${API_URL}/ShowInventory`),
                    fetch(`${API_URL}/ShowInventoryActivities`),
                ]);
                if (!productsResponse.ok || !activitiesResponse.ok) {
                    throw new Error("Unable to load inventory data.");
                }

                const products = await productsResponse.json();
                const stockActivities = await activitiesResponse.json();
                setItems(products.map(normalizeInventoryProduct));
                setActivities(stockActivities);
            } catch (requestError) {
                setError(requestError.message || "Unable to load inventory data.");
            } finally {
                setLoading(false);
            }
        };

        loadInventory();
    }, []);

    const summary = useMemo(() => ({
        totalProducts: items.length,
        totalStock: items.reduce((total, item) => total + item.currentStock, 0),
        lowStock: items.filter(
            (item) => item.currentStock > 0 && item.currentStock <= item.minimumStock
        ).length,
        outOfStock: items.filter((item) => item.currentStock === 0).length,
    }), [items]);

    const lowStockItems = useMemo(
        () => items
            .filter((item) => item.currentStock <= item.minimumStock)
            .slice(0, 5)
            .map((item) => ({
                id: item.productId,
                name: item.productName,
                quantity: item.currentStock,
                level: item.currentStock === 0 ? "Out" : "Low",
            })),
        [items]
    );

    return (
        <main className="min-h-0 flex-1 overflow-y-auto bg-[#080b08] p-4 text-white md:p-6 lg:p-8">
            {/* Dashboard summary cards grid */}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-4 mb-6">
                <Box
                    width="100%"
                    height="120px"
                    Subtitle="Total Products"
                    Title="All inventory items"
                    Amount={loading ? "..." : error ? "Unavailable" : summary.totalProducts}
                    Icon={MdInventory2}
                    color="#74c957"
                />
                <Box
                    width="100%"
                    height="120px"
                    Subtitle="Total Stock"
                    Title="Units currently available"
                    Amount={loading ? "..." : error ? "Unavailable" : summary.totalStock.toLocaleString("en-PK")}
                    Icon={FiPackage}
                    color="white"
                />
                <Box
                    width="100%"
                    height="120px"
                    Subtitle="Low Stock"
                    Title="Items needing reorder"
                    Amount={loading ? "..." : error ? "Unavailable" : summary.lowStock}
                    Icon={FiAlertTriangle}
                    color="#facc15"
                />
                <Box
                    width="100%"
                    height="120px"
                    Subtitle="Out of Stock"
                    Title="Currently unavailable"
                    Amount={loading ? "..." : error ? "Unavailable" : summary.outOfStock}
                    Icon={MdOutlineInventory}
                    color="#f87171"
                />
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                <InventoryReport
                    items={items}
                    setItems={setItems}
                    loading={loading}
                    error={error}
                    onInventoryUpdated={refreshActivities}
                />
                <aside className="grid min-w-0 gap-4 sm:grid-cols-2 lg:col-span-1 lg:grid-cols-1 lg:grid-rows-2">
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
                            {!loading && !error && lowStockItems.map((item) => (
                                <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-black/15 px-3 py-2.5">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-white">{item.name}</p>
                                        <p className="text-xs text-gray-400">{item.quantity} units remaining</p>
                                    </div>
                                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${item.level === "Out"
                                        ? "bg-red-500/15 text-red-300"
                                        : "bg-amber-500/15 text-amber-300"
                                        }`}>
                                        {item.level}
                                    </span>
                                </div>
                            ))}
                            {loading && <p className="py-5 text-center text-sm text-gray-400">Loading alerts...</p>}
                            {!loading && error && <p className="py-5 text-center text-sm text-red-300">{error}</p>}
                            {!loading && !error && lowStockItems.length === 0 && <p className="py-5 text-center text-sm text-gray-400">Stock levels are healthy.</p>}
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
                            {activities.slice(0, 5).map((movement) => (
                                <div key={movement.id} className="flex items-center justify-between gap-3 rounded-xl bg-black/15 px-3 py-2.5">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-white">{movement.product_title}</p>
                                        <p className="text-xs text-gray-400">{movement.activity_type}</p>
                                    </div>
                                    <span className={`shrink-0 text-sm font-bold ${movement.direction === "in" ? "text-[#8bd174]" : "text-red-300"}`}>
                                        {movement.direction === "in" ? "+" : "-"}{movement.quantity}
                                    </span>
                                </div>
                            ))}
                            {!loading && !error && activities.length === 0 && <p className="py-5 text-center text-sm text-gray-400">No stock activity yet.</p>}
                        </div>
                    </section>
                </aside>
            </div>
        </main>
    )
}

export default Inventory
import { useEffect, useMemo, useState } from "react";
