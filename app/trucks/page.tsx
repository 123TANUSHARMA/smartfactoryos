"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Search, Truck, Fuel, User } from "lucide-react"
import { supabase } from "@/lib/supabase"
import DashboardLayout from "@/components/dashboard-layout"
import { AuthProvider } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import ProtectedRoute from "@/components/protected-route"

interface TruckData {
  id: string
  truck_number: string
  capacity: number
  driver_name: string
}

interface TruckExpense {
  id: string
  truck_number: string
  expense_date: string
  expense_type: string
  amount: number
  description: string
}

function TrucksContent() {
  const [trucks, setTrucks] = useState<TruckData[]>([])
  const [expenses, setExpenses] = useState<TruckExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"overview" | "expenses">("overview")
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    truck_id: "",
    expense_type: "diesel",
    amount: "",
    description: "",
    expense_date: new Date().toISOString().split("T")[0],
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch trucks
      const { data: trucksData } = await supabase.from("trucks").select("*").order("truck_number")

      // Fetch truck expenses with truck info
      const { data: expensesData } = await supabase
        .from("truck_expenses")
        .select(`
          *,
          trucks(truck_number)
        `)
        .order("expense_date", { ascending: false })

      setTrucks(trucksData || [])

      // Transform expenses data
      const transformedExpenses =
        expensesData?.map((expense) => ({
          id: expense.id,
          truck_number: expense.trucks?.truck_number || "",
          expense_date: expense.expense_date,
          expense_type: expense.expense_type,
          amount: expense.amount,
          description: expense.description,
        })) || []

      setExpenses(transformedExpenses)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const { error } = await supabase.from("truck_expenses").insert({
        truck_id: formData.truck_id,
        expense_date: formData.expense_date,
        expense_type: formData.expense_type,
        amount: Number.parseFloat(formData.amount),
        description: formData.description,
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Truck expense recorded successfully",
      })

      setIsAddDialogOpen(false)
      setFormData({
        truck_id: "",
        expense_type: "diesel",
        amount: "",
        description: "",
        expense_date: new Date().toISOString().split("T")[0],
      })
      fetchData()
    } catch (error) {
      console.error("Error adding expense:", error)
      toast({
        title: "Error",
        description: "Failed to record expense",
        variant: "destructive",
      })
    }
  }

  const filteredExpenses = expenses.filter(
    (expense) =>
      expense.truck_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Calculate statistics
  const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
  const thisMonthExpenses = expenses
    .filter((expense) => {
      const expenseDate = new Date(expense.expense_date)
      const now = new Date()
      return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear()
    })
    .reduce((sum, expense) => sum + Number(expense.amount), 0)

  const dieselExpenses = expenses
    .filter((expense) => expense.expense_type === "diesel")
    .reduce((sum, expense) => sum + Number(expense.amount), 0)

  const salaryExpenses = expenses
    .filter((expense) => expense.expense_type === "salary")
    .reduce((sum, expense) => sum + Number(expense.amount), 0)

  const repairExpenses = expenses
    .filter((expense) => expense.expense_type === "repair")
    .reduce((sum, expense) => sum + Number(expense.amount), 0)

  // Truck statistics
  const truckStats = trucks.map((truck) => {
    const truckExpenses = expenses.filter((expense) => expense.truck_number === truck.truck_number)
    const totalCost = truckExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
    const lastExpense = truckExpenses[0]?.expense_date || "Never"

    return {
      ...truck,
      totalCost,
      lastExpense,
      expenseCount: truckExpenses.length,
    }
  })

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fleet Management</h1>
          <p className="text-gray-600">Track truck operations, expenses, and maintenance</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record Truck Expense</DialogTitle>
              <DialogDescription>Add a new truck-related expense</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="truck">Truck</Label>
                <Select
                  value={formData.truck_id}
                  onValueChange={(value) => setFormData({ ...formData, truck_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select truck" />
                  </SelectTrigger>
                  <SelectContent>
                    {trucks.map((truck) => (
                      <SelectItem key={truck.id} value={truck.id}>
                        {truck.truck_number} - {truck.driver_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="expense_type">Expense Type</Label>
                <Select
                  value={formData.expense_type}
                  onValueChange={(value) => setFormData({ ...formData, expense_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diesel">Diesel</SelectItem>
                    <SelectItem value="salary">Driver Salary</SelectItem>
                    <SelectItem value="repair">Repair & Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="expense_date">Date</Label>
                  <Input
                    id="expense_date"
                    type="date"
                    value={formData.expense_date}
                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the expense..."
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Record Expense
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fleet Cost</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalExpenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time fleet expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{thisMonthExpenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Current month expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Diesel Costs</CardTitle>
            <Fuel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{dieselExpenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total fuel expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Driver Salaries</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{salaryExpenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total salary payments</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6">
        <Button variant={activeTab === "overview" ? "default" : "outline"} onClick={() => setActiveTab("overview")}>
          Fleet Overview
        </Button>
        <Button variant={activeTab === "expenses" ? "default" : "outline"} onClick={() => setActiveTab("expenses")}>
          Expense Records
        </Button>
      </div>

      {activeTab === "overview" && (
        <Card>
          <CardHeader>
            <CardTitle>Fleet Overview</CardTitle>
            <CardDescription>Status and expense summary for each truck</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {truckStats.map((truck) => (
                <Card key={truck.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{truck.truck_number}</CardTitle>
                    <CardDescription>Driver: {truck.driver_name}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Capacity:</span>
                        <span className="font-medium">{truck.capacity.toLocaleString()} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Expenses:</span>
                        <span className="font-medium">₹{truck.totalCost.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Expense Records:</span>
                        <span className="font-medium">{truck.expenseCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Last Expense:</span>
                        <span className="font-medium">
                          {truck.lastExpense === "Never" ? "Never" : new Date(truck.lastExpense).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "expenses" && (
        <Card>
          <CardHeader>
            <CardTitle>Expense Records</CardTitle>
            <CardDescription>Complete history of truck-related expenses</CardDescription>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by truck or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Truck</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{new Date(expense.expense_date).toLocaleDateString()}</TableCell>
                    <TableCell>{expense.truck_number}</TableCell>
                    <TableCell className="capitalize">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          expense.expense_type === "diesel"
                            ? "bg-blue-100 text-blue-800"
                            : expense.expense_type === "salary"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {expense.expense_type}
                      </span>
                    </TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell>₹{Number(expense.amount).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function Trucks() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <DashboardLayout>
          <TrucksContent />
        </DashboardLayout>
      </ProtectedRoute>
    </AuthProvider>
  )
}
