const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(amount);

const ThermalReceipt = ({ receipt }) => {
  if (!receipt) return null;

  return (
    // Hidden on screen; index.css reveals and sizes this section only during print.
    <section className="thermal-receipt" aria-hidden="true">
      <header className="receipt-center">
        <h1>Mirza Traders</h1>
        <p>Plywood &amp; Hardware</p>
        <p>Lahore, Pakistan</p>
        <p>Phone: +92 300 1234567</p>
      </header>

      <div className="receipt-divider" />

      <div className="receipt-meta">
        <p><strong>Invoice:</strong> {receipt.invoiceNumber}</p>
        <p><strong>Date:</strong> {receipt.date}</p>
        <p><strong>Cashier:</strong> Alex Rivera</p>
        <p><strong>Customer:</strong> {receipt.customer.name || "Walk-in Customer"}</p>
        {receipt.customer.phone && <p><strong>Phone:</strong> {receipt.customer.phone}</p>}
      </div>

      <div className="receipt-divider" />

      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {receipt.items.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.quantity}</td>
              <td>{formatCurrency(item.price)}</td>
              <td>{formatCurrency(item.price * item.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="receipt-divider" />

      <div className="receipt-totals">
        <p><span>Subtotal</span><span>{formatCurrency(receipt.subtotal)}</span></p>
        <p><span>Tax (5%)</span><span>{formatCurrency(receipt.tax)}</span></p>
        <p className="receipt-grand-total"><span>Total</span><span>{formatCurrency(receipt.grandTotal)}</span></p>
        <p><span>Payment</span><span>{receipt.paymentMethod}</span></p>
        <p><span>Paid</span><span>{formatCurrency(receipt.amountPaid)}</span></p>
        {receipt.changeDue > 0 && <p><span>Change</span><span>{formatCurrency(receipt.changeDue)}</span></p>}
      </div>

      <div className="receipt-divider" />

      <footer className="receipt-center">
        <p>Thank you for shopping with us!</p>
        <p>Goods once sold are subject to store policy.</p>
      </footer>
    </section>
  );
};

export default ThermalReceipt;
