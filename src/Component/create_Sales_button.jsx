import { useState } from "react";
import { FiCalendar, FiPlus, FiX } from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const emptySale = {
  invoice_id: "",
  customer_name: "",
  customer_email: "",
  invoice_date: "",
  due_date: "",
  amount: "",
  currency: "PKR",
  status: "pending",
};

const SalesButtonVariant = ({ onSaleCreated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState(emptySale);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const openForm = () => {
    setError("");
    setIsOpen(true);
  };

  const closeForm = () => {
    if (isSubmitting) return;
    setIsOpen(false);
    setError("");
  };

  const updateField = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const createSale = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // Keep the progress UI visible long enough to communicate that saving occurred.
      const [response] = await Promise.all([
        fetch(`${API_URL}/Insertsales`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            amount: Number(formData.amount),
          }),
        }),
        new Promise((resolve) => window.setTimeout(resolve, 2000)),
      ]);

      if (!response.ok) {
        const responseBody = await response.json().catch(() => null);
        throw new Error(responseBody?.detail || "Unable to create the sale.");
      }

      const createdSale = await response.json();
      if (!createdSale || !createdSale.invoice_id) {
        throw new Error(
          "The backend returned an empty sale. Restart FastAPI and try again."
        );
      }

      onSaleCreated?.(createdSale);
      setFormData(emptySale);
      setIsOpen(false);
    } catch (requestError) {
      setError(
        typeof requestError.message === "string"
          ? requestError.message
          : "Unable to create the sale."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openForm}
        className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#63b447] px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-[#74c957]"
      >
        <FiPlus />
        New Sale
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[140] grid place-items-center overflow-y-auto p-4">
          {/* Clicking the blurred backdrop closes the form while no request is running. */}
          <button
            type="button"
            onClick={closeForm}
            className="fixed inset-0 bg-black/65 backdrop-blur-md"
            aria-label="Close new sale form"
          />

          <form
            onSubmit={createSale}
            className="relative z-10 my-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-[#36562f] bg-[#121812] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5 sm:p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#74c957]">
                  Sales &amp; Billing
                </p>
                <h2 className="mt-1 text-2xl font-bold text-white">Create New Sale</h2>
                <p className="mt-1 text-sm text-[#8f9b8d]">
                  Enter the invoice and customer information.
                </p>
              </div>
              <button
                type="button"
                onClick={closeForm}
                disabled={isSubmitting}
                className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg text-xl text-[#c7d0c5] hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Close new sale form"
              >
                <FiX />
              </button>
            </div>

            {/* Form fields match Backend/main.py Salemodel exactly. */}
            <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
              <label className="grid gap-2 text-sm font-semibold text-[#c7d0c5]">
                Invoice ID
                <input
                  required
                  value={formData.invoice_id}
                  onChange={(event) => updateField("invoice_id", event.target.value)}
                  placeholder="INV-8833"
                  disabled={isSubmitting}
                  className="rounded-lg border border-[#36562f] bg-[#0b100b] px-3 py-2.5 text-white outline-none placeholder:text-[#6f796d] focus:border-[#63b447]"
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold text-[#c7d0c5]">
                Customer name
                <input
                  required
                  value={formData.customer_name}
                  onChange={(event) => updateField("customer_name", event.target.value)}
                  placeholder="Customer or business name"
                  disabled={isSubmitting}
                  className="rounded-lg border border-[#36562f] bg-[#0b100b] px-3 py-2.5 text-white outline-none placeholder:text-[#6f796d] focus:border-[#63b447]"
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold text-[#c7d0c5] sm:col-span-2">
                Customer email
                <input
                  required
                  type="email"
                  value={formData.customer_email}
                  onChange={(event) => updateField("customer_email", event.target.value)}
                  placeholder="customer@example.com"
                  disabled={isSubmitting}
                  className="rounded-lg border border-[#36562f] bg-[#0b100b] px-3 py-2.5 text-white outline-none placeholder:text-[#6f796d] focus:border-[#63b447]"
                />
              </label>

              {[
                ["Invoice date", "invoice_date"],
                ["Due date", "due_date"],
              ].map(([label, field]) => (
                <label key={field} className="grid gap-2 text-sm font-semibold text-[#c7d0c5]">
                  {label}
                  <span className="relative">
                    <input
                      required
                      type="date"
                      value={formData[field]}
                      onChange={(event) => updateField(field, event.target.value)}
                      disabled={isSubmitting}
                      className="custom-date-input w-full rounded-lg border border-[#36562f] bg-[#0b100b] py-2.5 pl-3 pr-10 text-white outline-none focus:border-[#63b447]"
                    />
                    <FiCalendar className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white" />
                  </span>
                </label>
              ))}

              <label className="grid gap-2 text-sm font-semibold text-[#c7d0c5]">
                Amount
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={(event) => updateField("amount", event.target.value)}
                  placeholder="0"
                  disabled={isSubmitting}
                  className="rounded-lg border border-[#36562f] bg-[#0b100b] px-3 py-2.5 text-white outline-none placeholder:text-[#6f796d] focus:border-[#63b447]"
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold text-[#c7d0c5]">
                Currency
                <select
                  value={formData.currency}
                  onChange={(event) => updateField("currency", event.target.value)}
                  disabled={isSubmitting}
                  className="rounded-lg border border-[#36562f] bg-[#0b100b] px-3 py-2.5 text-white outline-none focus:border-[#63b447]"
                >
                  <option value="PKR">PKR</option>
                </select>
              </label>

              <label className="grid gap-2 text-sm font-semibold text-[#c7d0c5] sm:col-span-2">
                Status
                <select
                  value={formData.status}
                  onChange={(event) => updateField("status", event.target.value)}
                  disabled={isSubmitting}
                  className="rounded-lg border border-[#36562f] bg-[#0b100b] px-3 py-2.5 capitalize text-white outline-none focus:border-[#63b447]"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </label>
            </div>

            {/* Request error or animated saving state */}
            {error && (
              <p className="mx-5 rounded-lg border border-red-900/60 bg-red-500/10 px-4 py-3 text-sm text-red-300 sm:mx-6">
                {error}
              </p>
            )}

            {isSubmitting && (
              <div className="mx-5 rounded-xl border border-[#36562f] bg-[#0b100b] p-4 sm:mx-6">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-white">Saving sale to database...</span>
                  <span className="text-[#74c957]">Please wait</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#243024]">
                  <div className="h-full w-2/3 animate-pulse rounded-full bg-[#63b447]" />
                </div>
              </div>
            )}

            {/* Modal actions */}
            <div className="mt-5 flex justify-end gap-3 border-t border-white/10 p-5 sm:p-6">
              <button
                type="button"
                onClick={closeForm}
                disabled={isSubmitting}
                className="cursor-pointer rounded-lg border border-[#36562f] px-5 py-2.5 font-semibold text-[#c7d0c5] hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="cursor-pointer rounded-lg bg-[#63b447] px-5 py-2.5 font-bold text-black hover:bg-[#74c957] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Creating..." : "Create Sale"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

const emptyProduct = {
  product_id: "",
  category: "",
  title: "",
  sku: "",
  price: "",
  stock_quantity: "",
};

const ProductButtonVariant = ({
  onProductCreated,
  onProductUpdated,
  onEditClosed,
  productToEdit = null,
  hideTrigger = false,
}) => {
  const isEditing = Boolean(productToEdit);
  const [isOpen, setIsOpen] = useState(isEditing);
  const [formData, setFormData] = useState(() =>
    productToEdit
      ? {
          product_id: productToEdit.id,
          category: productToEdit.category,
          title: productToEdit.name,
          sku: productToEdit.sku,
          price: productToEdit.price,
          stock_quantity: productToEdit.stock,
        }
      : emptyProduct
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const closeForm = () => {
    if (isSubmitting) return;
    setIsOpen(false);
    setError("");
    onEditClosed?.();
  };

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const createProduct = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const [response] = await Promise.all([
        fetch(
          isEditing
            ? `${API_URL}/updateproducts/${encodeURIComponent(productToEdit.id)}`
            : `${API_URL}/Insertproducts`,
          {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isEditing
              ? {
                  category: formData.category,
                  title: formData.title,
                  sku: formData.sku,
                  price: Number(formData.price),
                  stock_quantity: Number(formData.stock_quantity),
                }
              : {
                  ...formData,
                  price: Number(formData.price),
                  stock_quantity: Number(formData.stock_quantity),
                }
          ),
        }),
        new Promise((resolve) => window.setTimeout(resolve, 1500)),
      ]);

      if (!response.ok) {
        const responseBody = await response.json().catch(() => null);
        throw new Error(
          typeof responseBody?.detail === "string"
            ? responseBody.detail
            : "Unable to create the product."
        );
      }

      const createdProduct = await response.json();
      if (isEditing) {
        onProductUpdated?.(createdProduct);
      } else {
        onProductCreated?.(createdProduct);
      }
      setFormData(emptyProduct);
      setIsOpen(false);
      onEditClosed?.();
    } catch (requestError) {
      setError(requestError.message || "Unable to create the product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {!hideTrigger && (
        <button
          type="button"
          onClick={() => {
            setError("");
            setIsOpen(true);
          }}
          className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#63b447] px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-[#74c957]"
        >
          <FiPlus />
          Add Product
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-[140] grid place-items-center overflow-y-auto p-4">
          <button
            type="button"
            onClick={closeForm}
            className="fixed inset-0 bg-black/65 backdrop-blur-md"
            aria-label="Close add product form"
          />

          <form
            onSubmit={createProduct}
            className="relative z-10 my-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-[#36562f] bg-[#121812] shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5 sm:p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#74c957]">
                  {isEditing ? "Product Management" : "Quick Sale"}
                </p>
                <h2 className="mt-1 text-2xl font-bold text-white">
                  {isEditing ? "Edit Product" : "Add Product"}
                </h2>
                <p className="mt-1 text-sm text-[#8f9b8d]">
                  {isEditing
                    ? "Update this product's information and stock."
                    : "Add a product to the Quick Sale product list."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeForm}
                disabled={isSubmitting}
                className="grid size-9 cursor-pointer place-items-center rounded-lg text-xl text-gray-400 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close add product form"
              >
                <FiX />
              </button>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
              {[
                ["product_id", "Product ID", "text"],
                ["category", "Category", "text"],
                ["title", "Product title", "text"],
                ["sku", "SKU", "text"],
                ["price", "Price", "number"],
                ["stock_quantity", "Stock quantity", "number"],
              ].map(([field, label, type]) => (
                <label key={field} className="grid gap-2 text-sm font-semibold text-[#c7d0c5]">
                  {label}
                  <input
                    required
                    type={type}
                    min={type === "number" ? "0" : undefined}
                    step={field === "price" ? "0.01" : undefined}
                    value={formData[field]}
                    readOnly={isEditing && field === "product_id"}
                    onChange={(event) => updateField(field, event.target.value)}
                    className={`rounded-lg border border-[#36562f] px-3 py-2.5 outline-none ${
                      isEditing && field === "product_id"
                        ? "cursor-not-allowed bg-white/5 text-gray-400"
                        : "bg-[#0b100b] text-white focus:border-[#63b447]"
                    }`}
                  />
                </label>
              ))}
            </div>

            {error && (
              <p className="mx-5 rounded-lg border border-red-900/60 bg-red-500/10 px-4 py-3 text-sm text-red-300 sm:mx-6">
                {error}
              </p>
            )}

            {isSubmitting && (
              <div className="mx-5 rounded-xl border border-[#36562f] bg-[#0b100b] p-4 sm:mx-6">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-white">
                    {isEditing ? "Saving product changes..." : "Adding product..."}
                  </span>
                  <span className="text-[#74c957]">Reloading products</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#243024]">
                  <div className="h-full w-2/3 animate-pulse rounded-full bg-[#63b447]" />
                </div>
              </div>
            )}

            <div className="mt-5 flex justify-end gap-3 border-t border-white/10 p-5 sm:p-6">
              <button
                type="button"
                onClick={closeForm}
                disabled={isSubmitting}
                className="cursor-pointer rounded-lg border border-[#36562f] px-5 py-2.5 font-semibold text-[#c7d0c5] hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="cursor-pointer rounded-lg bg-[#63b447] px-5 py-2.5 font-bold text-black hover:bg-[#74c957] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? isEditing ? "Saving..." : "Adding..."
                  : isEditing ? "Save Changes" : "Add Product"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

const CreateSalesButton = ({ mode = "sale", ...props }) =>
  mode === "product"
    ? <ProductButtonVariant {...props} />
    : <SalesButtonVariant {...props} />;

export default CreateSalesButton;
