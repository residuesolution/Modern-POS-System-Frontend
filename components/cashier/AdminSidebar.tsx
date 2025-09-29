"use client";

import { useState, ReactNode } from 'react';
import Sidebar from '@/components/ui/Sidebar';
import Header from '@/components/ui/Header';

interface AdminSidebarProps {
  children: ReactNode;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
}

export default function AdminSidebar({ 
  children, 
  searchTerm = '', 
  onSearchChange 
}: AdminSidebarProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        <Header 
          onMenuToggle={() => setIsSidebarOpen(true)}
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
        />
        
        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}