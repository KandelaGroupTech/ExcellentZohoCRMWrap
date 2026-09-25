'use client';

import { UserButton, OrganizationSwitcher } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Contact, Building, Menu, X, Store } from "lucide-react";
import HeaderActions from "./components/HeaderActions";
import PullToRefresh from "./components/PullToRefresh";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const navigation = [
    { name: "Pipeline", href: "/dashboard", icon: LayoutDashboard },
    { name: "Leads", href: "/dashboard/leads", icon: Users },
    { name: "Contacts", href: "/dashboard/contacts", icon: Contact },
    { name: "Accounts", href: "/dashboard/accounts", icon: Building },
    { name: "Vendors", href: "/dashboard/vendors", icon: Store },
  ];

  return (
    <div className="flex h-[100dvh] bg-[#D9D9D9] overflow-hidden">
      {/* Sidebar for Desktop */}
      <div className="hidden md:flex inset-y-0 left-0 z-50 w-64 bg-brand-black border-r border-gray-800 flex-col">
        <div className="flex h-16 shrink-0 items-center px-6 border-b border-gray-800 font-bold text-lg text-white">
          Journey Office Builders
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${
                  isActive 
                    ? 'bg-brand-red text-white' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-800 flex items-center gap-3">
          <OrganizationSwitcher 
            hidePersonal={true}
            appearance={{
              elements: {
                organizationSwitcherTrigger: "text-white",
                organizationSwitcherTriggerIcon: "text-white"
              }
            }}
          />
        </div>
        <div className="p-4 border-t border-gray-800 flex items-center gap-3">
          <UserButton afterSignOutUrl="/" />
          <span className="text-sm font-medium text-gray-300">Account</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="bg-brand-black border-b border-gray-800 h-16 shrink-0 flex items-center px-4 md:px-8 shadow-sm">
          <div className="md:hidden flex items-center mr-3">
            <UserButton afterSignOutUrl="/" />
          </div>
          <h1 className="text-xl font-semibold text-white truncate">Dashboard</h1>
          <div className="ml-auto">
            <HeaderActions />
          </div>
        </header>

        {/* Content */}
        <PullToRefresh className="flex-1 p-4 md:p-8 pb-20 md:pb-8">
          {children}
        </PullToRefresh>

        {/* Bottom Navigation Bar for Mobile */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-brand-black border-t border-gray-800 z-40 flex items-center justify-around px-2 pb-safe">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                  isActive ? 'text-brand-red' : 'text-gray-400 hover:text-white'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium leading-none">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
