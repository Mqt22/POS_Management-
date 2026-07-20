import Box from "../Component/Box.jsx";
import { BiSolidPurchaseTag } from "react-icons/bi";
import { FaBox } from "react-icons/fa";
import { IoPieChartSharp } from "react-icons/io5";
import { MdInventory2, MdPointOfSale } from "react-icons/md";
import SalesReport from "../Component/SalesReport.jsx";
import PurchaseReport from "../Component/PurchaseReport.jsx";
import DashboardInsights from "../Component/DashboardInsights.jsx";
import {FiUsers} from "react-icons/fi";

const MianContent = () => {

    return (
        // Main scrollable dashboard content area
        <main className="min-h-0 flex-1 overflow-y-auto bg-[#080b08] p-4 md:p-6 lg:p-8">
            {/* Dashboard summary cards grid */}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-4">
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
                    Subtitle="Total Purchases"
                    Title="Last 3 month"
                    Amount="100"
                    Icon={BiSolidPurchaseTag}
                    color="white"
                />
                <Box
                    width="100%"
                    height="120px"
                    Subtitle="Total Items"
                    Title="Last 1 month"
                    Amount="80"
                    Icon={MdInventory2}
                    color="white"
                />
                <Box
                    width="100%"
                    height="120px"
                    Subtitle="Total Customers"
                    Title="Last 4 month"
                    Amount="1300"
                    Icon={FiUsers}
                    color="white"
                />
                <Box
                    width="100%"
                    height="120px"
                    Subtitle="Total Suppliers"
                    Title="Last 2 month"
                    Amount="100"
                    Icon={FaBox}
                    color="white"
                />                
                <Box
                    width="100%"
                    height="120px"
                    Subtitle="Total Revenue"
                    Title="Last 4 month"
                    Amount="PKR 5,300"
                    Icon={IoPieChartSharp}
                    color="white"
                />
            </div>
            {/* Sales report and remaining module insights */}
            <div className="mt-6 grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
                <SalesReport/>
                <DashboardInsights/>
            </div>
            <PurchaseReport/>
        </main>
    );
}

export default MianContent
