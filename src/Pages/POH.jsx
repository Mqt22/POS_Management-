const purchaseHistory = [
  {
    id: 1,
    product: "Claw Hammer 16oz",
    supplier: "Pak Hardware Supply",
    lastCost: 1250,
    currentCost: 1320,
    quantity: 24,
    purchaseDate: "Jul 18, 2026",
    invoiceNumber: "INV-1048",
  },
  {
    id: 2,
    product: "Portland Cement 50kg",
    supplier: "BuildRight Traders",
    lastCost: 1390,
    currentCost: 1450,
    quantity: 100,
    purchaseDate: "Jul 17, 2026",
    invoiceNumber: "INV-1047",
  },
  {
    id: 3,
    product: "PVC Pipe 1 inch",
    supplier: "National Pipe Store",
    lastCost: 480,
    currentCost: 465,
    quantity: 60,
    purchaseDate: "Jul 15, 2026",
    invoiceNumber: "INV-1043",
  },
  {
    id: 4,
    product: "Steel Nails 2 inch",
    supplier: "Metro Fasteners",
    lastCost: 210,
    currentCost: 210,
    quantity: 80,
    purchaseDate: "Jul 13, 2026",
    invoiceNumber: "INV-1039",
  },
  {
    id: 5,
    product: "Interior Paint 4L",
    supplier: "Colour House",
    lastCost: 3100,
    currentCost: 3250,
    quantity: 18,
    purchaseDate: "Jul 10, 2026",
    invoiceNumber: "INV-1034",
  },
];

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(amount);

const POH = () => {
  return (
    <main className="min-h-0 flex-1 overflow-y-auto bg-[#080b08] p-4 text-white md:p-6 lg:p-8">
      <section className="w-full overflow-hidden rounded-xl border border-white/5 bg-[#121812]">
        <div className="border-b border-white/10 p-5">
          <h1 className="text-2xl font-bold text-white">
            Product Purchase History
          </h1>
          <p className="mt-1 text-sm text-[#8f9b8d]">
            Review product costs and supplier purchase records.
          </p>
        </div>

        <div className="sales-table-scrollbar overflow-x-auto">
          <table className="w-full min-w-[950px] border-collapse text-left">
            <thead className="bg-[#182218]">
              <tr className="text-xs uppercase tracking-wide text-[#c7d0c5]">
                <th className="px-5 py-4 font-semibold">Product</th>
                <th className="px-5 py-4 font-semibold">Supplier</th>
                <th className="px-5 py-4 font-semibold">Last Cost</th>
                <th className="px-5 py-4 font-semibold">Current Cost</th>
                <th className="px-5 py-4 font-semibold">Quantity</th>
                <th className="px-5 py-4 font-semibold">Purchase Date</th>
                <th className="px-5 py-4 font-semibold">Invoice #</th>
              </tr>
            </thead>
            <tbody>
              {purchaseHistory.map((purchase) => {
                const costDifference =
                  purchase.currentCost - purchase.lastCost;

                return (
                  <tr
                    key={purchase.id}
                    className="border-b border-white/10 text-sm text-[#c7d0c5] last:border-b-0 hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-5 font-bold text-white">
                      {purchase.product}
                    </td>
                    <td className="px-5 py-5">{purchase.supplier}</td>
                    <td className="whitespace-nowrap px-5 py-5">
                      {formatCurrency(purchase.lastCost)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-5">
                      <span className="font-bold text-white">
                        {formatCurrency(purchase.currentCost)}
                      </span>
                      {costDifference !== 0 && (
                        <span
                          className={`ml-2 text-xs font-semibold ${
                            costDifference > 0
                              ? "text-red-400"
                              : "text-[#74c957]"
                          }`}
                        >
                          {costDifference > 0 ? "+" : ""}
                          {formatCurrency(costDifference)}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-5">{purchase.quantity}</td>
                    <td className="whitespace-nowrap px-5 py-5">
                      {purchase.purchaseDate}
                    </td>
                    <td className="whitespace-nowrap px-5 py-5 font-semibold text-[#74c957]">
                      {purchase.invoiceNumber}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
};

export default POH;
