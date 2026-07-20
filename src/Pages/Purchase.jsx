import { CiDeliveryTruck } from "react-icons/ci";
import { FiPackage } from "react-icons/fi";
import Box from "../Component/Box";
import { GiCash } from "react-icons/gi";
import PurchaseReport from "../Component/PurchaseReport";
import { BiSolidPurchaseTag } from "react-icons/bi";

const Purchase = () => {
  return (
    <main className="min-h-0 flex-1 overflow-y-auto bg-[#080b08] p-4 text-white md:p-6 lg:p-8">
      {/* Dashboard summary cards grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-4 mb-6">
        <Box
          width="100%"
          height="120px"
          Subtitle="Total Purchases"
          Title="Last 3 month"
          Amount="100"
          Icon={BiSolidPurchaseTag}
          color="white"
        />
        <Box
          width="100%"
          height="120px"
          Subtitle="Amount Paid"
          Title="Last 1 week"
          Amount="5000PKR"
          Icon={GiCash}
          color="white"
        />
        <Box
          width="100%"
          height="120px"
          Subtitle="Purchase Orders"
          Title="Last 1 months"
          Amount="200"
          Icon={FiPackage}
          color="white"
        />
        <Box
          width="100%"
          height="120px"
          Subtitle="Pending Deliveries"
          Title="Last 3 months"
          Amount="1000"
          Icon={CiDeliveryTruck}
          color="white"
        />
      </div>
      <PurchaseReport />
    </main>
  )
}

export default Purchase
