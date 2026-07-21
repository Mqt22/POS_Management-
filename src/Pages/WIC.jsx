import { useEffect, useMemo, useState } from "react";
import {
  FiMinus,
  FiEdit2,
  FiPlus,
  FiPrinter,
  FiShoppingCart,
  FiTrash2,
  FiUser,
} from "react-icons/fi";
import { MdInventory2 } from "react-icons/md";
import { useLocation, useNavigate } from "react-router-dom";
import ThermalReceipt from "../Component/ThermalReceipt.jsx";
import CreateSalesButton from "../Component/create_Sales_button.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const PAGE_LOADED_AT = Date.now();

const normalizeProduct = (product) => ({
  id: product.product_id,
  name: product.title,
  sku: product.sku,
  category: product.category,
  price: product.price,
  stock: product.stock_quantity,
});

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(amount);

const WIC = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [highlightActive, setHighlightActive] = useState(false);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amountReceived, setAmountReceived] = useState("");
  const [customer, setCustomer] = useState({ name: "", phone: "" });
  const [receipt, setReceipt] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [productActionError, setProductActionError] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  const handleProductCreated = (product) => {
    setProducts((currentProducts) => [
      normalizeProduct(product),
      ...currentProducts,
    ]);
  };

  const handleProductUpdated = (product) => {
    const updatedProduct = normalizeProduct(product);
    setProducts((currentProducts) =>
      currentProducts.map((item) =>
        item.id === updatedProduct.id ? updatedProduct : item
      )
    );
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === updatedProduct.id
          ? {
              ...item,
              ...updatedProduct,
              quantity: Math.min(item.quantity, updatedProduct.stock),
            }
          : item
      ).filter((item) => item.quantity > 0 && item.stock > 0)
    );
    setEditingProduct(null);
  };

  const deleteProduct = async () => {
    if (!deletingProduct) return;
    setIsDeletingProduct(true);
    setProductActionError("");

    try {
      const response = await fetch(
        `${API_URL}/deleteproducts/${encodeURIComponent(deletingProduct.id)}`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const responseBody = await response.json().catch(() => null);
        throw new Error(responseBody?.detail || "Unable to delete the product.");
      }

      setProducts((items) => items.filter((item) => item.id !== deletingProduct.id));
      setCart((items) => items.filter((item) => item.id !== deletingProduct.id));
      setDeletingProduct(null);
    } catch (requestError) {
      setProductActionError(requestError.message || "Unable to delete the product.");
    } finally {
      setIsDeletingProduct(false);
    }
  };

  // Load the Quick Sale product cards from FastAPI.
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setProductsLoading(true);
        setProductsError("");
        const response = await fetch(`${API_URL}/Showproducts`);
        if (!response.ok) {
          throw new Error(`Unable to load products (${response.status})`);
        }

        const productRecords = await response.json();
        setProducts(productRecords.map(normalizeProduct));
      } catch (requestError) {
        setProductsError(requestError.message || "Unable to load products.");
      } finally {
        setProductsLoading(false);
      }
    };

    loadProducts();
  }, []);

  const highlightedProductId =
    state?.searchType === "Products" && state?.searchRequestId >= PAGE_LOADED_AT
      ? state.searchTarget
      : null;

  useEffect(() => {
    if (!highlightedProductId) return undefined;
    const productExists = products.some(
      (product) => product.id === highlightedProductId
    );
    if (!productExists) return undefined;

    const startTimeout = window.setTimeout(() => {
      setActiveCategory("All");
      setHighlightActive(true);
      window.setTimeout(() => {
        document
          .querySelector(`[data-search-target="${highlightedProductId}"]`)
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
  }, [highlightedProductId, products, state?.searchRequestId, navigate]);

  useEffect(() => {
    if (!receipt) return undefined;

    const timeout = window.setTimeout(() => {
      window.print();
      setReceipt(null);
    }, 100);

    return () => window.clearTimeout(timeout);
  }, [receipt]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = activeCategory === "All" || product.category === activeCategory;
      return matchesCategory;
    });
  }, [activeCategory, products]);

  const categories = useMemo(
    () => ["All", ...new Set(products.map((product) => product.category))],
    [products]
  );

  const addToCart = (product) => {
    setCart((currentCart) => {
      if (product.stock <= 0) return currentCart;

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

  const completeSale = async (shouldPrint = false) => {
    if (!canCompleteSale || isCheckingOut) return;
    setIsCheckingOut(true);
    setCheckoutError("");

    try {
      const response = await fetch(`${API_URL}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customer.name || null,
          customer_phone: customer.phone || null,
          payment_method: paymentMethod,
          amount_received: paymentMethod === "cash" ? receivedAmount : grandTotal,
          items: cart.map((item) => ({
            product_id: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      if (!response.ok) {
        const responseBody = await response.json().catch(() => null);
        throw new Error(responseBody?.detail || "Unable to save checkout.");
      }

      const savedCheckout = await response.json();

      // Reflect the stock quantities already reduced by FastAPI.
      setProducts((currentProducts) =>
        currentProducts.map((product) => {
          const soldItem = cart.find((item) => item.id === product.id);
          return soldItem
            ? { ...product, stock: product.stock - soldItem.quantity }
            : product;
        })
      );

      if (shouldPrint) {
        setReceipt({
          invoiceNumber: savedCheckout.invoice_id,
          date: new Intl.DateTimeFormat("en-PK", {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(new Date(savedCheckout.created_at)),
          customer: {
            name: savedCheckout.customer_name,
            phone: savedCheckout.customer_phone || "",
          },
          items: savedCheckout.items.map((item) => ({
            id: item.product_id,
            name: item.product_title,
            sku: item.sku,
            quantity: item.quantity,
            price: item.unit_price,
          })),
          subtotal: savedCheckout.subtotal,
          tax: savedCheckout.tax,
          grandTotal: savedCheckout.total,
          paymentMethod: savedCheckout.payment_method.toUpperCase(),
          amountPaid: savedCheckout.amount_received,
          changeDue: savedCheckout.change_amount,
        });
      }

      setCart([]);
      setAmountReceived("");
      setCustomer({ name: "", phone: "" });
    } catch (requestError) {
      setCheckoutError(requestError.message || "Unable to save checkout.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <main className="min-h-0 flex-1 overflow-y-auto bg-[#080b08] p-4 text-white md:p-6 lg:p-8">
      {/* Walk-in sale page heading */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#74c957]">Point of Sale</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Walk-in Customer</h1>
          <p className="mt-1 text-sm text-gray-400">Leave customer details blank for a walk-in sale, or enter both fields to save a customer automatically.</p>
        </div>
        <CreateSalesButton
          mode="product"
          onProductCreated={handleProductCreated}
        />
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_390px]">
        {/* Product selection area */}
        <section className="min-w-0 rounded-2xl border border-[#2f4a2b] bg-[#121812] p-4 sm:p-5">
          {/* Product category filters */}
          <div className="sales-table-scrollbar flex gap-2 overflow-x-auto pb-2">
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
          {productsLoading && (
            <div className="grid min-h-52 place-items-center text-sm text-gray-400">
              Loading products...
            </div>
          )}

          {!productsLoading && productsError && (
            <div className="grid min-h-52 place-items-center px-4 text-center text-sm text-red-300">
              {productsError}. Make sure the FastAPI server is running.
            </div>
          )}

          <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(min(100%,190px),1fr))] gap-3">
            {!productsLoading && !productsError && filteredProducts.map((product) => (
              <article
                key={product.id}
                data-search-target={product.id}
                onClick={() => {
                  if (product.stock > 0) addToCart(product);
                }}
                onKeyDown={(event) => {
                  if ((event.key === "Enter" || event.key === " ") && product.stock > 0) {
                    event.preventDefault();
                    addToCart(product);
                  }
                }}
                role="button"
                tabIndex={product.stock > 0 ? 0 : -1}
                aria-disabled={product.stock === 0}
                className={`group relative rounded-xl border border-[#2f4a2b] bg-[#0d120d] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#63b447] hover:bg-[#172117] ${
                  product.id === highlightedProductId && highlightActive
                    ? "search-result-highlight "
                    : ""
                }${
                  product.stock === 0
                    ? "cursor-not-allowed border-red-900/70 bg-red-950/10"
                    : "cursor-pointer"
                }`}
              >
                <div className="absolute right-3 top-3 z-10 flex gap-1 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setProductActionError("");
                      setEditingProduct(product);
                    }}
                    className="grid size-8 cursor-pointer place-items-center rounded-lg border border-[#36562f] bg-[#121812] text-gray-300 shadow-lg hover:border-[#63b447] hover:text-[#8bd174]"
                    aria-label={`Edit ${product.name}`}
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setProductActionError("");
                      setDeletingProduct(product);
                    }}
                    className="grid size-8 cursor-pointer place-items-center rounded-lg border border-red-900/70 bg-[#121812] text-red-300 shadow-lg hover:bg-red-500/15"
                    aria-label={`Delete ${product.name}`}
                  >
                    <FiTrash2 />
                  </button>
                </div>
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
                  {product.stock === 0 ? (
                    <span className="rounded-full border border-red-800/70 bg-red-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-red-300">
                      Out of Stock
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">{product.stock} in stock</span>
                  )}
                </div>
              </article>
            ))}
          </div>

          {!productsLoading && !productsError && filteredProducts.length === 0 && (
            <div className="grid min-h-52 place-items-center text-center text-gray-400">
              <div>
                <MdInventory2 className="mx-auto text-4xl" />
                <p className="mt-3 font-semibold">No matching products found.</p>
              </div>
            </div>
          )}
        </section>

        {/* Cart and checkout area */}
        <aside className="min-w-0 rounded-2xl border border-[#2f4a2b] bg-[#121812] lg:sticky lg:top-0 lg:self-start">
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
            <p className="mt-2 text-xs text-gray-500">Returning customers are matched using their phone number.</p>
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

            {checkoutError && (
              <p className="rounded-lg border border-red-900/60 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {checkoutError}
              </p>
            )}

            {isCheckingOut && (
              <div className="rounded-lg border border-[#36562f] bg-[#0b100b] p-3">
                <div className="flex justify-between gap-3 text-xs">
                  <span className="font-semibold text-white">Saving checkout...</span>
                  <span className="text-[#74c957]">Please wait</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#243024]">
                  <div className="h-full w-2/3 animate-pulse rounded-full bg-[#63b447]" />
                </div>
              </div>
            )}

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              <button
                type="button"
                disabled={!canCompleteSale || isCheckingOut}
                onClick={() => completeSale(false)}
                className="w-full cursor-pointer rounded-xl border border-[#63b447] py-3 font-bold text-[#8bd174] transition hover:bg-[#63b447]/10 disabled:cursor-not-allowed disabled:border-gray-700 disabled:text-gray-500"
              >
                {isCheckingOut ? "Saving..." : "Checkout"}
              </button>
              <button
                type="button"
                disabled={!canCompleteSale || isCheckingOut}
                onClick={() => completeSale(true)}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#63b447] py-3 font-bold text-black transition hover:bg-[#74c957] disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400"
              >
                <FiPrinter />
                {isCheckingOut ? "Saving..." : "Checkout & Print"}
              </button>
            </div>
          </div>
        </aside>
      </div>

      {editingProduct && (
        <CreateSalesButton
          key={editingProduct.id}
          mode="product"
          hideTrigger
          productToEdit={editingProduct}
          onProductUpdated={handleProductUpdated}
          onEditClosed={() => setEditingProduct(null)}
        />
      )}

      {deletingProduct && (
        <div className="fixed inset-0 z-[150] grid place-items-center p-4">
          <button
            type="button"
            onClick={() => {
              if (!isDeletingProduct) setDeletingProduct(null);
            }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md"
            aria-label="Close delete product confirmation"
          />
          <section className="relative z-10 w-full max-w-md rounded-2xl border border-red-900/60 bg-[#121812] p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white">Delete product?</h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-400">
              Delete <strong className="text-white">{deletingProduct.name}</strong>?
              This action cannot be undone.
            </p>

            {productActionError && (
              <p className="mt-4 rounded-lg border border-red-900/60 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {productActionError}
              </p>
            )}

            {isDeletingProduct && (
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#243024]">
                <div className="h-full w-2/3 animate-pulse rounded-full bg-red-500" />
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                disabled={isDeletingProduct}
                className="cursor-pointer rounded-lg border border-[#36562f] px-4 py-2.5 font-semibold text-gray-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={deleteProduct}
                disabled={isDeletingProduct}
                className="cursor-pointer rounded-lg bg-red-600 px-4 py-2.5 font-bold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeletingProduct ? "Deleting..." : "Delete"}
              </button>
            </div>
          </section>
        </div>
      )}

      <ThermalReceipt receipt={receipt} />
    </main>
  );
};

export default WIC;
