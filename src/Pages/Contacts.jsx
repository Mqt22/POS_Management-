import { useEffect, useMemo, useState } from "react";
import { FiEdit2, FiMail, FiMapPin, FiPhone, FiPlus, FiSearch } from "react-icons/fi";
import { Link, useLocation } from "react-router-dom";
import { customerSupplierData } from "../Data/CustomerSupplierData.jsx";

const formatAmount = (amount) =>
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

const Contacts = () => {
  const { pathname, state } = useLocation();
  const activeType = pathname.startsWith("/suppliers") ? "suppliers" : "customers";
  const records = customerSupplierData[activeType];
  const [selectedId, setSelectedId] = useState(records[0].id);
  const [search, setSearch] = useState("");
  const [ledgerFilter, setLedgerFilter] = useState("All");

  const visibleRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    return records.filter((record) =>
      !query ||
      [record.name, record.id, record.contactPerson]
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [records, search]);

  const selectedRecord =
    records.find((record) => record.id === selectedId) || records[0];
  const transactions = ledgerFilter === "All"
    ? selectedRecord.transactions
    : selectedRecord.transactions.filter((item) => item.type === ledgerFilter);
  const isCustomer = activeType === "customers";
  const expectedSearchType = isCustomer ? "Customers" : "Suppliers";
  const highlightedId = state?.searchType === expectedSearchType ? state.searchTarget : null;

  useEffect(() => {
    if (!highlightedId || !records.some((record) => record.id === highlightedId)) return;
    const timeout = window.setTimeout(() => {
      setSelectedId(highlightedId);
      setSearch("");
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [highlightedId, records]);

  return (
    <main className="min-h-0 flex-1 overflow-y-auto bg-[#080b08] p-4 text-white md:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#74c957]">Directory</p>
          <h1 className="mt-1 text-3xl font-bold">Customers &amp; Suppliers</h1>
          <p className="mt-1 text-sm text-[#8f9b8d]">Manage contacts, balances, and transaction activity.</p>
        </div>

        <div className="flex rounded-xl border border-[#36562f] bg-[#121812] p-1">
          <Link to="/customers" className={`rounded-lg px-5 py-2.5 text-sm font-bold transition-colors ${isCustomer ? "bg-[#63b447] text-black" : "text-[#c7d0c5] hover:bg-white/5"}`}>
            Customers
          </Link>
          <Link to="/suppliers" className={`rounded-lg px-5 py-2.5 text-sm font-bold transition-colors ${!isCustomer ? "bg-[#63b447] text-black" : "text-[#c7d0c5] hover:bg-white/5"}`}>
            Suppliers
          </Link>
        </div>
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-2xl border border-[#36562f] bg-[#121812]">
          <div className="border-b border-white/10 p-4">
            <label className="relative block">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8f9b8d]" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${activeType}`} className="w-full rounded-lg border border-[#36562f] bg-[#0b100b] py-2.5 pl-9 pr-3 text-sm outline-none placeholder:text-[#6f796d] focus:border-[#63b447]" />
            </label>
          </div>
          <div className="grid gap-1 p-2">
            {visibleRecords.map((record) => (
              <button
                key={record.id}
                type="button"
                data-search-target={record.id}
                onClick={() => setSelectedId(record.id)}
                className={`cursor-pointer rounded-xl p-3 text-left transition-colors ${
                  record.id === highlightedId
                    ? "search-result-highlight"
                    : record.id === selectedRecord.id
                      ? "bg-[#315f25]"
                      : "hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#63b447]/15 text-sm font-bold text-[#8bd174]">
                    {record.name.split(" ").map((word) => word[0]).join("").slice(0, 2)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">{record.name}</p>
                    <p className="mt-0.5 truncate text-xs text-[#8f9b8d]">{record.id}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <div className="grid min-w-0 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="grid content-start gap-4">
            <section className="rounded-2xl border border-[#36562f] bg-gradient-to-br from-[#172117] to-[#0e120e] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-flex rounded-full bg-[#63b447]/15 px-2.5 py-1 text-[10px] font-bold uppercase text-[#8bd174]">{selectedRecord.status}</span>
                  <h2 className="mt-3 text-2xl font-bold">{selectedRecord.name}</h2>
                  <p className="mt-1 text-xs font-semibold text-[#74c957]">{selectedRecord.id} · {selectedRecord.tier}</p>
                </div>
                <button type="button" className="grid size-9 cursor-pointer place-items-center rounded-lg border border-[#36562f] text-[#c7d0c5] hover:bg-white/5" aria-label="Edit profile"><FiEdit2 /></button>
              </div>

              <div className="mt-6 space-y-4 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#8f9b8d]">Contact person</p>
                  <p className="mt-1 font-bold">{selectedRecord.contactPerson}</p>
                  <p className="text-xs italic text-[#c7d0c5]">{selectedRecord.role}</p>
                </div>
                <p className="flex items-start gap-3 text-[#c7d0c5]"><FiMail className="mt-0.5 shrink-0 text-[#74c957]" /><span className="break-all">{selectedRecord.email}</span></p>
                <p className="flex items-start gap-3 text-[#c7d0c5]"><FiPhone className="mt-0.5 shrink-0 text-[#74c957]" />{selectedRecord.phone}</p>
                <p className="flex items-start gap-3 text-[#c7d0c5]"><FiMapPin className="mt-0.5 shrink-0 text-[#74c957]" />{selectedRecord.address}</p>
              </div>
            </section>

            <section className="grid grid-cols-2 gap-3">
              {[
                [isCustomer ? "Total Sales" : "Total Purchases", formatAmount(selectedRecord.totalBusiness), "text-white"],
                ["Outstanding", formatAmount(selectedRecord.outstanding), "text-red-300"],
                ["Credit Limit", formatAmount(selectedRecord.creditLimit), "text-white"],
                ["Avg. Payment", selectedRecord.averagePayment, "text-white"],
              ].map(([label, value, color]) => (
                <div key={label} className="rounded-xl border border-[#36562f] bg-[#121812] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#8f9b8d]">{label}</p>
                  <p className={`mt-1 text-base font-bold ${color}`}>{value}</p>
                </div>
              ))}
            </section>
          </div>

          <section className="min-w-0 overflow-hidden rounded-2xl border border-[#36562f] bg-[#121812]">
            <div className="flex flex-col gap-4 border-b border-white/10 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold">Transaction Ledger</h2>
                <p className="mt-1 text-xs text-[#8f9b8d]">Real-time debit and credit activity</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {["All", "Payment", "Invoice"].map((filter) => (
                  <button key={filter} type="button" onClick={() => setLedgerFilter(filter)} className={`cursor-pointer rounded-lg px-3 py-2 text-xs font-bold ${ledgerFilter === filter ? "bg-[#315f25] text-white" : "text-[#c7d0c5] hover:bg-white/5"}`}>{filter}{filter !== "All" ? "s" : ""}</button>
                ))}
                <button type="button" className="flex cursor-pointer items-center gap-2 rounded-lg bg-[#63b447] px-3 py-2 text-xs font-bold text-black hover:bg-[#74c957]"><FiPlus />New Transaction</button>
              </div>
            </div>

            <div className="sales-table-scrollbar overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead className="bg-[#182218] text-xs uppercase tracking-wide text-[#c7d0c5]">
                  <tr>
                    <th className="px-5 py-4">Date &amp; ID</th>
                    <th className="px-5 py-4">Description</th>
                    <th className="px-5 py-4 text-right">Debit</th>
                    <th className="px-5 py-4 text-right">Credit</th>
                    <th className="px-5 py-4 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-white/10 text-sm last:border-b-0">
                      <td className="whitespace-nowrap px-5 py-5"><p className="font-bold">{formatDate(transaction.date)}</p><p className="mt-1 text-xs text-[#8f9b8d]">{transaction.id}</p></td>
                      <td className="px-5 py-5"><p className="font-semibold">{transaction.description}</p><p className="mt-1 text-xs text-[#8f9b8d]">{transaction.type}</p></td>
                      <td className="whitespace-nowrap px-5 py-5 text-right font-bold text-red-300">{transaction.debit ? formatAmount(transaction.debit) : "—"}</td>
                      <td className="whitespace-nowrap px-5 py-5 text-right font-bold text-[#74c957]">{transaction.credit ? formatAmount(transaction.credit) : "—"}</td>
                      <td className="whitespace-nowrap px-5 py-5 text-right font-bold">{formatAmount(transaction.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default Contacts;
