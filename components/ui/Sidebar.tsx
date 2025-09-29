"use client";

import { Button } from '@/components/ui/button';
import { 
  ShoppingCart, 
  LayoutDashboard,
  Users,
  HelpCircle,
  Settings,
  LogOut,
  X,
  BarChart3,
  Package
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();

  // Check if we're on manager or admin analysis pages
  const isManagerOrAdminRoute = pathname?.startsWith('/manager') || pathname?.startsWith('/admin');

  // Base navigation items (always visible)
  const baseNavigationItems = [
    {
      href: '/cashier',
      icon: LayoutDashboard,
      label: 'DASHBOARD',
      isActive: pathname === '/cashier' || pathname === '/manager' || pathname === '/admin'
    }
  ];

  // Conditional navigation items (only for manager/admin routes)
  const conditionalNavigationItems = isManagerOrAdminRoute ? [
    {
      href: '/manager/analysis',
      icon: BarChart3,
      label: 'ANALYSIS',
      isActive: pathname === '/manager/analysis' || pathname === '/manager/Analysis' || pathname === '/admin/Analysis'
    },
    {
      href: '/manager/inventory',
      icon: Package,
      label: 'INVENTORY',
      isActive: pathname === '/manager/inventory' || pathname === '/admin/inventory'
    }
  ] : [];

  // Common navigation items (always visible)
  const commonNavigationItems = [
    {
      href: '/cashier/customers',
      icon: Users,
      label: 'CUSTOMERS',
      isActive: pathname === '/cashier/customers' || pathname === '/manager/customers' || pathname === '/admin/customers'
    },
    {
      href: '/cashier/help',
      icon: HelpCircle,
      label: 'HELP',
      isActive: pathname === '/cashier/help' || pathname === '/manager/help' || pathname === '/admin/help'
    }
  ];

  // Combine all navigation items
  const navigationItems = [...baseNavigationItems, ...conditionalNavigationItems, ...commonNavigationItems];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Fixed Sidebar */}
      <div className={`
        fixed top-0 left-0 z-50 w-72 h-screen bg-white shadow-xl 
        transform transition-transform duration-300 ease-in-out
        flex flex-col
        lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header - Fixed Height */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-slate-800">SwiftCart</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            className="lg:hidden"
            onClick={onToggle}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation - Scrollable Middle Section */}
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <Button 
                  variant={item.isActive ? "default" : "ghost"}
                  className={`w-full justify-start gap-3 ${
                    item.isActive 
                      ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                  onClick={() => {
                    // Close mobile sidebar on navigation
                    if (window.innerWidth < 1024) {
                      onToggle();
                    }
                  }}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Footer - Fixed at Bottom */}
        <div className="p-4 space-y-2 border-t flex-shrink-0">
          <Button variant="ghost" className="w-full justify-start gap-3 text-slate-600 hover:text-slate-800 hover:bg-slate-100">
            <Settings className="h-5 w-5" />
            SETTINGS
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 text-slate-600 hover:text-slate-800 hover:bg-slate-100">
            <LogOut className="h-5 w-5" />
            LOG OUT
          </Button>
        </div>
      </div>
    </>
  );
}