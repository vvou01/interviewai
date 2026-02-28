import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard, FileText, Plus, History,
  Settings, CreditCard, ChevronLeft, ChevronRight,
  Zap, LogOut, User, Shield
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const HARD_CODED_ADMINS = ["deschepper.wj@gmail.com", "vvouter1@gmail.com"];

const baseNavItems = [
  { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
  { name: "New Session", icon: Plus, page: "NewSession", accent: true },
  { name: "CV Profiles", icon: FileText, page: "CVProfiles" },
  { name: "History", icon: History, page: "History" },
  { name: "Billing", icon: CreditCard, page: "Billing" },
  { name: "Settings", icon: Settings, page: "Settings" },
];

export default function Sidebar({ currentPage, user }) {
  const [collapsed, setCollapsed] = useState(false);
  const isAdmin = user?.role === "admin" || HARD_CODED_ADMINS.includes(user?.email || "");
  const navItems = isAdmin
    ? [...baseNavItems, { name: "Admin", icon: Shield, page: "Admin" }]
    : baseNavItems;

  return (
    <aside className={`fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300 ${collapsed ? "w-[72px]" : "w-[240px]"} bg-white border-r border-slate-200`}>
      {/* Logo */}
      <Link to={createPageUrl("Dashboard")} className="flex items-center gap-3 px-5 h-16 border-b border-slate-100 hover:bg-slate-50 transition-colors">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="font-bold text-lg tracking-tight text-slate-800">
            Interview<span className="text-violet-600">AI</span>
          </span>
        )}
      </Link>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = currentPage === item.page;
          return (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-violet-50 text-violet-700"
                  : item.accent
                  ? "text-violet-600 hover:bg-violet-50"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-violet-600" : item.accent ? "text-violet-500" : "text-slate-400"}`} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-slate-100">
        <div className={`flex items-center gap-3 px-3 py-2 rounded-xl ${collapsed ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded-full bg-violet-100 border border-violet-200 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-violet-500" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">{user?.full_name || "User"}</p>
              <p className="text-xs text-slate-400 truncate capitalize">{user?.plan || "free"} plan</p>
            </div>
          )}
        </div>
        <button
          onClick={() => base44.auth.logout()}
          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all w-full mt-1 ${collapsed ? "justify-center" : ""}`}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}
