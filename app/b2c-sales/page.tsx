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
import { Plus, Search, ShoppingCart, TrendingUp, Calendar, Package } from "lucide-react"
import { supabase } from "@/lib/supabase"
import DashboardLayout from "@/components/dashboard-layout"
import { AuthProvider } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import ProtectedRoute from "@/components/protected-route"

interface Product {
  id: string
  name: string
  type: string
  unit_price: number
}

interface B2CSale {
  id: string
  product_name: string
  quantity: number
  unit_price: number
  total_amount: number
  sale_date: string
  customer_name: string
}

function B2CSalesContent() {
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<B2CSale[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    product_id: "",
    quantity: "",
    unit_price: "",
    customer_name: "",
    sale_date: new Date().toISOString().split("T")[0],
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch products
      const { data: productsData } = await supabase.from("products").select("*").order("name")

      // Fetch B2C sales with product info
      const { data: salesData } = await supabase
        .from("b2c_sales")
        .select(`
          *,
          products(name)
        `)
        .order("sale_date", { ascending: false })

      setProducts(productsData || [])

      // Transform sales data
      const transformedSales =
        salesData?.map((sale) => ({
          id: sale.id,
          product_name: sale.products?.name || "",
          quantity: sale.quantity,
          unit_price: sale.unit_price,
          total_amount: sale.total_amount,
          sale_date: sale.sale_date,
          customer_name: sale.customer_name || "Walk-in Customer",
        })) || []

      setSales(transformedSales)
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
      const quantity = Number.parseFloat(formData.quantity)
      const unitPrice = Number.parseFloat(formData.unit_price)
      const totalAmount = quantity * unitPrice

      const { error } = await supabase.from("b2c_sales").insert({
        product_id: formData.product_id,
        quantity,
        unit_price: unitPrice,
        total_amount: totalAmount,
        sale_date: formData.sale_date,
        customer_name: formData.customer_name || null,
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "B2C sale recorded successfully",
      })

      setIsAddDialogOpen(false)
      setFormData({
        product_id: "",
        quantity: "",
        unit_price: "",
        customer_name: "",
        sale_date: new Date().toISOString().split("T")[0],
      })
      fetchData()
    } catch (error) {
      console.error("Error adding sale:", error)
      toast({
        title: "Error",
        description: "Failed to record sale",
        variant: "destructive",
      })
    }
  }

  const filteredSales = sales.filter(
    (sale) =>
      sale.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customer_name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Calculate statistics
  const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total_amount), 0)
  const todaysSales = sales
    .filter((sale) => sale.sale_date === new Date().toISOString().split("T")[0])
    .reduce((sum, sale) => sum + Number(sale.total_amount), 0)

  const thisMonthSales = sales
    .filter((sale) => {
      const saleDate = new Date(sale.sale_date)
      const now = new Date()
      return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear()
    })
    .reduce((sum, sale) => sum + Number(sale.total_amount), 0)

  const totalQuantitySold = sales.reduce((sum, sale) => sum + Number(sale.quantity), 0)

  // Product-wise sales analysis
  const productSales = products.map((product) => {
    const productSalesData = sales.filter((sale) => sale.product_name === product.name)
    const totalSold = productSalesData.reduce((sum, sale) => sum + Number(sale.quantity), 0)
    const revenue = productSalesData.reduce((sum, sale) => sum + Number(sale.total_amount), 0)

    return {
      ...product,
      totalSold,
      revenue,
      salesCount: productSalesData.length,
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
          <h1 className="text-3xl font-bold text-gray-900">B2C Sales</h1>
          <p className="text-gray-600">Manage direct customer sales and retail transactions</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Sale
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record B2C Sale</DialogTitle>
              <DialogDescription>Add a new retail sale transaction</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="product">Product</Label>
                <Select
                  value={formData.product_id}
                  onValueChange={(value) => {
                    const selectedProduct = products.find((p) => p.id === value)
                    setFormData({
                      ...formData,
                      product_id: value,
                      unit_price: selectedProduct?.unit_price.toString() || "",
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - ₹{product.unit_price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="unit_price">Unit Price (₹)</Label>
                  <Input
                    id="unit_price"
                    type="number"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="customer_name">Customer Name (Optional)</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  placeholder="Enter customer name or leave blank for walk-in"
                />
              </div>
              <div>
                <Label htmlFor="sale_date">Sale Date</Label>
                <Input
                  id="sale_date"
                  type="date"
                  value={formData.sale_date}
                  onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
                  required
                />
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="flex justify-between text-sm">
                  <span>Total Amount:</span>
                  <span className="font-medium">
                    ₹
                    {(
                      (Number.parseFloat(formData.quantity) || 0) * (Number.parseFloat(formData.unit_price) || 0)
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
              <Button type="submit" className="w-full">
                Record Sale
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time B2C revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{todaysSales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Sales made today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{thisMonthSales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Current month sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Units Sold</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuantitySold.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total units sold</p>
          </CardContent>
        </Card>
      </div>

      {/* Product Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Product Performance</CardTitle>
            <CardDescription>Sales performance by product</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {productSales.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-gray-600">{product.totalSold} units sold</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">₹{product.revenue.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">{product.salesCount} transactions</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>Latest B2C transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sales.slice(0, 5).map((sale) => (
                <div key={sale.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{sale.product_name}</div>
                    <div className="text-sm text-gray-600">
                      {sale.customer_name} • {new Date(sale.sale_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">₹{sale.total_amount.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">{sale.quantity} units</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Records */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Records</CardTitle>
          <CardDescription>Complete history of B2C sales transactions</CardDescription>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by product or customer..."
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
                <TableHead>Product</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Total Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{new Date(sale.sale_date).toLocaleDateString()}</TableCell>
                  <TableCell>{sale.product_name}</TableCell>
                  <TableCell>{sale.customer_name}</TableCell>
                  <TableCell>{sale.quantity}</TableCell>
                  <TableCell>₹{sale.unit_price.toLocaleString()}</TableCell>
                  <TableCell>₹{sale.total_amount.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default function B2CSales() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <DashboardLayout>
          <B2CSalesContent />
        </DashboardLayout>
      </ProtectedRoute>
    </AuthProvider>
  )
}
