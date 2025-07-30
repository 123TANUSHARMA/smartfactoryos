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
import { Plus, Search } from "lucide-react"
import { supabase } from "@/lib/supabase"
import DashboardLayout from "@/components/dashboard-layout"
import { AuthProvider } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import ProtectedRoute from "@/components/protected-route"

interface RawMaterial {
  id: string
  name: string
  unit: string
}

interface Supplier {
  id: string
  name: string
  contact_person: string
  phone: string
}

interface Purchase {
  id: string
  supplier_name: string
  material_name: string
  quantity: number
  unit_price: number
  total_amount: number
  amount_paid: number
  remaining_amount: number
  purchase_date: string
  due_date: string
  notes: string
}

function RawMaterialsContent() {
  const [materials, setMaterials] = useState<RawMaterial[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    supplier_id: "",
    material_id: "",
    quantity: "",
    unit_price: "",
    amount_paid: "",
    due_date: "",
    notes: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch materials
      const { data: materialsData } = await supabase.from("raw_materials").select("*").order("name")

      // Fetch suppliers
      const { data: suppliersData } = await supabase.from("suppliers").select("*").order("name")

      // Fetch purchases with joins
      const { data: purchasesData } = await supabase
        .from("raw_material_purchases")
        .select(`
          *,
          suppliers(name),
          raw_materials(name, unit)
        `)
        .order("purchase_date", { ascending: false })

      setMaterials(materialsData || [])
      setSuppliers(suppliersData || [])

      // Transform purchases data
      const transformedPurchases =
        purchasesData?.map((purchase) => ({
          id: purchase.id,
          supplier_name: purchase.suppliers?.name || "",
          material_name: purchase.raw_materials?.name || "",
          quantity: purchase.quantity,
          unit_price: purchase.unit_price,
          total_amount: purchase.total_amount,
          amount_paid: purchase.amount_paid,
          remaining_amount: purchase.remaining_amount,
          purchase_date: purchase.purchase_date,
          due_date: purchase.due_date,
          notes: purchase.notes,
        })) || []

      setPurchases(transformedPurchases)
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

    const quantity = Number.parseFloat(formData.quantity)
    const unitPrice = Number.parseFloat(formData.unit_price)
    const totalAmount = quantity * unitPrice
    const amountPaid = Number.parseFloat(formData.amount_paid) || 0
    const remainingAmount = totalAmount - amountPaid

    try {
      const { error } = await supabase.from("raw_material_purchases").insert({
        supplier_id: formData.supplier_id,
        material_id: formData.material_id,
        quantity,
        unit_price: unitPrice,
        total_amount: totalAmount,
        amount_paid: amountPaid,
        remaining_amount: remainingAmount,
        purchase_date: new Date().toISOString().split("T")[0],
        due_date: formData.due_date || null,
        notes: formData.notes,
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Purchase recorded successfully",
      })

      setIsAddDialogOpen(false)
      setFormData({
        supplier_id: "",
        material_id: "",
        quantity: "",
        unit_price: "",
        amount_paid: "",
        due_date: "",
        notes: "",
      })
      fetchData()
    } catch (error) {
      console.error("Error adding purchase:", error)
      toast({
        title: "Error",
        description: "Failed to record purchase",
        variant: "destructive",
      })
    }
  }

  const filteredPurchases = purchases.filter(
    (purchase) =>
      purchase.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.material_name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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
          <h1 className="text-3xl font-bold text-gray-900">Raw Materials</h1>
          <p className="text-gray-600">Manage procurement and supplier payments</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Purchase
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record Raw Material Purchase</DialogTitle>
              <DialogDescription>Add a new raw material purchase record</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="supplier">Supplier</Label>
                <Select
                  value={formData.supplier_id}
                  onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="material">Raw Material</Label>
                <Select
                  value={formData.material_id}
                  onValueChange={(value) => setFormData({ ...formData, material_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.map((material) => (
                      <SelectItem key={material.id} value={material.id}>
                        {material.name} ({material.unit})
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
                <Label htmlFor="amount_paid">Amount Paid (₹)</Label>
                <Input
                  id="amount_paid"
                  type="number"
                  step="0.01"
                  value={formData.amount_paid}
                  onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>
              <Button type="submit" className="w-full">
                Record Purchase
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase Records</CardTitle>
          <CardDescription>Track all raw material purchases and payments</CardDescription>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by supplier or material..."
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
                <TableHead>Supplier</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Due Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPurchases.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell>{new Date(purchase.purchase_date).toLocaleDateString()}</TableCell>
                  <TableCell>{purchase.supplier_name}</TableCell>
                  <TableCell>{purchase.material_name}</TableCell>
                  <TableCell>{purchase.quantity}</TableCell>
                  <TableCell>₹{purchase.total_amount.toLocaleString()}</TableCell>
                  <TableCell>₹{purchase.amount_paid.toLocaleString()}</TableCell>
                  <TableCell className={purchase.remaining_amount > 0 ? "text-red-600" : "text-green-600"}>
                    ₹{purchase.remaining_amount.toLocaleString()}
                  </TableCell>
                  <TableCell>{purchase.due_date ? new Date(purchase.due_date).toLocaleDateString() : "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default function RawMaterials() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <DashboardLayout>
          <RawMaterialsContent />
        </DashboardLayout>
      </ProtectedRoute>
    </AuthProvider>
  )
}
