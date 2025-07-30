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
import { Plus, Search, DollarSign, Clock, CheckCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import DashboardLayout from "@/components/dashboard-layout"
import { AuthProvider } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import ProtectedRoute from "@/components/protected-route"

interface B2BParty {
  id: string
  name: string
  contact_person: string
  phone: string
  address: string
  credit_limit: number
}

interface Product {
  id: string
  name: string
  type: string
  unit_price: number
}

interface B2BSale {
  id: string
  party_name: string
  product_name: string
  quantity: number
  unit_price: number
  total_amount: number
  amount_paid: number
  remaining_amount: number
  sale_date: string
  due_date: string
  status: string
}

function B2BSalesContent() {
  const [parties, setParties] = useState<B2BParty[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<B2BSale[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isPartyDialogOpen, setIsPartyDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"sales" | "parties">("sales")
  const { toast } = useToast()

  // Form state for sales
  const [saleFormData, setSaleFormData] = useState({
    party_id: "",
    product_id: "",
    quantity: "",
    unit_price: "",
    amount_paid: "",
    due_date: "",
  })

  // Form state for parties
  const [partyFormData, setPartyFormData] = useState({
    name: "",
    contact_person: "",
    phone: "",
    address: "",
    credit_limit: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch parties
      const { data: partiesData } = await supabase.from("b2b_parties").select("*").order("name")

      // Fetch products
      const { data: productsData } = await supabase.from("products").select("*").order("name")

      // Fetch sales with party and product info
      const { data: salesData } = await supabase
        .from("b2b_sales")
        .select(`
          *,
          b2b_parties(name),
          products(name)
        `)
        .order("sale_date", { ascending: false })

      setParties(partiesData || [])
      setProducts(productsData || [])

      // Transform sales data
      const transformedSales =
        salesData?.map((sale) => ({
          id: sale.id,
          party_name: sale.b2b_parties?.name || "",
          product_name: sale.products?.name || "",
          quantity: sale.quantity,
          unit_price: sale.unit_price,
          total_amount: sale.total_amount,
          amount_paid: sale.amount_paid,
          remaining_amount: sale.remaining_amount,
          sale_date: sale.sale_date,
          due_date: sale.due_date,
          status: sale.status,
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

  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const quantity = Number.parseFloat(saleFormData.quantity)
      const unitPrice = Number.parseFloat(saleFormData.unit_price)
      const totalAmount = quantity * unitPrice
      const amountPaid = Number.parseFloat(saleFormData.amount_paid) || 0
      const remainingAmount = totalAmount - amountPaid

      const status = remainingAmount === 0 ? "paid" : amountPaid > 0 ? "partial" : "pending"

      const { error } = await supabase.from("b2b_sales").insert({
        party_id: saleFormData.party_id,
        product_id: saleFormData.product_id,
        quantity,
        unit_price: unitPrice,
        total_amount: totalAmount,
        amount_paid: amountPaid,
        remaining_amount: remainingAmount,
        sale_date: new Date().toISOString().split("T")[0],
        due_date: saleFormData.due_date || null,
        status,
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "B2B sale recorded successfully",
      })

      setIsAddDialogOpen(false)
      setSaleFormData({
        party_id: "",
        product_id: "",
        quantity: "",
        unit_price: "",
        amount_paid: "",
        due_date: "",
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

  const handlePartySubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const { error } = await supabase.from("b2b_parties").insert({
        name: partyFormData.name,
        contact_person: partyFormData.contact_person,
        phone: partyFormData.phone,
        address: partyFormData.address,
        credit_limit: Number.parseFloat(partyFormData.credit_limit) || 0,
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "B2B party added successfully",
      })

      setIsPartyDialogOpen(false)
      setPartyFormData({
        name: "",
        contact_person: "",
        phone: "",
        address: "",
        credit_limit: "",
      })
      fetchData()
    } catch (error) {
      console.error("Error adding party:", error)
      toast({
        title: "Error",
        description: "Failed to add party",
        variant: "destructive",
      })
    }
  }

  const filteredSales = sales.filter(
    (sale) =>
      sale.party_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.product_name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredParties = parties.filter(
    (party) =>
      party.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      party.contact_person.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Calculate statistics
  const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.amount_paid), 0)
  const pendingAmount = sales.reduce((sum, sale) => sum + Number(sale.remaining_amount), 0)
  const thisMonthSales = sales
    .filter((sale) => {
      const saleDate = new Date(sale.sale_date)
      const now = new Date()
      return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear()
    })
    .reduce((sum, sale) => sum + Number(sale.total_amount), 0)

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
          <h1 className="text-3xl font-bold text-gray-900">B2B Sales</h1>
          <p className="text-gray-600">Manage business-to-business sales and payments</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={isPartyDialogOpen} onOpenChange={setIsPartyDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Party
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add B2B Party</DialogTitle>
                <DialogDescription>Add a new distributor or retailer</DialogDescription>
              </DialogHeader>
              <form onSubmit={handlePartySubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Business Name</Label>
                  <Input
                    id="name"
                    value={partyFormData.name}
                    onChange={(e) => setPartyFormData({ ...partyFormData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contact_person">Contact Person</Label>
                  <Input
                    id="contact_person"
                    value={partyFormData.contact_person}
                    onChange={(e) => setPartyFormData({ ...partyFormData, contact_person: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={partyFormData.phone}
                    onChange={(e) => setPartyFormData({ ...partyFormData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={partyFormData.address}
                    onChange={(e) => setPartyFormData({ ...partyFormData, address: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="credit_limit">Credit Limit (₹)</Label>
                  <Input
                    id="credit_limit"
                    type="number"
                    step="0.01"
                    value={partyFormData.credit_limit}
                    onChange={(e) => setPartyFormData({ ...partyFormData, credit_limit: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full">
                  Add Party
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Sale
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Record B2B Sale</DialogTitle>
                <DialogDescription>Add a new business sale transaction</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSaleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="party">B2B Party</Label>
                  <Select
                    value={saleFormData.party_id}
                    onValueChange={(value) => setSaleFormData({ ...saleFormData, party_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select party" />
                    </SelectTrigger>
                    <SelectContent>
                      {parties.map((party) => (
                        <SelectItem key={party.id} value={party.id}>
                          {party.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="product">Product</Label>
                  <Select
                    value={saleFormData.product_id}
                    onValueChange={(value) => {
                      const selectedProduct = products.find((p) => p.id === value)
                      setSaleFormData({
                        ...saleFormData,
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
                      value={saleFormData.quantity}
                      onChange={(e) => setSaleFormData({ ...saleFormData, quantity: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit_price">Unit Price (₹)</Label>
                    <Input
                      id="unit_price"
                      type="number"
                      step="0.01"
                      value={saleFormData.unit_price}
                      onChange={(e) => setSaleFormData({ ...saleFormData, unit_price: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="amount_paid">Amount Paid (₹)</Label>
                  <Input
                    id="amount_paid"
                    type="number"
                    step="0.01"
                    value={saleFormData.amount_paid}
                    onChange={(e) => setSaleFormData({ ...saleFormData, amount_paid: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={saleFormData.due_date}
                    onChange={(e) => setSaleFormData({ ...saleFormData, due_date: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full">
                  Record Sale
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total B2B revenue received</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">₹{pendingAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Outstanding receivables</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month Sales</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{thisMonthSales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Current month total sales</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6">
        <Button variant={activeTab === "sales" ? "default" : "outline"} onClick={() => setActiveTab("sales")}>
          Sales Records
        </Button>
        <Button variant={activeTab === "parties" ? "default" : "outline"} onClick={() => setActiveTab("parties")}>
          B2B Parties
        </Button>
      </div>

      {activeTab === "sales" && (
        <Card>
          <CardHeader>
            <CardTitle>Sales Records</CardTitle>
            <CardDescription>All B2B sales transactions and payment status</CardDescription>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by party or product..."
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
                  <TableHead>Party</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>{new Date(sale.sale_date).toLocaleDateString()}</TableCell>
                    <TableCell>{sale.party_name}</TableCell>
                    <TableCell>{sale.product_name}</TableCell>
                    <TableCell>{sale.quantity}</TableCell>
                    <TableCell>₹{sale.total_amount.toLocaleString()}</TableCell>
                    <TableCell>₹{sale.amount_paid.toLocaleString()}</TableCell>
                    <TableCell className={sale.remaining_amount > 0 ? "text-red-600" : "text-green-600"}>
                      ₹{sale.remaining_amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          sale.status === "paid"
                            ? "bg-green-100 text-green-800"
                            : sale.status === "partial"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {sale.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {activeTab === "parties" && (
        <Card>
          <CardHeader>
            <CardTitle>B2B Parties</CardTitle>
            <CardDescription>Manage your distributors and retailers</CardDescription>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredParties.map((party) => (
                <Card key={party.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{party.name}</CardTitle>
                    <CardDescription>{party.contact_person}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Phone:</span>
                        <span className="font-medium">{party.phone || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Credit Limit:</span>
                        <span className="font-medium">₹{party.credit_limit.toLocaleString()}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span>Address:</span>
                        <p className="mt-1">{party.address || "N/A"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function B2BSales() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <DashboardLayout>
          <B2BSalesContent />
        </DashboardLayout>
      </ProtectedRoute>
    </AuthProvider>
  )
}
