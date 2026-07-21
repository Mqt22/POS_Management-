import { useEffect, useMemo, useState } from "react";
import { FiEdit2, FiMail, FiMapPin, FiPhone, FiPlus, FiX } from "react-icons/fi";
import { Link, useLocation } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000";

const formatAmount = (amount = 0) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (date) =>
  new Intl.DateTimeFormat("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));

// Convert backend snake_case fields into the names used by this page.
const mapContact = (record, isCustomer) => ({
  id: isCustomer ? record.customer_id : record.supplier_id,
  name: record.name,
  contactPerson: record.contact_person,
  role: record.role,
  email: record.email,
  phone: record.phone,
  address: record.address,
  status: record.status,
  tier: record.tier,
  totalBusiness: isCustomer ? record.total_sales : record.total_purchases,
  outstanding: record.outstanding_amount,
  creditLimit: record.credit_limit,
  averagePaymentDays: record.average_payment_days,
});

const mapTransaction = (item) => ({
  id: item.transaction_id,
  date: item.transaction_date,
  description: item.description,
  type: item.transaction_type,
  debit: item.debit,
  credit: item.credit,
  balance: item.balance,
});

const emptyProfile = {
  id: "", name: "", contactPerson: "", role: "", email: "", phone: "",
  address: "", status: "Active", tier: "Tier 1", totalBusiness: 0,
  outstanding: 0, creditLimit: 0, averagePaymentDays: 0,
};

const emptyTransaction = {
  id: "", date: new Date().toISOString().slice(0, 10), description: "",
  type: "Invoice", debit: 0, credit: 0, balance: 0,
};

const Contacts = () => {
  const { pathname, state } = useLocation();
  const isCustomer = !pathname.startsWith("/suppliers");
  const activeType = isCustomer ? "customers" : "suppliers";
  const expectedSearchType = isCustomer ? "Customers" : "Suppliers";
  const highlightedId = state?.searchType === expectedSearchType ? state.searchTarget : null;

  const [records, setRecords] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [ledgerFilter, setLedgerFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profileForm, setProfileForm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [transactionForm, setTransactionForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const selectedRecord = records.find((record) => record.id === selectedId) || records[0] || null;
  const selectedRecordMatchesTab = selectedRecord
    ? (isCustomer ? selectedRecord.id.startsWith("CUS-") : selectedRecord.id.startsWith("SUP-"))
    : false;
  const visibleTransactions = useMemo(
    () => ledgerFilter === "All"
      ? transactions
      : transactions.filter((item) => item.type === ledgerFilter),
    [ledgerFilter, transactions]
  );

  // Load customer or supplier profiles whenever the top tab changes.
  useEffect(() => {
    let active = true;
    const loadProfiles = async () => {
      try {
        setLoading(true);
        setSelectedId(null);
        const endpoint = isCustomer ? "/ShowCustomers" : "/ShowSuppliers";
        const response = await fetch(`${API_URL}${endpoint}`);
        if (!response.ok) throw new Error(`Unable to load ${activeType}.`);
        const data = await response.json();
        if (!active) return;
        const mapped = data.map((record) => mapContact(record, isCustomer));
        setRecords(mapped);
        setSelectedId(mapped[0]?.id || null);
        setError("");
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadProfiles();
    return () => { active = false; };
  }, [activeType, isCustomer]);

  // Load the ledger that belongs to the selected profile.
  useEffect(() => {
    if (!selectedRecordMatchesTab || !selectedRecord) return;
    let active = true;
    const loadLedger = async () => {
      try {
        const endpoint = isCustomer ? "/CustomerTransactions" : "/SupplierTransactions";
        const response = await fetch(`${API_URL}${endpoint}/${encodeURIComponent(selectedRecord.id)}`);
        if (!response.ok) throw new Error("Unable to load transactions.");
        const data = await response.json();
        if (active) setTransactions(data.map(mapTransaction));
      } catch (requestError) {
        if (active) setError(requestError.message);
      }
    };
    loadLedger();
    return () => { active = false; };
  }, [isCustomer, selectedRecord, selectedRecordMatchesTab]);

  // Select and briefly highlight a result opened through the topbar search.
  useEffect(() => {
    if (!highlightedId || !records.some((record) => record.id === highlightedId)) return undefined;
    const highlightDelay = window.setTimeout(() => setSelectedId(highlightedId), 0);
    return () => window.clearTimeout(highlightDelay);
  }, [highlightedId, state?.searchRequestId, records]);

  const profilePayload = (form) => ({
    [isCustomer ? "customer_id" : "supplier_id"]: form.id,
    name: form.name,
    contact_person: form.contactPerson,
    role: form.role,
    email: form.email,
    phone: form.phone,
    address: form.address,
    status: form.status,
    tier: form.tier,
    [isCustomer ? "total_sales" : "total_purchases"]: Number(form.totalBusiness),
    outstanding_amount: Number(form.outstanding),
    credit_limit: Number(form.creditLimit),
    average_payment_days: Number(form.averagePaymentDays),
  });

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const action = editingId ? "Update" : "Insert";
      const noun = isCustomer ? "Customers" : "Suppliers";
      const url = editingId
        ? `${API_URL}/${action}${noun}/${encodeURIComponent(editingId)}`
        : `${API_URL}/${action}${noun}`;
      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profilePayload(profileForm)),
      });
      if (!response.ok) throw new Error(`Unable to save ${isCustomer ? "customer" : "supplier"}.`);
      const saved = mapContact(await response.json(), isCustomer);
      setRecords((current) => editingId
        ? current.map((record) => record.id === editingId ? saved : record)
        : [...current, saved]);
      setSelectedId(saved.id);
      setProfileForm(null);
      setEditingId(null);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteProfile = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const endpoint = isCustomer ? "/DeleteCustomers" : "/DeleteSuppliers";
      const response = await fetch(`${API_URL}${endpoint}/${encodeURIComponent(editingId)}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Unable to delete profile.");
      const remaining = records.filter((record) => record.id !== editingId);
      setRecords(remaining);
      setSelectedId(remaining[0]?.id || null);
      setProfileForm(null);
      setEditingId(null);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const saveTransaction = async (event) => {
    event.preventDefault();
    if (!selectedRecord) return;
    setSaving(true);
    try {
      const endpoint = isCustomer ? "/InsertCustomerTransactions" : "/InsertSupplierTransactions";
      const response = await fetch(`${API_URL}${endpoint}/${encodeURIComponent(selectedRecord.id)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction_id: transactionForm.id,
          transaction_date: transactionForm.date,
          description: transactionForm.description,
          transaction_type: transactionForm.type,
          debit: Number(transactionForm.debit),
          credit: Number(transactionForm.credit),
          balance: Number(transactionForm.balance),
        }),
      });
      if (!response.ok) throw new Error("Unable to save transaction.");
      const savedTransaction = mapTransaction(await response.json());
      setTransactions((current) => [savedTransaction, ...current]);
      setTransactionForm(null);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-0 flex-1 overflow-y-auto bg-[#080b08] p-4 text-white md:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#74c957]">Directory</p>
          <h1 className="mt-1 text-3xl font-bold">Customers &amp; Suppliers</h1>
          <p className="mt-1 text-sm text-[#8f9b8d]">Manage contacts, balances, and transaction activity.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {!isCustomer && <button type="button" onClick={() => { setEditingId(null); setProfileForm({ ...emptyProfile }); }} className="flex items-center gap-2 rounded-lg bg-[#63b447] px-4 py-2.5 text-sm font-bold text-black"><FiPlus />Add Supplier</button>}
          <div className="flex rounded-xl border border-[#36562f] bg-[#121812] p-1">
            <Link to="/customers" className={`rounded-lg px-5 py-2.5 text-sm font-bold ${isCustomer ? "bg-[#63b447] text-black" : "text-[#c7d0c5]"}`}>Customers</Link>
            <Link to="/suppliers" className={`rounded-lg px-5 py-2.5 text-sm font-bold ${!isCustomer ? "bg-[#63b447] text-black" : "text-[#c7d0c5]"}`}>Suppliers</Link>
          </div>
        </div>
      </div>

      {error && <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
      {loading ? <p className="py-16 text-center text-[#8f9b8d]">Loading {activeType}...</p> : records.length === 0 ? (
        <p className="py-16 text-center text-[#8f9b8d]">{isCustomer ? "No customers yet. A customer will appear after a named checkout." : "No suppliers found. Use Add Supplier to create the first one."}</p>
      ) : (
        <div className="grid min-w-0 gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="overflow-hidden rounded-2xl border border-[#36562f] bg-[#121812] p-2">
            <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#8f9b8d]">{isCustomer ? "Customer" : "Supplier"} directory</p>
            {records.map((record) => (
              <button key={record.id} type="button" data-search-target={record.id} onClick={() => setSelectedId(record.id)} className={`w-full rounded-xl p-3 text-left ${record.id === highlightedId ? "search-result-highlight" : record.id === selectedRecord?.id ? "bg-[#315f25]" : "hover:bg-white/5"}`}>
                <div className="flex items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#63b447]/15 text-sm font-bold text-[#8bd174]">{record.name.split(" ").map((word) => word[0]).join("").slice(0, 2)}</span><div className="min-w-0"><p className="truncate text-sm font-bold">{record.name}</p><p className="truncate text-xs text-[#8f9b8d]">{record.id}</p></div></div>
              </button>
            ))}
          </aside>

          <div className="grid min-w-0 gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
            <div className="grid content-start gap-4">
              <section className="rounded-2xl border border-[#36562f] bg-gradient-to-br from-[#172117] to-[#0e120e] p-5">
                <div className="flex items-start justify-between gap-3"><div><span className="rounded-full bg-[#63b447]/15 px-2.5 py-1 text-[10px] font-bold uppercase text-[#8bd174]">{selectedRecord.status}</span><h2 className="mt-3 text-2xl font-bold">{selectedRecord.name}</h2><p className="mt-1 text-xs font-semibold text-[#74c957]">{selectedRecord.id} · {selectedRecord.tier}</p></div><button type="button" onClick={() => { setEditingId(selectedRecord.id); setProfileForm({ ...selectedRecord }); }} className="grid size-9 place-items-center rounded-lg border border-[#36562f]" aria-label="Edit profile"><FiEdit2 /></button></div>
                <div className="mt-6 space-y-4 text-sm"><div><p className="text-xs uppercase text-[#8f9b8d]">Contact person</p><p className="mt-1 font-bold">{selectedRecord.contactPerson}</p><p className="text-xs italic text-[#c7d0c5]">{selectedRecord.role}</p></div><p className="flex gap-3 text-[#c7d0c5]"><FiMail className="shrink-0 text-[#74c957]" /><span className="break-all">{selectedRecord.email}</span></p><p className="flex gap-3 text-[#c7d0c5]"><FiPhone className="shrink-0 text-[#74c957]" />{selectedRecord.phone}</p><p className="flex gap-3 text-[#c7d0c5]"><FiMapPin className="shrink-0 text-[#74c957]" />{selectedRecord.address}</p></div>
              </section>
              <section className="grid grid-cols-2 gap-3">{[[isCustomer ? "Total Sales" : "Total Purchases", formatAmount(selectedRecord.totalBusiness)], ["Outstanding", formatAmount(selectedRecord.outstanding)], ["Credit Limit", formatAmount(selectedRecord.creditLimit)], ["Avg. Payment", `${selectedRecord.averagePaymentDays} Days`]].map(([label, value]) => <div key={label} className="rounded-xl border border-[#36562f] bg-[#121812] p-3"><p className="text-[10px] font-bold uppercase text-[#8f9b8d]">{label}</p><p className="mt-1 font-bold">{value}</p></div>)}</section>
            </div>

            <section className="min-w-0 overflow-hidden rounded-2xl border border-[#36562f] bg-[#121812]">
              <div className="flex flex-col gap-4 border-b border-white/10 p-5 md:flex-row md:items-center md:justify-between"><div><h2 className="text-xl font-bold">Transaction Ledger</h2><p className="text-xs text-[#8f9b8d]">Real-time debit and credit activity</p></div><div className="flex flex-wrap gap-2">{["All", "Payment", "Invoice"].map((filter) => <button key={filter} type="button" onClick={() => setLedgerFilter(filter)} className={`rounded-lg px-3 py-2 text-xs font-bold ${ledgerFilter === filter ? "bg-[#315f25]" : "text-[#c7d0c5]"}`}>{filter}{filter === "All" ? "" : "s"}</button>)}<button type="button" onClick={() => setTransactionForm({ ...emptyTransaction })} className="flex items-center gap-2 rounded-lg bg-[#63b447] px-3 py-2 text-xs font-bold text-black"><FiPlus />New Transaction</button></div></div>
              <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left"><thead className="bg-[#172117] text-xs uppercase text-[#a8b0a6]"><tr><th className="p-4">Date &amp; ID</th><th className="p-4">Description</th><th className="p-4 text-right">Debit</th><th className="p-4 text-right">Credit</th><th className="p-4 text-right">Balance</th></tr></thead><tbody>{visibleTransactions.map((item) => <tr key={item.id} className="border-t border-white/10 text-sm"><td className="p-4"><p className="font-bold">{formatDate(item.date)}</p><p className="text-xs text-[#8f9b8d]">{item.id}</p></td><td className="p-4"><p className="font-semibold">{item.description}</p><p className="text-xs text-[#8f9b8d]">{item.type}</p></td><td className="p-4 text-right text-red-300">{item.debit ? formatAmount(item.debit) : "-"}</td><td className="p-4 text-right text-[#74c957]">{item.credit ? formatAmount(item.credit) : "-"}</td><td className="p-4 text-right font-bold">{formatAmount(item.balance)}</td></tr>)}</tbody></table>{visibleTransactions.length === 0 && <p className="p-10 text-center text-sm text-[#8f9b8d]">No transactions found.</p>}</div>
            </section>
          </div>
        </div>
      )}

      {profileForm && <Modal title={`${editingId ? "Edit" : "Add"} ${isCustomer ? "Customer" : "Supplier"}`} close={() => { setProfileForm(null); setEditingId(null); }}><form onSubmit={saveProfile} className="grid gap-3 sm:grid-cols-2">{[["id", `${isCustomer ? "Customer" : "Supplier"} ID`, "text"], ["name", "Business name", "text"], ["contactPerson", "Contact person", "text"], ["role", "Role", "text"], ["email", "Email", "email"], ["phone", "Phone", "text"], ["address", "Address", "text"], ["status", "Status", "text"], ["tier", "Tier", "text"], ["totalBusiness", isCustomer ? "Total sales" : "Total purchases", "number"], ["outstanding", "Outstanding", "number"], ["creditLimit", "Credit limit", "number"], ["averagePaymentDays", "Average payment days", "number"]].map(([key, label, type]) => <label key={key} className={key === "address" ? "sm:col-span-2" : ""}><span className="mb-1 block text-xs text-[#a8b0a6]">{label}</span><input required type={type} value={profileForm[key]} disabled={key === "id" && editingId} onChange={(event) => setProfileForm((current) => ({ ...current, [key]: event.target.value }))} className="w-full rounded-lg border border-[#36562f] bg-[#0b100b] p-2.5 outline-none focus:border-[#63b447] disabled:opacity-60" /></label>)}<div className="flex gap-2 sm:col-span-2">{editingId && <button type="button" onClick={deleteProfile} disabled={saving} className="rounded-lg border border-red-500/50 px-4 py-2.5 font-bold text-red-300">Delete</button>}<button disabled={saving} className="ml-auto rounded-lg bg-[#63b447] px-5 py-2.5 font-bold text-black">{saving ? "Saving..." : "Save"}</button></div></form></Modal>}

      {transactionForm && <Modal title={`New transaction for ${selectedRecord?.name}`} close={() => setTransactionForm(null)}><form onSubmit={saveTransaction} className="grid gap-3 sm:grid-cols-2">{[["id", "Transaction ID", "text"], ["date", "Date", "date"], ["description", "Description", "text"], ["type", "Type", "select"], ["debit", "Debit", "number"], ["credit", "Credit", "number"], ["balance", "Balance", "number"]].map(([key, label, type]) => <label key={key}><span className="mb-1 block text-xs text-[#a8b0a6]">{label}</span>{type === "select" ? <select value={transactionForm[key]} onChange={(event) => setTransactionForm((current) => ({ ...current, [key]: event.target.value }))} className="w-full rounded-lg border border-[#36562f] bg-[#0b100b] p-2.5"><option>Invoice</option><option>Payment</option></select> : <input required type={type} value={transactionForm[key]} onChange={(event) => setTransactionForm((current) => ({ ...current, [key]: event.target.value }))} className="w-full rounded-lg border border-[#36562f] bg-[#0b100b] p-2.5 outline-none focus:border-[#63b447]" />}</label>)}<button disabled={saving} className="rounded-lg bg-[#63b447] px-5 py-2.5 font-bold text-black sm:col-span-2">{saving ? "Saving..." : "Save Transaction"}</button></form></Modal>}
    </main>
  );
};

const Modal = ({ title, close, children }) => <div className="fixed inset-0 z-[150] grid place-items-center bg-black/65 p-4 backdrop-blur-sm"><section className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#36562f] bg-[#121812] p-5 text-white shadow-2xl"><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold">{title}</h2><button type="button" onClick={close} className="grid size-9 place-items-center rounded-lg hover:bg-white/10" aria-label="Close"><FiX /></button></div>{children}</section></div>;

export default Contacts;
