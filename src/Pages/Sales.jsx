import { FaRegClock } from "react-icons/fa";
import { CiWarning } from "react-icons/ci";
import { FaChartColumn } from "react-icons/fa6";
import Box from "../Component/Box";
import { MdPointOfSale } from "react-icons/md";
import SalesReport from "../Component/SalesReport";

const Sales = () => {
  return (
    <main className="min-h-0 flex-1 overflow-y-auto bg-[#080b08] p-4 text-white md:p-6 lg:p-8">
      {/* Dashboard summary cards grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-4 mb-6">
        <Box
          width="100%"
          height="120px"
          Subtitle="Total sales"
          Title="Last 1 month"
          Amount="PKR 12,000"
          Icon={MdPointOfSale}
          color="#63b447"
        />
        <Box
          width="100%"
          height="120px"  
          Subtitle="Pending Invoices"
          Title="Last 3 months"
          Amount="10"
          Icon={FaRegClock}
          color="white"
        />
        <Box
          width="100%"
          height="120px"
          Subtitle="Overdue"
          Title="Last 1 months"
          Amount="20"
          Icon={CiWarning}
          color="white"
        />
        <Box
          width="100%"
          height="120px"
          Subtitle="Avg.Overdue"
          Title="Last 4 months"
          Amount="1100"
          Icon={FaChartColumn}
          color="white"
        />
      </div>
      <SalesReport/>
    </main>
  )
}

export default Sales
