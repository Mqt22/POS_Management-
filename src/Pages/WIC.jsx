import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiMinus,
  FiPlus,
  FiPrinter,
  FiSearch,
  FiShoppingCart,
  FiTrash2,
  FiUser,
} from "react-icons/fi";
import { MdInventory2, MdOutlineReceiptLong } from "react-icons/md";
import ThermalReceipt from "../Component/ThermalReceipt.jsx";

const products = [
  { id: 1, name: "18mm Commercial Plywood", sku: "PLY-18-COM", category: "Plywood", price: 82, stock: 24 },
  { id: 2, name: "12mm Marine Plywood", sku: "PLY-12-MAR", category: "Plywood", price: 96, stock: 18 },
  { id: 3, name: "Laminated MDF Board", sku: "MDF-LAM-01", category: "Boards", price: 64, stock: 31 },
  { id: 4, name: "Soft-Close Cabinet Hinge", sku: "HDW-HNG-12", category: "Hardware", price: 8.5, stock: 86 },
  { id: 5, name: "Drawer Channel Pair", sku: "HDW-DRW-18", category: "Hardware", price: 14, stock: 43 },
  { id: 6, name: "Wood Adhesive 5kg", sku: "ADH-WD-05", category: "Adhesives", price: 22, stock: 15 },
  { id: 7, name: "Door Handle Set", sku: "HDW-DOR-07", category: "Hardware", price: 31, stock: 27 },
  { id: 8, name: "PVC Edge Band Roll", sku: "EDG-PVC-02", category: "Accessories", price: 18, stock: 39 },
];

const categories = ["All", ...new Set(products.map((product) => product.category))];

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(amount);

const WIC = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amountReceived, setAmountReceived] = useState("");
  const [customer, setCustomer] = useState({ name: "", phone: "" });
  const [receipt, setReceipt] = useState(null);
  const invoiceSequenceRef = useRef(1001);

  useEffect(() => {
    if (!receipt) return undefined;

    const timeout = window.setTimeout(() => {
      window.print();
      setReceipt(null);
    }, 100);

    return () => window.clearTimeout(timeout);
  }, [receipt]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory = activeCategory === "All" || product.category === activeCategory;
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, search]);

  const addToCart = (product) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.id === product.id);

      if (existingItem) {
        return currentCart.map((item) =>
          item.id === product.id && item.quantity < product.stock
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...currentCart, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId, change) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: Math.min(item.stock, Math.max(0, item.quantity + change)) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const tax = subtotal * 0.05;
  const grandTotal = subtotal + tax;
  const receivedAmount = Number(amountReceived) || 0;
  const changeDue = Math.max(0, receivedAmount - grandTotal);
  const canCompleteSale =
    cart.length > 0 && (paymentMethod !== "cash" || receivedAmount >= grandTotal);

  const completeSale = (shouldPrint = false) => {
    if (!canCompleteSale) return;

    if (shouldPrint) {
      const invoiceNumber = `INV-DEMO-${invoiceSequenceRef.current}`;
      invoiceSequenceRef.current += 1;
      setReceipt({
        invoiceNumber,
        date: new Intl.DateTimeFormat("en-PK", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date()),
        customer: { ...customer },
        items: cart.map((item) => ({ ...item })),
        subtotal,
        tax,
        grandTotal,
        paymentMethod: paymentMethod.toUpperCase(),
        amountPaid: paymentMethod === "cash" ? receivedAmount : grandTotal,
        changeDue,
      });
    }

    setCart([]);
    setAmountReceived("");
    setCustomer({ name: "", phone: "" });
  };

  return (
    <main className="min-h-0 flex-1 overflow-y-auto bg-[#080b08] p-4 text-white md:p-6 lg:p-8">
      {/* Walk-in sale page heading */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#74c957]">Point of Sale</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Walk-in Customer</h1>
          <p className="mt-1 text-sm text-gray-400">Create a quick sale without opening a customer account.</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-[#36562f] bg-[#121812] px-4 py-2 text-sm text-gray-300">
          <MdOutlineReceiptLong className="text-xl text-[#74c957]" />
          New transaction
        </div>
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        {/* Product selection area */}
        <section className="min-w-0 rounded-2xl border border-[#2f4a2b] bg-[#121812] p-4 sm:p-5">
          {/* Product search */}
          <div className="relative">
            <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products by name or SKU..."
              className="w-full rounded-xl border border-[#36562f] bg-[#0b100b] py-3 pl-11 pr-4 text-white outline-none placeholder:text-gray-500 focus:border-[#63b447]"
            />
          </div>

          {/* Product category filters */}
          <div className="sales-table-scrollbar mt-4 flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`shrink-0 cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  activeCategory === category
                    ? "bg-[#63b447] text-black"
                    : "border border-[#36562f] text-gray-300 hover:bg-[#315f25]"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Product card grid */}
          <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(min(100%,190px),1fr))] gap-3">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => addToCart(product)}
                disabled={product.stock === 0}
                className="group cursor-pointer rounded-xl border border-[#2f4a2b] bg-[#0d120d] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#63b447] hover:bg-[#172117] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <span className="grid size-10 place-items-center rounded-lg bg-[#63b447]/15 text-xl text-[#74c957]">
                    <MdInventory2 />
                  </span>
                  <span className="rounded-full bg-white/5 px-2 py-1 text-[10px] font-semibold uppercase text-gray-400">
                    {product.category}
                  </span>
                </div>
                <h2 className="font-bold text-white">{product.name}</h2>
                <p className="mt-1 text-xs text-gray-500">{product.sku}</p>
                <div className="mt-4 flex items-end justify-between gap-3">
                  <strong className="text-lg text-[#74c957]">{formatCurrency(product.price)}</strong>
                  <span className="text-xs text-gray-400">{product.stock} in stock</span>
                </div>
              </button>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="grid min-h-52 place-items-center text-center text-gray-400">
              <div>
                <MdInventory2 className="mx-auto text-4xl" />
                <p className="mt-3 font-semibold">No matching products found.</p>
              </div>
            </div>
          )}
        </section>

        {/* Cart and checkout area */}
        <aside className="min-w-0 rounded-2xl border border-[#2f4a2b] bg-[#121812] xl:sticky xl:top-0 xl:self-start">
          <div className="flex items-center justify-between border-b border-white/10 p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-lg bg-[#63b447]/15 text-xl text-[#74c957]">
                <FiShoppingCart />
              </span>
              <div>
                <h2 className="font-bold">Current Cart</h2>
                <p className="text-xs text-gray-400">{cart.length} unique items</p>
              </div>
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => setCart([])}
                className="cursor-pointer text-xs font-semibold text-gray-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Cart items */}
          <div className="max-h-72 space-y-2 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="grid min-h-36 place-items-center text-center text-gray-500">
                <div>
                  <FiShoppingCart className="mx-auto text-3xl" />
                  <p className="mt-2 text-sm">Select a product to begin.</p>
                </div>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="rounded-xl bg-black/20 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{item.name}</p>
                      <p className="mt-1 text-xs text-gray-400">{formatCurrency(item.price)} each</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCart((items) => items.filter((cartItem) => cartItem.id !== item.id))}
                      className="cursor-pointer text-gray-500 hover:text-white"
                      aria-label={`Remove ${item.name}`}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center rounded-lg border border-[#36562f]">
                      <button type="button" onClick={() => updateQuantity(item.id, -1)} className="grid size-8 cursor-pointer place-items-center hover:bg-white/5" aria-label="Decrease quantity">
                        <FiMinus />
                      </button>
                      <span className="min-w-8 text-center text-sm font-bold">{item.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(item.id, 1)} className="grid size-8 cursor-pointer place-items-center hover:bg-white/5" aria-label="Increase quantity">
                        <FiPlus />
                      </button>
                    </div>
                    <strong>{formatCurrency(item.price * item.quantity)}</strong>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Optional customer details */}
          <div className="border-t border-white/10 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-300">
              <FiUser className="text-[#74c957]" />
              Customer details (optional)
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              <input
                value={customer.name}
                onChange={(event) => setCustomer((details) => ({ ...details, name: event.target.value }))}
                placeholder="Customer name"
                className="min-w-0 rounded-lg border border-[#36562f] bg-[#0b100b] px-3 py-2 text-sm outline-none placeholder:text-gray-500 focus:border-[#63b447]"
              />
              <input
                value={customer.phone}
                onChange={(event) => setCustomer((details) => ({ ...details, phone: event.target.value }))}
                placeholder="Phone number"
                className="min-w-0 rounded-lg border border-[#36562f] bg-[#0b100b] px-3 py-2 text-sm outline-none placeholder:text-gray-500 focus:border-[#63b447]"
              />
            </div>
          </div>

          {/* Sale totals and payment */}
          <div className="space-y-3 border-t border-white/10 p-5">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-400">
              <span>Tax (5%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-3 text-lg font-bold">
              <span>Total</span>
              <span className="text-[#74c957]">{formatCurrency(grandTotal)}</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {["cash", "card", "bank"].map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`cursor-pointer rounded-lg py-2 text-xs font-bold capitalize ${
                    paymentMethod === method
                      ? "bg-[#63b447] text-black"
                      : "border border-[#36562f] text-gray-300 hover:bg-white/5"
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>

            {paymentMethod === "cash" && (
              <div className="grid grid-cols-2 gap-2">
                <label className="grid gap-1 text-xs text-gray-400">
                  Amount received
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amountReceived}
                    onChange={(event) => setAmountReceived(event.target.value)}
                    className="min-w-0 rounded-lg border border-[#36562f] bg-[#0b100b] px-3 py-2 text-white outline-none focus:border-[#63b447]"
                  />
                </label>
                <div className="rounded-lg bg-black/20 p-3">
                  <p className="text-xs text-gray-400">Change due</p>
                  <p className="mt-1 font-bold text-[#74c957]">{formatCurrency(changeDue)}</p>
                </div>
              </div>
            )}

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              <button
                type="button"
                disabled={!canCompleteSale}
                onClick={() => completeSale(false)}
                className="w-full cursor-pointer rounded-xl border border-[#63b447] py-3 font-bold text-[#8bd174] transition hover:bg-[#63b447]/10 disabled:cursor-not-allowed disabled:border-gray-700 disabled:text-gray-500"
              >
                Checkout
              </button>
              <button
                type="button"
                disabled={!canCompleteSale}
                onClick={() => completeSale(true)}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#63b447] py-3 font-bold text-black transition hover:bg-[#74c957] disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400"
              >
                <FiPrinter />
                Checkout &amp; Print
              </button>
            </div>
          </div>
        </aside>
      </div>
      <ThermalReceipt receipt={receipt} />
    </main>
  );
};

export default WIC;
