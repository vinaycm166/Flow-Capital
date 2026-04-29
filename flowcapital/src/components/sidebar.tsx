"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, UploadCloud, PieChart, Settings, FileText, Activity, Building2, Network, ShieldAlert, BadgeCheck, CreditCard } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

export function Sidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("flowcapital_user");
    if (userData) {
      try {
         setRole(JSON.parse(userData).role);
      } catch {}
    }
  }, []);

  const isInvestor = pathname?.includes("investor") || role === "INVESTOR";
  const isEnterprise = pathname?.includes("enterprise") || role === "ENTERPRISE";
  const isAdmin = pathname?.includes("admin") || role === "ADMIN";
  
  const smeLinks = [
    { name: "Dashboard", href: "/dashboard/sme", icon: LayoutDashboard },
    { name: "Upload Invoice", href: "/dashboard/sme/upload", icon: UploadCloud },
    { name: "Transactions", href: "/dashboard/sme/transactions", icon: FileText },
    { name: "Analytics", href: "/dashboard/sme/analytics", icon: PieChart },
  ];

  const investorLinks = [
    { name: "Portfolio", href: "/dashboard/investor", icon: LayoutDashboard },
    { name: "Live Marketplace", href: "/dashboard/investor/marketplace", icon: Activity },
    { name: "Analytics", href: "/dashboard/investor/analytics", icon: PieChart },
  ];

  const enterpriseLinks = [
    { name: "Global Overview", href: "/dashboard/enterprise", icon: Building2 },
    { name: "Analytics", href: "/dashboard/enterprise/analytics", icon: PieChart },
  ];

  const adminLinks = [
    { name: "Admin Console", href: "/dashboard/admin", icon: ShieldAlert },
    { name: "Invoice Queue", href: "/dashboard/admin/invoices", icon: BadgeCheck },
    { name: "Payment Proofs", href: "/dashboard/admin/payments", icon: CreditCard },
  ];

  const links = isAdmin ? adminLinks : isEnterprise ? enterpriseLinks : isInvestor ? investorLinks : smeLinks;

  return (
    <aside className="w-64 border-r border-border/40 bg-background/95 backdrop-blur h-screen sticky top-0 flex flex-col z-40 hidden md:flex">
      <div className="h-16 flex items-center px-6 border-b border-border/40 shrink-0">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-600 to-teal-400 flex items-center justify-center">
            <span className="text-white font-bold text-sm">F</span>
          </div>
          <span className="font-bold text-lg tracking-tight">FlowCapital</span>
        </Link>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <div className="mb-4 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {isAdmin ? "Admin Mode" : isEnterprise ? "Enterprise Mode" : isInvestor ? "Investor Mode" : "SME Mode"}
        </div>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                isActive 
                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium" 
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {link.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/40 space-y-2 shrink-0">
        <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <div className="flex items-center justify-between px-3 pt-2">
          <span className="text-sm text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
