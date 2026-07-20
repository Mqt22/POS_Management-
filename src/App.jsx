import { Routes, Route } from 'react-router-dom'
import Sales from "./Pages/Sales"
import Dashboard from "./Pages/Dashboard"
import MianContent from "./Pages/MianContent"
import WIC from "./Pages/WIC"
import Purchase from './Pages/Purchase'
import POH from './Pages/POH'
import Inventory from './Pages/Inventory'
import Contacts from './Pages/Contacts'
import Reports from './Pages/Reports'

const App = () => {

  return (
    <Routes>
      {/* Route For Main Dashboard */}
      <Route element={<Dashboard />}>
        {/* Route for Main Content */}
        <Route index element={<MianContent />} />
        {/* Route for Sales */}
        <Route path="sales" element={<Sales />} />
        <Route path="sales/billing" element={<Sales />} />
        <Route path="sales/quick-sale" element={<WIC />} />
        {/* Route for Purchases */}
        <Route path="purchases" element={<Purchase />} />
        <Route path="purchases/orders" element={<Purchase />} />
        <Route path="purchases/history" element={<POH />} />
        {/* Route for Inventory */}
        <Route path="inventory" element={<Inventory />} />
        {/* Routes for Customers and Suppliers */}
        <Route path="customers" element={<Contacts />} />
        <Route path="suppliers" element={<Contacts />} />
        {/* Route for Financial Reports */}
        <Route path="reports" element={<Reports />} />
      </Route>
    </Routes>
  )
}

export default App
