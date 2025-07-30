"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Package, Truck, Users, TrendingUp, TrendingDown } from "lucide-react"
import { supabase } from "@/lib/supabase"
import DashboardLayout from "@/components/dashboard-layout"
import { AuthProvider } from "@/contexts/auth-context"
import ProtectedRoute from "@/components/protected-route"

interface DashboardStats {
  totalRevenue: number
  totalExpenses: number
  profit: number
  pendingPayments: number
  todaysSales: number
  trucksActive: number
}

function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalExpenses: 0,
    profit: 0,
    pendingPayments: 0,
    todaysSales: 0,
    trucksActive: 5,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      // Get today's date
      const today = new Date().toISOString().split("T")[0]

      // Fetch B2B sales
      const { data: b2bSales } = await supabase
        .from("b2b_sales")
        .select("total_amount, amount_paid, remaining_amount, sale_date")

      // Fetch B2C sales
      const { data: b2cSales } = await supabase.from("b2c_sales").select("total_amount, sale_date")

      // Fetch raw material purchases
      const { data: purchases } = await supabase.from("raw_material_purchases").select("total_amount, remaining_amount")

      // Fetch truck expenses
      const { data: truckExpenses } = await supabase.from("truck_expenses").select("amount")

      // Fetch machine maintenance
      const { data: maintenance } = await supabase.from("machine_maintenance").select("cost")

      // Calculate stats
      const b2bRevenue = b2bSales?.reduce((sum, sale) => sum + Number(sale.amount_paid), 0) || 0
      const b2cRevenue = b2cSales?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0
      const totalRevenue = b2bRevenue + b2cRevenue

      const purchaseExpenses = purchases?.reduce((sum, purchase) => sum + Number(purchase.total_amount), 0) || 0
      const truckCosts = truckExpenses?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0
      const maintenanceCosts = maintenance?.reduce((sum, maint) => sum + Number(maint.cost), 0) || 0
      const totalExpenses = purchaseExpenses + truckCosts + maintenanceCosts

      const pendingPayments = b2bSales?.reduce((sum, sale) => sum + Number(sale.remaining_amount), 0) || 0

      const todaysSales = [
        ...(b2bSales?.filter((sale) => sale.sale_date === today) || []),
        ...(b2cSales?.filter((sale) => sale.sale_date === today) || []),
      ].reduce((sum, sale) => sum + Number(sale.total_amount || sale.amount_paid), 0)

      setStats({
        totalRevenue,
        totalExpenses,
        profit: totalRevenue - totalExpenses,
        pendingPayments,
        todaysSales,
        trucksActive: 5,
      })
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your detergent manufacturing business</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              All time earnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalExpenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Raw materials + Operations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
              ₹{stats.profit.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Revenue - Expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">₹{stats.pendingPayments.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Outstanding from B2B parties</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.todaysSales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">B2B + B2C sales today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Trucks</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.trucksActive}</div>
            <p className="text-xs text-muted-foreground">Fleet operational status</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common daily tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <button className="w-full text-left p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
              <div className="font-medium">Record Raw Material Purchase</div>
              <div className="text-sm text-gray-600">Add today's material procurement</div>
            </button>
            <button className="w-full text-left p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors">
              <div className="font-medium">Add B2B Sale</div>
              <div className="text-sm text-gray-600">Record distributor/retailer order</div>
            </button>
            <button className="w-full text-left p-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors">
              <div className="font-medium">Log Truck Expense</div>
              <div className="text-sm text-gray-600">Diesel, salary, or repair costs</div>
            </button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest business transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="text-sm font-medium">B2C Sale - ₹450</div>
                  <div className="text-xs text-gray-500">2 hours ago</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="text-sm font-medium">Raw Material Purchase - ₹12,000</div>
                  <div className="text-xs text-gray-500">5 hours ago</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="text-sm font-medium">Truck Diesel - ₹3,200</div>
                  <div className="text-xs text-gray-500">1 day ago</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function Dashboard() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <DashboardLayout>
          <DashboardContent />
        </DashboardLayout>
      </ProtectedRoute>
    </AuthProvider>
  )
}
