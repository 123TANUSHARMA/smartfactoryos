"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  Wrench,
  Truck,
  Users,
  ShoppingCart,
  DollarSign,
  UserCheck,
  LogOut,
  Menu,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Raw Materials", href: "/raw-materials", icon: Package },
  { name: "Machinery", href: "/machinery", icon: Wrench },
  { name: "Trucks", href: "/trucks", icon: Truck },
  { name: "B2B Sales", href: "/b2b-sales", icon: Users },
  { name: "B2C Sales", href: "/b2c-sales", icon: ShoppingCart },
  { name: "Finances", href: "/finances", icon: DollarSign },
  { name: "Partners", href: "/partners", icon: UserCheck },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const { signOut } = useAuth()

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar */}
      <div className={cn("fixed inset-0 z-50 lg:hidden", sidebarOpen ? "block" : "hidden")}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-bold text-gray-900">Detergent MFG</h1>
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
              <X className="h-6 w-6" />
            </Button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                  pathname === item.href
                    ? "bg-blue-100 text-blue-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="mr-3 h-6 w-6" />
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="p-4">
            <Button onClick={signOut} variant="outline" className="w-full bg-transparent">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex items-center h-16 px-4 bg-blue-600">
            <h1 className="text-xl font-bold text-white">Detergent MFG</h1>
          </div>
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                  pathname === item.href
                    ? "bg-blue-100 text-blue-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                )}
              >
                <item.icon className="mr-3 h-6 w-6" />
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="p-4">
            <Button onClick={signOut} variant="outline" className="w-full bg-transparent">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        <div className="lg:hidden flex items-center h-16 px-4 bg-white border-b border-gray-200">
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="ml-4 text-xl font-bold text-gray-900">Detergent MFG</h1>
        </div>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
