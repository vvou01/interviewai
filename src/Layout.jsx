import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import Sidebar from "./components/layout/Sidebar";
import MobileNav from "./components/layout/MobileNav";

const publicPages = ["Landing"];

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (publicPages.includes(currentPageName)) {
        setLoading(false);
        return;
      }
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        base44.auth.redirectToLogin(window.location.href);
        return;
      }
      const me = await base44.auth.me();
      setUser(me);
      setLoading(false);
    };
    loadUser();
  }, [currentPageName]);

  // Public pages - no layout
  if (publicPages.includes(currentPageName)) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center animate-pulse">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <Sidebar currentPage={currentPageName} user={user} />
      <MobileNav currentPage={currentPageName} />
      <main className="lg:ml-[240px] pt-14 lg:pt-0 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8">
          {React.cloneElement(children, { user })}
        </div>
      </main>
    </div>
  );
}