"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DollarSign, TrendingUp, TrendingDown, Calendar } from "lucide-react"
import { supabase } from "@/lib/supabase"
import DashboardLayout from "@/components/dashboard-layout"
import { AuthProvider } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import ProtectedRoute from "@/components/protected-route"

interface FinancialData {
  totalRevenue: number
  totalExpenses: number
  profit: number
  b2bRevenue: number
  b2cRevenue: number
  rawMaterialExpenses: number
  truckExpenses: number
  maintenanceExpenses: number
  pendingReceivables: number
}

interface MonthlyData {
  month: string
  revenue: number
  expenses: number
  profit: number
}

interface ExpenseBreakdown {
  category: string
  amount: number
  percentage: number
}

function FinancesContent() {
  const [financialData, setFinancialData] = useState<FinancialData>({
    totalRevenue: 0,
    totalExpenses: 0,
    profit: 0,
    b2bRevenue: 0,
    b2cRevenue: 0,
    rawMaterialExpenses: 0,
    truckExpenses: 0,
    maintenanceExpenses: 0,
    pendingReceivables: 0,
  })
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [expenseBreakdown, setExpenseBreakdown] = useState<ExpenseBreakdown[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState("all")
  const { toast } = useToast()

  useEffect(() => {
    fetchFinancialData()
  }, [selectedPeriod])

  const fetchFinancialData = async () => {
    try {
      // Calculate date range based on selected period
      let dateFilter = ""
      const now = new Date()

      if (selectedPeriod === "month") {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
        dateFilter = `and sale_date >= '${startOfMonth}'`
      } else if (selectedPeriod === "quarter") {
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
          .toISOString()
          .split("T")[0]
        dateFilter = `and sale_date >= '${quarterStart}'`
      } else if (selectedPeriod === "year") {
        const yearStart = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0]
        dateFilter = `and sale_date >= '${yearStart}'`
      }

      // Fetch B2B sales data
      const { data: b2bSales } = await supabase
        .from("b2b_sales")
        .select("total_amount, amount_paid, remaining_amount, sale_date")

      // Fetch B2C sales data
      const { data: b2cSales } = await supabase.from("b2c_sales").select("total_amount, sale_date")

      // Fetch raw material expenses
      const { data: rawMaterialPurchases } = await supabase
        .from("raw_material_purchases")
        .select("total_amount, purchase_date")

      // Fetch truck expenses
      const { data: truckExpenses } = await supabase.from("truck_expenses").select("amount, expense_date")

      // Fetch maintenance expenses
      const { data: maintenanceExpenses } = await supabase.from("machine_maintenance").select("cost, maintenance_date")

      // Calculate financial metrics
      const b2bRevenue = b2bSales?.reduce((sum, sale) => sum + Number(sale.amount_paid), 0) || 0
      const b2cRevenue = b2cSales?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0
      const totalRevenue = b2bRevenue + b2cRevenue

      const rawMaterialCosts =
        rawMaterialPurchases?.reduce((sum, purchase) => sum + Number(purchase.total_amount), 0) || 0
      const truckCosts = truckExpenses?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0
      const maintenanceCosts = maintenanceExpenses?.reduce((sum, expense) => sum + Number(expense.cost), 0) || 0
      const totalExpenses = rawMaterialCosts + truckCosts + maintenanceCosts

      const pendingReceivables = b2bSales?.reduce((sum, sale) => sum + Number(sale.remaining_amount), 0) || 0

      setFinancialData({
        totalRevenue,
        totalExpenses,
        profit: totalRevenue - totalExpenses,
        b2bRevenue,
        b2cRevenue,
        rawMaterialExpenses: rawMaterialCosts,
        truckExpenses: truckCosts,
        maintenanceExpenses: maintenanceCosts,
        pendingReceivables,
      })

      // Calculate expense breakdown
      const breakdown: ExpenseBreakdown[] = [
        {
          category: "Raw Materials",
          amount: rawMaterialCosts,
          percentage: totalExpenses > 0 ? (rawMaterialCosts / totalExpenses) * 100 : 0,
        },
        {
          category: "Fleet Operations",
          amount: truckCosts,
          percentage: totalExpenses > 0 ? (truckCosts / totalExpenses) * 100 : 0,
        },
        {
          category: "Maintenance",
          amount: maintenanceCosts,
          percentage: totalExpenses > 0 ? (maintenanceCosts / totalExpenses) * 100 : 0,
        },
      ]

      setExpenseBreakdown(breakdown)

      // Calculate monthly data for the last 6 months
      const monthlyStats: MonthlyData[] = []
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split("T")[0]
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split("T")[0]

        const monthB2BRevenue =
          b2bSales
            ?.filter((sale) => sale.sale_date >= monthStart && sale.sale_date <= monthEnd)
            .reduce((sum, sale) => sum + Number(sale.amount_paid), 0) || 0

        const monthB2CRevenue =
          b2cSales
            ?.filter((sale) => sale.sale_date >= monthStart && sale.sale_date <= monthEnd)
            .reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0

        const monthRawMaterialExpenses =
          rawMaterialPurchases
            ?.filter((purchase) => purchase.purchase_date >= monthStart && purchase.purchase_date <= monthEnd)
            .reduce((sum, purchase) => sum + Number(purchase.total_amount), 0) || 0

        const monthTruckExpenses =
          truckExpenses
            ?.filter((expense) => expense.expense_date >= monthStart && expense.expense_date <= monthEnd)
            .reduce((sum, expense) => sum + Number(expense.amount), 0) || 0

        const monthMaintenanceExpenses =
          maintenanceExpenses
            ?.filter((expense) => expense.maintenance_date >= monthStart && expense.maintenance_date <= monthEnd)
            .reduce((sum, expense) => sum + Number(expense.cost), 0) || 0

        const monthRevenue = monthB2BRevenue + monthB2CRevenue
        const monthExpenses = monthRawMaterialExpenses + monthTruckExpenses + monthMaintenanceExpenses

        monthlyStats.push({
          month: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
          revenue: monthRevenue,
          expenses: monthExpenses,
          profit: monthRevenue - monthExpenses,
        })
      }

      setMonthlyData(monthlyStats)
    } catch (error) {
      console.error("Error fetching financial data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch financial data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Overview</h1>
          <p className="text-gray-600">Track income, expenses, and profitability</p>
        </div>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{financialData.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">B2B + B2C sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">₹{financialData.totalExpenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All operational costs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${financialData.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
              ₹{financialData.profit.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {financialData.totalRevenue > 0
                ? `${((financialData.profit / financialData.totalRevenue) * 100).toFixed(1)}% margin`
                : "No revenue yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Receivables</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ₹{financialData.pendingReceivables.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Outstanding B2B payments</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
            <CardDescription>Revenue sources comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded">
                <div>
                  <div className="font-medium">B2B Sales</div>
                  <div className="text-sm text-gray-600">Business customers</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-600">₹{financialData.b2bRevenue.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">
                    {financialData.totalRevenue > 0
                      ? `${((financialData.b2bRevenue / financialData.totalRevenue) * 100).toFixed(1)}%`
                      : "0%"}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-green-50 rounded">
                <div>
                  <div className="font-medium">B2C Sales</div>
                  <div className="text-sm text-gray-600">Direct customers</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">₹{financialData.b2cRevenue.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">
                    {financialData.totalRevenue > 0
                      ? `${((financialData.b2cRevenue / financialData.totalRevenue) * 100).toFixed(1)}%`
                      : "0%"}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
            <CardDescription>Cost distribution by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expenseBreakdown.map((expense, index) => (
                <div key={expense.category} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{expense.category}</span>
                    <span className="text-sm text-gray-600">₹{expense.amount.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        index === 0 ? "bg-red-500" : index === 1 ? "bg-blue-500" : "bg-yellow-500"
                      }`}
                      style={{ width: `${expense.percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500">{expense.percentage.toFixed(1)}% of total expenses</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Monthly Trends</CardTitle>
          <CardDescription>Revenue, expenses, and profit over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Expenses</TableHead>
                <TableHead>Profit</TableHead>
                <TableHead>Margin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyData.map((month) => (
                <TableRow key={month.month}>
                  <TableCell className="font-medium">{month.month}</TableCell>
                  <TableCell className="text-green-600">₹{month.revenue.toLocaleString()}</TableCell>
                  <TableCell className="text-red-600">₹{month.expenses.toLocaleString()}</TableCell>
                  <TableCell className={month.profit >= 0 ? "text-green-600" : "text-red-600"}>
                    ₹{month.profit.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {month.revenue > 0 ? `${((month.profit / month.revenue) * 100).toFixed(1)}%` : "0%"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Financial Health Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cash Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Revenue Received:</span>
                <span className="font-medium text-green-600">₹{financialData.totalRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Expenses Paid:</span>
                <span className="font-medium text-red-600">₹{financialData.totalExpenses.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-medium">Net Cash Flow:</span>
                <span className={`font-bold ${financialData.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                  ₹{financialData.profit.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profitability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Gross Revenue:</span>
                <span className="font-medium">₹{financialData.totalRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Costs:</span>
                <span className="font-medium">₹{financialData.totalExpenses.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-medium">Profit Margin:</span>
                <span className="font-bold">
                  {financialData.totalRevenue > 0
                    ? `${((financialData.profit / financialData.totalRevenue) * 100).toFixed(1)}%`
                    : "0%"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total B2B Sales:</span>
                <span className="font-medium">
                  ₹{(financialData.b2bRevenue + financialData.pendingReceivables).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Amount Received:</span>
                <span className="font-medium text-green-600">₹{financialData.b2bRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-medium">Pending Collection:</span>
                <span className="font-bold text-orange-600">₹{financialData.pendingReceivables.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function Finances() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <DashboardLayout>
          <FinancesContent />
        </DashboardLayout>
      </ProtectedRoute>
    </AuthProvider>
  )
}
