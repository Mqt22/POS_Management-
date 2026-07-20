import { useEffect, useMemo, useRef, useState } from 'react';
import { IoMdSearch } from "react-icons/io";
import { IoIosNotificationsOutline } from "react-icons/io";
import { GiHamburgerMenu } from "react-icons/gi";
import {
  FiAlertTriangle,
  FiCheck,
  FiClock,
  FiCreditCard,
  FiFilePlus,
  FiMessageCircle,
  FiPackage,
  FiPlus,
  FiShoppingCart,
  FiTruck,
  FiUserPlus,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { inventoryData } from "../Data/InventoryData.jsx";
import { customerSupplierData } from "../Data/CustomerSupplierData.jsx";
import { recentSales } from "../Data/SampleData.jsx";
import { purchases } from "../Data/PurchaseData.jsx";
import { initialNotifications } from "../Data/NotificationData.jsx";

const notificationIcons = {
  "out-of-stock": FiPackage,
  "low-stock": FiAlertTriangle,
  "overdue-payment": FiCreditCard,
  "pending-delivery": FiClock,
};

const createActions = [
  { label: "New Sale / Invoice", description: "Create a customer invoice", path: "/sales/billing", type: "sale", icon: FiFilePlus },
  { label: "Quick Sale", description: "Serve a walk-in customer", path: "/sales/quick-sale", type: "quick-sale", icon: FiShoppingCart },
  { label: "Purchase Order", description: "Order stock from a supplier", path: "/purchases/orders", type: "purchase", icon: FiTruck },
  { label: "Add Product", description: "Create a new inventory item", path: "/inventory", type: "product", icon: FiPackage },
  { label: "Add Customer", description: "Create a customer profile", path: "/customers", type: "customer", icon: FiUserPlus },
  { label: "Add Supplier", description: "Create a supplier profile", path: "/suppliers", type: "supplier", icon: FiUserPlus },
  { label: "Record Expense", description: "Add a business expense", path: "/reports", type: "expense", icon: FiCreditCard },
];

const playNotificationSound = () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(740, context.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(980, context.currentTime + 0.12);
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.16, context.currentTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.22);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.23);
  oscillator.addEventListener("ended", () => context.close());
};

const Topbar = ({ onHamburgerClick }) => {
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [greetingOpen, setGreetingOpen] = useState(
    () => window.localStorage.getItem("mirza-traders-greeting-shown") !== "true"
  );
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const searchContainerRef = useRef(null);
  const notificationContainerRef = useRef(null);
  const greetingContainerRef = useRef(null);
  const createMenuRef = useRef(null);
  const unreadSoundPlayedRef = useRef(false);
  const navigate = useNavigate();

  const searchableRecords = useMemo(() => [
    ...inventoryData.map((item) => ({
      id: item.productId,
      title: item.productName,
      detail: `${item.category} · ${item.currentStock} in stock`,
      type: "Products",
      path: "/inventory",
      keywords: [item.productId, item.productName, item.category, item.supplier],
    })),
    ...customerSupplierData.customers.map((customer) => ({
      id: customer.id,
      title: customer.name,
      detail: `${customer.contactPerson} · ${customer.phone}`,
      type: "Customers",
      path: "/customers",
      keywords: [customer.id, customer.name, customer.contactPerson, customer.email, customer.phone],
    })),
    ...customerSupplierData.suppliers.map((supplier) => ({
      id: supplier.id,
      title: supplier.name,
      detail: `${supplier.contactPerson} · ${supplier.phone}`,
      type: "Suppliers",
      path: "/suppliers",
      keywords: [supplier.id, supplier.name, supplier.contactPerson, supplier.email, supplier.phone],
    })),
    ...recentSales.map((sale) => ({
      id: sale.invoiceId,
      title: sale.invoiceId,
      detail: `${sale.customer.name} · PKR ${sale.amount.toLocaleString("en-PK")}`,
      type: "Sales Invoices",
      path: "/sales/billing",
      keywords: [sale.invoiceId, sale.customer.name, sale.customer.email, sale.status],
    })),
    ...purchases.map((purchase) => ({
      id: purchase.purchaseOrderId,
      title: purchase.purchaseOrderId,
      detail: `${purchase.supplier.name} · ${purchase.invoiceNumber}`,
      type: "Purchase Orders",
      path: "/purchases/orders",
      keywords: [purchase.purchaseOrderId, purchase.invoiceNumber, purchase.supplier.name, purchase.supplier.email],
    })),
  ], []);

  const searchResults = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];

    return searchableRecords
      .filter((record) =>
        record.keywords.some((keyword) =>
          String(keyword).toLowerCase().includes(query)
        )
      )
      .slice(0, 8);
  }, [search, searchableRecords]);

  const unreadCount = notifications.filter((notification) => !notification.read).length;

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
      if (!createMenuRef.current?.contains(event.target)) {
        setCreateMenuOpen(false);
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

  useEffect(() => {
    const receiveNotification = (event) => {
      const notification = event.detail;
      if (!notification?.id) return;

      setNotifications((current) => {
        if (current.some((item) => item.id === notification.id)) return current;
        return [{ ...notification, read: false }, ...current];
      });
      playNotificationSound();
      unreadSoundPlayedRef.current = true;
    };

    window.addEventListener("bizflow:new-notification", receiveNotification);
    return () => window.removeEventListener("bizflow:new-notification", receiveNotification);
  }, []);

  const openResult = (result) => {
    navigate(result.path, {
      state: {
        searchTarget: result.id,
        searchType: result.type,
      },
    });
    setSearch("");
    setSearchOpen(false);
  };

  const openNotification = (notification) => {
    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id ? { ...item, read: true } : item
      )
    );
    setNotificationsOpen(false);
    navigate(notification.path, {
      state: {
        searchTarget: notification.searchTarget,
        searchType: notification.searchType,
      },
    });
  };

  const markAllNotificationsRead = () => {
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, read: true }))
    );
  };

  const toggleNotifications = () => {
    const willOpen = !notificationsOpen;
    setNotificationsOpen(willOpen);

    if (willOpen && unreadCount > 0 && !unreadSoundPlayedRef.current) {
      playNotificationSound();
      unreadSoundPlayedRef.current = true;
    }
  };

  const openCreateAction = (action) => {
    setCreateMenuOpen(false);
    navigate(action.path, {
      state: {
        openCreate: action.type,
      },
    });
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
                  setSearch(event.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setSearchOpen(false);
                  if (event.key === "Enter" && searchResults[0]) openResult(searchResults[0]);
                }}
                placeholder="Search products, contacts, invoices..."
                className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-gray-300 placeholder:text-gray-500 focus:outline-none lg:text-[0.95rem]"
              />
            </div>

            {searchOpen && search.trim() && (
              <div className="absolute left-0 right-0 top-full z-[110] mt-2 max-h-[420px] overflow-y-auto rounded-xl border border-[#36562f] bg-[#121812] p-2 shadow-2xl">
                {searchResults.length > 0 ? (
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
                    No matching business records found.
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
                  {notifications.map((notification) => {
                    const NotificationIcon = notificationIcons[notification.type] || FiAlertTriangle;
                    return (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => openNotification(notification)}
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
          {/* User Profile or Actions */}
          <div ref={createMenuRef} className="relative hidden md:block">
            <button
              type="button"
              onClick={() => setCreateMenuOpen((open) => !open)}
              aria-expanded={createMenuOpen}
              className="flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-[#74c957] bg-[#63b447] px-4 text-sm font-bold text-black shadow-[0_0_18px_rgba(99,180,71,0.4)] transition-shadow duration-300 hover:shadow-[0_0_26px_rgba(99,180,71,0.65)] lg:h-[50px] lg:px-6 lg:text-base"
            >
              Create New
              <FiPlus />
            </button>

            {createMenuOpen && (
              <div className="absolute right-0 top-full z-[120] mt-3 w-80 overflow-hidden rounded-2xl border border-[#36562f] bg-[#121812] p-2 shadow-2xl">
                <div className="border-b border-white/10 px-3 py-2.5">
                  <p className="text-sm font-bold text-white">Create New</p>
                  <p className="mt-0.5 text-xs text-[#8f9b8d]">Choose a quick business action</p>
                </div>
                <div className="mt-1 grid gap-1">
                  {createActions.map((action) => {
                    const ActionIcon = action.icon;
                    return (
                      <button
                        key={action.type}
                        type="button"
                        onClick={() => openCreateAction(action)}
                        className="flex w-full cursor-pointer items-center gap-3 rounded-xl p-3 text-left hover:bg-[#315f25]"
                      >
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#63b447]/15 text-lg text-[#8bd174]">
                          <ActionIcon />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-bold text-white">{action.label}</span>
                          <span className="mt-0.5 block text-xs text-[#8f9b8d]">{action.description}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
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
