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
  ChevronLeft,
  ChevronRight,
  Zap,
  LogOut,
  User
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
  { name: "New Session", icon: Plus, page: "NewSession", accent: true },
  { name: "CV Profiles", icon: FileText, page: "CVProfiles" },
  { name: "History", icon: History, page: "History" },
  { name: "Billing", icon: CreditCard, page: "Billing" },
  { name: "Settings", icon: Settings, page: "Settings" },
];

export default function Sidebar({ currentPage, user }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300 ${
        collapsed ? "w-[72px]" : "w-[240px]"
      } bg-[#0d1220] border-r border-white/[0.06]`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-white/[0.06]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="font-bold text-lg tracking-tight">
            Interview<span className="text-indigo-400">AI</span>
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = currentPage === item.page;
          return (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? "bg-indigo-500/10 text-indigo-400"
                  : item.accent
                  ? "text-indigo-300 hover:bg-indigo-500/10"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
              }`}
            >
              <item.icon
                className={`w-5 h-5 flex-shrink-0 ${
                  isActive ? "text-indigo-400" : item.accent ? "text-indigo-400" : ""
                }`}
              />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-white/[0.06]">
        <div className={`flex items-center gap-3 px-3 py-2 rounded-xl ${collapsed ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-indigo-300" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">
                {user?.full_name || "User"}
              </p>
              <p className="text-xs text-slate-500 truncate">{user?.plan || "free"} plan</p>
            </div>
          )}
        </div>
        <button
          onClick={() => base44.auth.logout()}
          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all w-full mt-1 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-[#1a2035] border border-white/[0.1] flex items-center justify-center text-slate-400 hover:text-white transition-colors"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}