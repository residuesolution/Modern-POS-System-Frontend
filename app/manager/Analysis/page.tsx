"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DollarSign,
  TrendingUp,
  Package,
  AlertTriangle,
  Phone,
  MoreHorizontal
} from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import Sidebar from '@/components/ui/Sidebar';
import Header from '@/components/ui/Header';

const salesTrendsData = [
  { day: 'SUN', value: 18 },
  { day: 'MON', value: 22 },
  { day: 'TUE', value: 15 },
  { day: 'WED', value: 28 },
  { day: 'THU', value: 12 },
  { day: 'FRI', value: 35 },
  { day: 'SAT', value: 25 },
];

const comparisonData = [
  { day: 'SUN', vegetables: 12, meatSeafood: 8 },
  { day: 'MON', vegetables: 15, meatSeafood: 10 },
  { day: 'TUE', vegetables: 8, meatSeafood: 12 },
  { day: 'WED', vegetables: 18, meatSeafood: 14 },
  { day: 'THU', vegetables: 5, meatSeafood: 16 },
  { day: 'FRI', vegetables: 25, meatSeafood: 18 },
  { day: 'SAT', vegetables: 15, meatSeafood: 8 },
];

export default function AnalysisPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState('This week');
  const [categoryFilter, setCategoryFilter] = useState('Vegetables');
  const [topProductsFilter, setTopProductsFilter] = useState('This month');
  const [employeeFilter, setEmployeeFilter] = useState('This month');

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Fixed Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
      />

      {/* Main Content - Adjusted for fixed sidebar */}
      <div className="flex-1 flex flex-col lg:ml-72">
        {/* Header */}
        <Header 
          onMenuToggle={() => setIsSidebarOpen(true)}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-blue-400 to-blue-500 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="h-8 w-8 opacity-80" />
                  <Select value="This month">
                    <SelectTrigger className="w-24 h-6 text-xs bg-white/20 border-white/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="This month">This month</SelectItem>
                      <SelectItem value="Last month">Last month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-sm opacity-80">Total Revenue</p>
                <p className="text-2xl font-bold">Rs.75,217,886</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-3 w-3" />
                  <span className="text-xs">+ 10%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-cyan-400 to-cyan-500 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-8 w-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <Select value="Today">
                    <SelectTrigger className="w-16 h-6 text-xs bg-white/20 border-white/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Today">Today</SelectItem>
                      <SelectItem value="Yesterday">Yesterday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-sm opacity-80">Daily Sales</p>
                <p className="text-2xl font-bold">Rs.24,060,099</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-3 w-3" />
                  <span className="text-xs">+ 10%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Package className="h-8 w-8 text-blue-500" />
                  <Select value="Today">
                    <SelectTrigger className="w-16 h-6 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Today">Today</SelectItem>
                      <SelectItem value="Yesterday">Yesterday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-sm text-gray-600">Orders Proceeded</p>
                <p className="text-2xl font-bold text-gray-900">1.1K</p>
                <div className="flex items-center gap-1 mt-2 text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  <span className="text-xs">+ 10%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <AlertTriangle className="h-8 w-8 text-orange-500" />
                  <div></div>
                </div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-gray-900">5 Items</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Column - Charts */}
            <div className="xl:col-span-2 space-y-6">
              {/* Products Sales Trends */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <CardTitle className="text-lg font-semibold">Products Sales Trends</CardTitle>
                    <div className="flex gap-2">
                      <Select value={timeFilter} onValueChange={setTimeFilter}>
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="This week">This week</SelectItem>
                          <SelectItem value="This month">This month</SelectItem>
                          <SelectItem value="This year">This year</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Vegetables">Vegetables</SelectItem>
                          <SelectItem value="Fruits">Fruits</SelectItem>
                          <SelectItem value="Dairy">Dairy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={salesTrendsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="day" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        domain={[0, 40]}
                        tickFormatter={(value: any) => `${value}%`}
                      />
                      <Tooltip 
                        formatter={(value: any) => [`${value}%`, 'Sales']}
                        labelStyle={{ color: '#374151' }}
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb', 
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Bar 
                        dataKey="value" 
                        fill="#3b82f6" 
                        radius={[4, 4, 0, 0]}
                        maxBarSize={60}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Product Comparison */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <CardTitle className="text-lg font-semibold">Product Comparison</CardTitle>
                    <div className="flex gap-2">
                      <Select value="Vegetables">
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Vegetables">Vegetables</SelectItem>
                          <SelectItem value="Fruits">Fruits</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value="Meat & Seafood">
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Meat & Seafood">Meat & Seafood</SelectItem>
                          <SelectItem value="Dairy">Dairy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span>Selling Rate</span>
                      </div>
                      <div className="text-blue-600 font-semibold">16% Vegetables</div>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="day" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        domain={[0, 30]}
                        tickFormatter={(value: any) => `${value}%`}
                      />
                      <Tooltip 
                        formatter={(value: any, name: string) => [`${value}%`, name === 'vegetables' ? 'Vegetables' : 'Meat & Seafood']}
                        labelStyle={{ color: '#374151' }}
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb', 
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="vegetables" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="meatSeafood" 
                        stroke="#94a3b8" 
                        strokeWidth={2}
                        dot={{ fill: '#94a3b8', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Top Products */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-gray-600" />
                      <CardTitle className="text-lg font-semibold">Top Products</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={topProductsFilter} onValueChange={setTopProductsFilter}>
                        <SelectTrigger className="w-28 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="This month">This month</SelectItem>
                          <SelectItem value="This week">This week</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-2xl">
                        🥛
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-blue-700">Fresh Milk (1L)</p>
                          <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">
                            In Stock
                          </Badge>
                        </div>
                        <p className="text-sm text-blue-600">Dairy</p>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-blue-600">Unit sold: <span className="font-medium">260 U</span></span>
                          <span className="text-blue-600">Revenue: <span className="font-medium">Rs. 37,865</span></span>
                        </div>
                      </div>
                      <div className="text-green-600 text-sm font-medium">+ 12%</div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center text-2xl">
                        🍞
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">Bread</p>
                          <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                            Low Stock
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">Bakery</p>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-gray-600">Unit sold: <span className="font-medium">100 U</span></span>
                          <span className="text-gray-600">Revenue: <span className="font-medium">Rs. 28,500</span></span>
                        </div>
                      </div>
                      <div className="text-green-600 text-sm font-medium">+ 8%</div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center text-2xl">
                        🧽
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">Dishwashing liquid</p>
                          <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100">
                            Critical
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">Household</p>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-gray-600">Unit sold: <span className="font-medium">130 U</span></span>
                          <span className="text-gray-600">Revenue: <span className="font-medium">Rs. 55,250</span></span>
                        </div>
                      </div>
                      <div className="text-red-600 text-sm font-medium">- 4.2%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Employees */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="text-xl">👥</div>
                      <CardTitle className="text-lg font-semibold">Employees</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                        <SelectTrigger className="w-28 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="This month">This month</SelectItem>
                          <SelectItem value="This week">This week</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src="https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg" />
                          <AvatarFallback>JA</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">James</p>
                          <p className="text-sm text-gray-600">Counter 1</p>
                          <p className="text-xs text-gray-500">Working hours: 9h 30m</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                          Active
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Phone className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src="https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg" />
                          <AvatarFallback>RA</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-blue-700">Ravi</p>
                          <p className="text-sm text-blue-600">Inventory</p>
                          <p className="text-xs text-blue-500">Working hours: 4h 15m</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                          Break
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Phone className="h-4 w-4 text-blue-600" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src="https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg" />
                          <AvatarFallback>AL</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">Alice</p>
                          <p className="text-sm text-gray-600">Counter 2</p>
                          <p className="text-xs text-gray-500">Working hours: 7h 20m</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                          Off Duty
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Phone className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}