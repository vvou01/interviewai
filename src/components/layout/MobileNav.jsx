import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard,
  FileText,
  Plus,
  History,
  Settings,
  CreditCard,
  Menu,
  X,
  Zap,
  LogOut
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
  { name: "New Session", icon: Plus, page: "NewSession" },
  { name: "CV Profiles", icon: FileText, page: "CVProfiles" },
  { name: "History", icon: History, page: "History" },
  { name: "Billing", icon: CreditCard, page: "Billing" },
  { name: "Settings", icon: Settings, page: "Settings" },
];

export default function MobileNav({ currentPage }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#0d1220]/95 backdrop-blur-xl border-b border-white/[0.06] z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-base">
            Interview<span className="text-indigo-400">AI</span>
          </span>
        </div>
        <button onClick={() => setOpen(!open)} className="text-slate-300">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 bg-[#0a0e1a]/95 backdrop-blur-xl pt-14">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                  currentPage === item.page
                    ? "bg-indigo-500/10 text-indigo-400"
                    : "text-slate-400"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            ))}
            <button
              onClick={() => base44.auth.logout()}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 w-full"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </nav>
        </div>
      )}
    </>
  );
}