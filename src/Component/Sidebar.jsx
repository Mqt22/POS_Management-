import { useState } from 'react';
import { MdDashboard, MdInventory2, MdPointOfSale } from "react-icons/md";
import { BiSolidPurchaseTag } from "react-icons/bi";
import { FiUsers } from "react-icons/fi";
import { IoPieChartSharp } from "react-icons/io5";
import { IoMdArrowDropdown, IoMdArrowDropup } from "react-icons/io";
import { GrUserAdmin } from "react-icons/gr";
import { Link, useLocation } from "react-router-dom";
import mirzaTradersLogo from "../assets/logo.jpeg";

const Sidebar = ({ isOpen = true, mobileOpen = false, onMobileClose }) => {
  const { pathname } = useLocation();
  const NavItems = [
    { 
      name: 'Dashboard', 
      path: '/', 
      icon: MdDashboard },
    {
      name: 'Sales',
      icon: MdPointOfSale,
      children: [
        { name: 'Sales & Billing', path: '/sales/billing' },
        { name: 'Quick Sale (Walk-in Customer)', path: '/sales/quick-sale' },
      ],
    },
    {
      name: 'Purchases',
      icon: BiSolidPurchaseTag,
      children: [
        { name: 'Purchase Orders', path: '/purchases/orders' },
        { name: 'Purchase History', path: '/purchases/history' },
      ],
    },
    {
      name: 'Inventory',
      path: '/inventory',
      icon: MdInventory2,
    },
    {
      name: 'Customers',
      path: '/customers',
      icon: FiUsers,
    },
    {
      name: 'Reports',
      path: '/reports',
      icon: IoPieChartSharp,
    },
  ];

  const FooterNavItem = {
    name: 'Administration',
    icon: GrUserAdmin,
    children: [
      { name: 'Users & Roles', path: '/admin/users-roles' },
      { name: 'Activity Logs', path: '/admin/activity-logs' },
      { name: 'Settings', path: '/admin/settings' },
    ],
  };

  const [openItems, setOpenItems] = useState([]);

  const toggleItem = (name) => {
    setOpenItems((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]
    );
  };

  const isPathActive = (path) =>
    pathname === path || pathname.startsWith(`${path}/`);

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onMobileClose}
          aria-label="Close sidebar"
        />
      )}
      <aside className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-[min(280px,85vw)] shrink-0 flex-col items-start overflow-y-auto border-r border-[#2f4a2b] bg-[#0d120d] p-4 transition-[width,transform] duration-300 md:static md:z-auto md:translate-x-0 md:p-5 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      } ${
        isOpen ? 'md:w-[250px] lg:w-[280px]' : 'md:w-[76px]'
      }`}>
        <div className={`my-2 flex w-full min-w-0 flex-row items-center gap-3 ${isOpen ? '' : 'md:justify-center'}`}>
          <img
            src={mirzaTradersLogo}
            alt="Mirza Traders logo"
            className={`shrink-0 rounded-xl border border-white/15 object-cover shadow-md transition-all duration-300 ${
              isOpen ? 'size-14 md:size-16' : 'size-12 md:size-10'
            }`}
          />
          <div className={`${isOpen ? 'md:flex' : 'md:hidden'} flex min-w-0 flex-col`}>
              <h1 className="truncate text-lg font-bold text-white lg:text-xl">Mirza Traders</h1>
              <h4 className="truncate text-xs font-semibold text-gray-400 lg:text-sm">
                Plywood &amp; Hardware
              </h4>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center w-full gap-4">
          <nav className="w-full">
            <ul className="flex flex-col gap-2 w-full">
              {NavItems.map((navItem, index) => {
                const isItemOpen = openItems.includes(navItem.name);
                const isNavItemActive = navItem.path
                  ? isPathActive(navItem.path)
                  : navItem.children?.some((child) => isPathActive(child.path));
                const isItemExpanded = isItemOpen || isNavItemActive;

                return (
                  <li key={index} className="w-full">
                    <div
                      onClick={navItem.children ? () => toggleItem(navItem.name) : undefined}
                      onKeyDown={navItem.children ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          toggleItem(navItem.name);
                        }
                      } : undefined}
                      role={navItem.children ? 'button' : undefined}
                      tabIndex={navItem.children ? 0 : undefined}
                      aria-expanded={navItem.children ? isItemExpanded : undefined}
                      className={`rounded p-2 transition-colors duration-150 ${
                        isNavItemActive
                          ? 'bg-[#4f9837] font-semibold text-white'
                          : 'text-gray-400 hover:bg-[#315f25] hover:text-white'
                      } ${navItem.children ? 'cursor-pointer' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 w-full">
                        {navItem.path ? (
                          <Link
                            to={navItem.path}
                            onClick={onMobileClose}
                            aria-current={isNavItemActive ? 'page' : undefined}
                            className="flex items-center gap-2 w-full"
                          >
                            {navItem.icon && <navItem.icon className="h-4 md:h-5 w-4 md:w-5" />}
                            <span className={`${isOpen ? 'md:inline' : 'md:hidden'} text-xs md:text-sm`}>{navItem.name}</span>
                          </Link>
                        ) : (
                          <div className="flex items-center gap-2 w-full">
                            {navItem.icon && <navItem.icon className="h-4 md:h-5 w-4 md:w-5" />}
                            <span className={`${isOpen ? 'md:inline' : 'md:hidden'} text-xs md:text-sm`}>{navItem.name}</span>
                          </div>
                        )}

                        {navItem.children && (
                          <span
                            className={`${isOpen ? 'md:block' : 'md:hidden'} text-gray-400 hover:text-white transition-colors duration-150`}
                            aria-hidden="true"
                          >
                            {isItemExpanded ? (
                              <IoMdArrowDropup className="h-4 md:h-5 w-4 md:w-5" />
                            ) : (
                              <IoMdArrowDropdown className="h-4 md:h-5 w-4 md:w-5" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                    {navItem.children && (
                      <ul
                        className={`mt-2 ml-4 flex flex-col gap-2 overflow-hidden transition-all duration-300 ${
                          isItemExpanded ? `${isOpen ? 'md:max-h-80 md:opacity-100' : 'md:max-h-0 md:opacity-0'} max-h-80 opacity-100` : 'max-h-0 opacity-0'
                        }`}
                      >
                        {navItem.children.map((child, childIndex) => (
                          <li key={childIndex}>
                            <Link
                              to={child.path}
                              onClick={onMobileClose}
                              aria-current={isPathActive(child.path) ? 'page' : undefined}
                              className={`block rounded p-2 text-xs transition-colors duration-150 md:text-sm ${
                                isPathActive(child.path)
                                  ? 'bg-[#315f25] font-semibold text-white'
                                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
                              }`}
                            >
                              {child.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="w-full border-t border-white/10 pt-4">
          <div
            onClick={() => toggleItem(FooterNavItem.name)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleItem(FooterNavItem.name);
              }
            }}
            role="button"
            tabIndex={0}
            aria-expanded={openItems.includes(FooterNavItem.name)}
            className={`cursor-pointer rounded p-2 transition-colors duration-150 ${
            FooterNavItem.children.some((child) => isPathActive(child.path))
              ? 'bg-[#4f9837] font-semibold text-white'
              : 'text-gray-400 hover:bg-[#315f25] hover:text-white'
          }`}>
            <div className="flex items-center justify-between gap-2 w-full">
              <div className="flex items-center gap-2 w-full">
                <GrUserAdmin className="h-4 md:h-5 w-4 md:w-5" />
                <span className={`${isOpen ? 'md:inline' : 'md:hidden'} text-xs md:text-sm`}>Administration</span>
              </div>
              <span className={isOpen ? 'md:inline' : 'md:hidden'}>
                <span
                  className="text-gray-400 hover:text-white transition-colors duration-150"
                  aria-hidden="true"
                >
                  {openItems.includes(FooterNavItem.name) ? (
                    <IoMdArrowDropup className="h-4 md:h-5 w-4 md:w-5" />
                  ) : (
                    <IoMdArrowDropdown className="h-4 md:h-5 w-4 md:w-5" />
                  )}
                </span>
              </span>
            </div>
          </div>
          <ul
            className={`mt-2 ml-4 flex flex-col gap-2 overflow-hidden transition-all duration-300 ${
              openItems.includes(FooterNavItem.name) ? `${isOpen ? 'md:max-h-80 md:opacity-100' : 'md:max-h-0 md:opacity-0'} max-h-80 opacity-100` : 'max-h-0 opacity-0'
            }`}
          >
            {FooterNavItem.children.map((child, childIndex) => (
              <li key={childIndex}>
                <Link
                  to={child.path}
                  onClick={onMobileClose}
                  aria-current={isPathActive(child.path) ? 'page' : undefined}
                  className={`block rounded p-2 text-xs transition-colors duration-150 md:text-sm ${
                    isPathActive(child.path)
                      ? 'bg-[#315f25] font-semibold text-white'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {child.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
