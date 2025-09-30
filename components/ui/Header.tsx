"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  ScanLine, 
  FileText, 
  ChevronDown,
  Menu,
  Bell
} from 'lucide-react';

interface HeaderProps {
  onMenuToggle: () => void;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
}

export default function Header({ onMenuToggle, searchTerm = '', onSearchChange }: HeaderProps) {
  return (
    <header className="bg-white border-b px-4 lg:px-6 h-20 flex items-center">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-4 flex-1">
          <Button 
            variant="ghost" 
            size="icon"
            className="lg:hidden"
            onClick={onMenuToggle}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search here for product, order......"
              className="pl-10 bg-slate-100 border-0"
              value={searchTerm}
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button className="bg-blue-500 hover:bg-blue-600 gap-2">
            <ScanLine className="h-4 w-4" />
            <span className="hidden sm:inline">Scan Barcode</span>
          </Button>
          <Button variant="outline" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Create bill</span>
          </Button>
          
          {/* Notification Bell */}
          <div className="relative">
            <Button 
              variant="ghost" 
              size="icon"
              className="relative hover:bg-slate-100"
            >
              <Bell className="h-5 w-5 text-slate-600" />
              {/* Notification Badge */}
              <Badge 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 hover:bg-red-500 text-white text-xs"
              >
                3
              </Badge>
            </Button>
          </div>
          
          <div className="flex items-center gap-2 ml-2">
            <div className="w-8 h-8 rounded-full bg-slate-300 overflow-hidden">
              <img 
                src="https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=50" 
                alt="James" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium">James</p>
              <p className="text-xs text-slate-500">Counter 1</p>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </div>
        </div>
      </div>
    </header>
  );
}