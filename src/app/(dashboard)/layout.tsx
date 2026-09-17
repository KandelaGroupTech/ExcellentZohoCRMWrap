'use client';

import { UserButton, OrganizationSwitcher } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Contact, Building } from "lucide-react";
import HeaderActions from "./components/HeaderActions";

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
  ];

  return (
    <div className="flex h-screen bg-brand-snow">
      {/* Sidebar */}
      <div className="w-64 bg-brand-black border-r border-gray-800 flex flex-col">
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
            hidePersonal={false}
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
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-brand-black border-b border-gray-800 h-16 flex items-center px-8 shadow-sm">
          <h1 className="text-xl font-semibold text-white">Dashboard</h1>
          <HeaderActions />
        </header>
        <main className="flex-1 overflow-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
