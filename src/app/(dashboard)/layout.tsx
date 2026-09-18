'use client';

import { UserButton, OrganizationSwitcher } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Contact, Building, Menu, X } from "lucide-react";
import HeaderActions from "./components/HeaderActions";
import { useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigation = [
    { name: "Pipeline", href: "/dashboard", icon: LayoutDashboard },
    { name: "Leads", href: "/dashboard/leads", icon: Users },
    { name: "Contacts", href: "/dashboard/contacts", icon: Contact },
    { name: "Accounts", href: "/dashboard/accounts", icon: Building },
  ];

  return (
    <div className="flex h-screen bg-[#D9D9D9] overflow-hidden">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-brand-black border-r border-gray-800 flex flex-col transition-transform duration-300 md:static md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-gray-800 font-bold text-lg text-white">
          Journey Office Builders
          <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-brand-black border-b border-gray-800 h-16 shrink-0 flex items-center px-4 md:px-8 shadow-sm">
          <button 
            className="md:hidden mr-4 text-gray-400 hover:text-white"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-semibold text-white truncate">Dashboard</h1>
          <div className="ml-auto">
            <HeaderActions />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
