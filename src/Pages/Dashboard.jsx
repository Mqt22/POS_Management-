import { useState } from 'react'
import Sidebar from '../Component/Sidebar'
import Topbar from '../Component/Topbar'
import { Outlet } from 'react-router-dom'

const Dashboard = () => {
    // Track desktop collapse and mobile drawer state independently.
    const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const toggleSidebar = () => {
        if (window.matchMedia('(min-width: 768px)').matches) {
            setDesktopSidebarOpen((isOpen) => !isOpen);
        } else {
            setMobileSidebarOpen((isOpen) => !isOpen);
        }
    };
    return (
        // Shared application shell: sidebar, top bar, and current nested route.
        <div className="flex h-dvh w-full overflow-hidden bg-[#080b08]">
            <Sidebar
                isOpen={desktopSidebarOpen}
                mobileOpen={mobileSidebarOpen}
                onMobileClose={() => setMobileSidebarOpen(false)}
            />

            <div className="flex min-w-0 flex-1 flex-col">
                <Topbar onHamburgerClick={toggleSidebar} />
                <Outlet />
            </div>
        </div>
    )
}

export default Dashboard
