import { useEffect, useRef, useState } from 'react';
import { IoMdSearch } from "react-icons/io";
import { IoIosNotificationsOutline } from "react-icons/io";
import { GiHamburgerMenu } from "react-icons/gi";
import {
  FiAlertTriangle,
  FiCheck,
  FiClock,
  FiCreditCard,
  FiMessageCircle,
  FiPackage,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

// Local FastAPI address; override with VITE_API_URL when the backend location changes.
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const notificationIcons = {
  "out-of-stock": FiPackage,
  "low-stock": FiAlertTriangle,
  "overdue-payment": FiCreditCard,
  "pending-delivery": FiClock,
};

const formatNotificationTime = (createdAt) => {
  const elapsedSeconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000)
  );
  if (elapsedSeconds < 60) return "Just now";
  if (elapsedSeconds < 3600) return `${Math.floor(elapsedSeconds / 60)} min ago`;
  if (elapsedSeconds < 86400) return `${Math.floor(elapsedSeconds / 3600)} hr ago`;
  return `${Math.floor(elapsedSeconds / 86400)} day(s) ago`;
};

let notificationAudioContext = null;

const unlockNotificationAudio = () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  if (!notificationAudioContext) notificationAudioContext = new AudioContext();
  if (notificationAudioContext.state === "suspended") {
    notificationAudioContext.resume().catch(() => undefined);
  }
};

const playNotificationSound = () => {
  // Never queue blocked audio that could play on a later bell click.
  if (!notificationAudioContext || notificationAudioContext.state !== "running") return;

  const context = notificationAudioContext;
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(740, context.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(980, context.currentTime + 0.12);
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.35, context.currentTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.22);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.23);
};

const Topbar = ({ onHamburgerClick }) => {
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationsError, setNotificationsError] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [greetingOpen, setGreetingOpen] = useState(
    () => window.localStorage.getItem("mirza-traders-greeting-shown") !== "true"
  );
  const searchContainerRef = useRef(null);
  const notificationContainerRef = useRef(null);
  const greetingContainerRef = useRef(null);
  const knownNotificationIdsRef = useRef(null);
  const navigate = useNavigate();

  // Query FastAPI as the user types instead of filtering hardcoded records.
  useEffect(() => {
    const query = search.trim();
    if (!query) return undefined;

    const controller = new AbortController();
    const searchDelay = window.setTimeout(async () => {
      try {
        setSearchLoading(true);
        const [salesResponse, productResponse, purchaseResponse, customerResponse, supplierResponse] = await Promise.all([
          fetch(`${API_URL}/searchSales?query=${encodeURIComponent(query)}`, {
            signal: controller.signal,
          }),
          fetch(`${API_URL}/Searchproducts/${encodeURIComponent(query)}`, {
            signal: controller.signal,
          }),
          fetch(`${API_URL}/SearchPurchases/${encodeURIComponent(query)}`, {
            signal: controller.signal,
          }),
          fetch(`${API_URL}/SearchCustomers/${encodeURIComponent(query)}`, {
            signal: controller.signal,
          }),
          fetch(`${API_URL}/SearchSuppliers/${encodeURIComponent(query)}`, {
            signal: controller.signal,
          }),
        ]);
        if (!salesResponse.ok) throw new Error("Unable to search business records.");

        const sales = await salesResponse.json();
        const productResult = productResponse.ok ? await productResponse.json() : [];
        const products = Array.isArray(productResult)
          ? productResult
          : [productResult];
        const purchaseResult = purchaseResponse.ok ? await purchaseResponse.json() : [];
        const purchases = Array.isArray(purchaseResult)
          ? purchaseResult
          : [purchaseResult];
        const customers = customerResponse.ok ? await customerResponse.json() : [];
        const suppliers = supplierResponse.ok ? await supplierResponse.json() : [];
        const normalizedQuery = query.toLowerCase();
        const reportKeywords = ["report", "reports", "revenue", "expense", "expenses", "profit", "loss", "finance", "financial"];
        const reportResults = reportKeywords.some(
          (keyword) => keyword.includes(normalizedQuery) || normalizedQuery.includes(keyword)
        )
          ? [{
              id: "financial-report",
              title: "Profit & Loss Report",
              detail: "Revenue, expenses, gross profit, and net profit",
              type: "Reports",
              path: "/reports",
            }]
          : [];
        setSearchResults([
          ...reportResults,
          ...sales.map((sale) => ({
            id: sale.invoice_id,
            title: sale.invoice_id,
            detail: `${sale.customer_name} - ${sale.currency} ${sale.amount.toLocaleString("en-PK")}`,
            type: "Sales Invoices",
            path: "/sales/billing",
          })),
          ...products.map((product) => ({
                id: product.product_id,
                title: product.title,
                detail: `${product.product_id} - ${product.stock_quantity} in stock`,
                type: "Products",
                path: "/sales/quick-sale",
              })),
          ...purchases.map((purchase) => ({
                id: purchase.purchase_order_id,
                title: purchase.purchase_order_id,
                detail: `${purchase.supplier_name} - ${purchase.invoice_number}`,
                type: "Purchase Orders",
                path: purchase.order_status === "received"
                  ? "/purchases/history"
                  : "/purchases/orders",
              })),
          ...customers.map((customer) => ({
            id: customer.customer_id,
            title: customer.name,
            detail: `${customer.customer_id} - ${customer.contact_person}`,
            type: "Customers",
            path: "/customers",
          })),
          ...suppliers.map((supplier) => ({
            id: supplier.supplier_id,
            title: supplier.name,
            detail: `${supplier.supplier_id} - ${supplier.contact_person}`,
            type: "Suppliers",
            path: "/suppliers",
          })),
        ]);
      } catch (requestError) {
        if (requestError.name !== "AbortError") setSearchResults([]);
      } finally {
        if (!controller.signal.aborted) setSearchLoading(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(searchDelay);
      controller.abort();
    };
  }, [search]);

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  // Unlock browser audio silently; notifications arriving later may play immediately.
  useEffect(() => {
    const unlockAudio = () => unlockNotificationAudio();
    window.addEventListener("pointerdown", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });

    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, []);

  // Load real backend notifications and check for new alerts every 6 seconds.
  useEffect(() => {
    let isActive = true;

    const loadNotifications = async () => {
      try {
        const response = await fetch(`${API_URL}/notifications`);
        if (!response.ok) throw new Error("Unable to load notifications.");

        const backendNotifications = await response.json();
        if (!isActive) return;

        const mappedNotifications = backendNotifications.map((notification) => ({
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          time: formatNotificationTime(notification.created_at),
          read: notification.is_read,
          path: notification.target_page,
          searchTarget: notification.target_id,
          searchType:
            notification.type === "low-stock" || notification.type === "out-of-stock"
              ? "Products"
              : "Sales Invoices",
        }));

        const knownIds = knownNotificationIdsRef.current;
        const hasNewUnreadNotification =
          knownIds !== null &&
          mappedNotifications.some(
            (notification) => !notification.read && !knownIds.has(notification.id)
          );

        if (hasNewUnreadNotification) playNotificationSound();
        knownNotificationIdsRef.current = new Set(
          mappedNotifications.map((notification) => notification.id)
        );
        setNotifications(mappedNotifications);
        setNotificationsError("");
      } catch (requestError) {
        if (isActive) {
          setNotificationsError(
            requestError.message || "Unable to load notifications."
          );
        }
      } finally {
        if (isActive) setNotificationsLoading(false);
      }
    };

    loadNotifications();
    const pollingInterval = window.setInterval(loadNotifications, 6000);

    return () => {
      isActive = false;
      window.clearInterval(pollingInterval);
    };
  }, []);

  useEffect(() => {
    const closeSearch = (event) => {
      if (!searchContainerRef.current?.contains(event.target)) {
        setSearchOpen(false);
      }
      if (!notificationContainerRef.current?.contains(event.target)) {
        setNotificationsOpen(false);
      }
      if (!greetingContainerRef.current?.contains(event.target)) {
        setGreetingOpen(false);
      }
    };

    document.addEventListener("mousedown", closeSearch);
    return () => document.removeEventListener("mousedown", closeSearch);
  }, []);

  useEffect(() => {
    if (greetingOpen) {
      window.localStorage.setItem("mirza-traders-greeting-shown", "true");
    }
  }, [greetingOpen]);

  const openResult = (result) => {
    navigate(result.path, {
      state: {
        searchTarget: result.id,
        searchType: result.type,
        searchRequestId: Date.now(),
      },
    });
    setSearch("");
    setSearchOpen(false);
  };

  const openNotification = async (notification, searchRequestId) => {
    try {
      const response = await fetch(
        `${API_URL}/notifications/${notification.id}`,
        { method: "DELETE", keepalive: true }
      );
      if (!response.ok) throw new Error("Unable to remove notification.");
      setNotifications((current) =>
        current.filter((item) => item.id !== notification.id)
      );
      setNotificationsError("");
    } catch (requestError) {
      setNotificationsError(
        requestError.message || "Unable to remove notification."
      );
      return;
    }

    setNotificationsOpen(false);
    navigate(notification.path, {
      state: {
        searchTarget: notification.searchTarget,
        searchType: notification.searchType,
        searchRequestId,
      },
    });
  };

  const markAllNotificationsRead = async () => {
    try {
      const response = await fetch(`${API_URL}/notifications`, {
        method: "DELETE",
        keepalive: true,
      });
      if (!response.ok) throw new Error("Unable to clear notifications.");
      setNotifications([]);
      setNotificationsError("");
    } catch (requestError) {
      setNotificationsError(
        requestError.message || "Unable to clear notifications."
      );
    }
  };

  const toggleNotifications = () => {
    setNotificationsOpen((isOpen) => !isOpen);
  };

  return (
      <header className="flex h-16 w-full shrink-0 items-center justify-between gap-2 border-b border-[#2f4a2b] bg-[#0b100b] px-3 sm:gap-4 md:h-20 md:px-5 lg:px-8">
        {/* Left Container */}
        <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-4">
          <button
            type="button"
            onClick={onHamburgerClick}
            className="grid size-9 shrink-0 place-items-center rounded-lg text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Toggle sidebar"
          >
            <GiHamburgerMenu className="text-xl md:text-2xl hover:cursor-pointer" />
          </button>
          {/* Logo or Brand */}
          <div ref={searchContainerRef} className="relative hidden min-w-0 max-w-[440px] flex-1 sm:block">
            <div className="flex h-10 items-center rounded-2xl border border-[#394539] bg-black/20 p-2 focus-within:border-[#63b447]">
              <IoMdSearch className="shrink-0 cursor-pointer text-xl text-gray-400 md:text-2xl" />
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  const value = event.target.value;
                  setSearch(value);
                  if (!value.trim()) {
                    setSearchResults([]);
                    setSearchLoading(false);
                  }
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setSearchOpen(false);
                  if (event.key === "Enter" && searchResults[0]) openResult(searchResults[0]);
                }}
                placeholder="Search sales, products, purchases, or contacts..."
                className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-gray-300 placeholder:text-gray-500 focus:outline-none lg:text-[0.95rem]"
              />
            </div>

            {searchOpen && search.trim() && (
              <div className="absolute left-0 right-0 top-full z-[110] mt-2 max-h-[420px] overflow-y-auto rounded-xl border border-[#36562f] bg-[#121812] p-2 shadow-2xl">
                {searchLoading ? (
                  <p className="px-3 py-5 text-center text-sm text-[#8f9b8d]">
                    Searching business records...
                  </p>
                ) : searchResults.length > 0 ? (
                  <div className="grid gap-1">
                    {searchResults.map((result) => (
                      <button
                        key={`${result.type}-${result.id}`}
                        type="button"
                        onClick={() => openResult(result)}
                        className="flex cursor-pointer items-center justify-between gap-4 rounded-lg px-3 py-2.5 text-left hover:bg-[#315f25]"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-white">{result.title}</p>
                          <p className="mt-0.5 truncate text-xs text-[#8f9b8d]">{result.detail}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-[#63b447]/15 px-2 py-1 text-[10px] font-bold text-[#8bd174]">
                          {result.type}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="px-3 py-5 text-center text-sm text-[#8f9b8d]">
                    No matching business record found.
                  </p>
                )}
              </div>
            )}
          </div>
          <div ref={notificationContainerRef} className="relative">
            <button
              type="button"
              onClick={toggleNotifications}
              className="relative grid size-9 shrink-0 place-items-center rounded-lg text-gray-400 hover:bg-white/10 hover:text-white"
              aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
              aria-expanded={notificationsOpen}
            >
              <IoIosNotificationsOutline className="cursor-pointer text-xl md:text-2xl" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-[#63b447] px-1 text-[9px] font-bold leading-4 text-black">
                  {unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="fixed left-3 right-3 top-[4.5rem] z-[120] overflow-hidden rounded-2xl border border-[#36562f] bg-[#121812] shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-3 sm:w-[380px]">
                <div className="flex items-center justify-between border-b border-white/10 p-4">
                  <div>
                    <h2 className="font-bold text-white">Notifications</h2>
                    <p className="mt-0.5 text-xs text-[#8f9b8d]">{unreadCount} unread alerts</p>
                  </div>
                  <button
                    type="button"
                    onClick={markAllNotificationsRead}
                    disabled={!unreadCount}
                    className="flex cursor-pointer items-center gap-1.5 text-xs font-bold text-[#74c957] disabled:cursor-default disabled:opacity-40"
                  >
                    <FiCheck />
                    Mark all read
                  </button>
                </div>

                <div className="max-h-[min(430px,65vh)] overflow-y-auto p-2">
                  {notificationsLoading && (
                    <p className="px-3 py-8 text-center text-sm text-[#8f9b8d]">
                      Loading notifications...
                    </p>
                  )}
                  {!notificationsLoading && notificationsError && (
                    <p className="px-3 py-8 text-center text-sm text-red-300">
                      {notificationsError}
                    </p>
                  )}
                  {!notificationsLoading && !notificationsError && notifications.length === 0 && (
                    <p className="px-3 py-8 text-center text-sm text-[#8f9b8d]">
                      No notifications yet.
                    </p>
                  )}
                  {!notificationsLoading && !notificationsError && notifications.map((notification) => {
                    const NotificationIcon = notificationIcons[notification.type] || FiAlertTriangle;
                    return (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={(event) =>
                          openNotification(
                            notification,
                            window.performance.timeOrigin + event.timeStamp
                          )
                        }
                        className={`flex w-full cursor-pointer gap-3 rounded-xl p-3 text-left transition-colors hover:bg-[#315f25] ${
                          notification.read ? "opacity-65" : "bg-[#63b447]/5"
                        }`}
                      >
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#63b447]/15 text-lg text-[#8bd174]">
                          <NotificationIcon />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-3">
                            <span className="text-sm font-bold text-white">{notification.title}</span>
                            {!notification.read && <i className="mt-1.5 size-2 shrink-0 rounded-full bg-[#63b447]" />}
                          </span>
                          <span className="mt-1 block text-xs leading-relaxed text-[#a8b0a6]">{notification.message}</span>
                          <span className="mt-1.5 block text-[10px] font-semibold text-[#6f796d]">{notification.time}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <div ref={greetingContainerRef} className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setGreetingOpen((open) => !open)}
              className="grid size-9 shrink-0 place-items-center rounded-lg text-gray-400 hover:bg-white/10 hover:text-white"
              aria-label="Open welcome message"
              aria-expanded={greetingOpen}
            >
              <FiMessageCircle className="cursor-pointer text-xl md:text-2xl" />
            </button>

            {greetingOpen && (
              <div className="absolute left-0 top-full z-[120] mt-3 w-[min(340px,calc(100vw-1.5rem))] rounded-2xl border border-[#36562f] bg-[#121812] p-5 shadow-2xl">
                <div className="flex items-start gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#63b447]/15 text-xl text-[#8bd174]">
                    <FiMessageCircle />
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-[#74c957]">Welcome</p>
                    <h2 className="mt-1 text-lg font-bold text-white">Hello, Alex Rivera!</h2>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-[#a8b0a6]">
                  Welcome to the Mirza Traders dashboard. Manage hardware and plywood sales,
                  purchases, inventory, customers, suppliers, and financial reports from one place.
                </p>
                <button
                  type="button"
                  onClick={() => setGreetingOpen(false)}
                  className="mt-4 w-full cursor-pointer rounded-lg bg-[#63b447] px-4 py-2.5 text-sm font-bold text-black hover:bg-[#74c957]"
                >
                  Got it
                </button>
              </div>
            )}
          </div>
        </div>
        {/* Right Container */}
        <div className="flex shrink-0 items-center gap-3 md:gap-5 lg:gap-8">
          {/* Signed-in user identity */}
          <div className="flex shrink-0 items-center gap-2 md:gap-3">
            <div className="hidden text-right leading-tight lg:block">
              <p className="text-sm font-bold text-white lg:text-base">
                Alex Rivera
              </p>
              <p className="mt-1 text-xs font-medium text-[#8fbf80]">
                Admin
              </p>
            </div>
            <img
              src="https://i.pravatar.cc/80?img=12"
              alt="Alex Rivera"
              className="size-10 rounded-full border-2 border-[#63b447] object-cover md:size-12 lg:size-14 cursor-pointer"
            />
          </div>
        </div>
      </header>
  );
};

export default Topbar;
