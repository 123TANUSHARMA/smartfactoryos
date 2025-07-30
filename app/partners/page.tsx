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
import { Plus, Search, UserCheck, DollarSign, Calendar } from "lucide-react"
import { supabase } from "@/lib/supabase"
import DashboardLayout from "@/components/dashboard-layout"
import { AuthProvider } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import ProtectedRoute from "@/components/protected-route"

interface PartnerWithdrawal {
  id: string
  partner_name: string
  amount: number
  withdrawal_date: string
  description: string
}

interface PartnerSummary {
  partner_name: string
  totalWithdrawals: number
  withdrawalCount: number
  lastWithdrawal: string
  thisMonthWithdrawals: number
}

function PartnersContent() {
  const [withdrawals, setWithdrawals] = useState<PartnerWithdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState("all")
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    partner_name: "owner",
    amount: "",
    description: "",
    withdrawal_date: new Date().toISOString().split("T")[0],
  })

  useEffect(() => {
    fetchData()
  }, [selectedPeriod])

  const fetchData = async () => {
    try {
      let query = supabase.from("partner_withdrawals").select("*").order("withdrawal_date", { ascending: false })

      // Apply date filter based on selected period
      if (selectedPeriod !== "all") {
        const now = new Date()
        let startDate = ""

        if (selectedPeriod === "month") {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
        } else if (selectedPeriod === "quarter") {
          startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1).toISOString().split("T")[0]
        } else if (selectedPeriod === "year") {
          startDate = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0]
        }

        query = query.gte("withdrawal_date", startDate)
      }

      const { data: withdrawalsData } = await query

      setWithdrawals(withdrawalsData || [])
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
      const { error } = await supabase.from("partner_withdrawals").insert({
        partner_name: formData.partner_name,
        amount: Number.parseFloat(formData.amount),
        withdrawal_date: formData.withdrawal_date,
        description: formData.description,
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Partner withdrawal recorded successfully",
      })

      setIsAddDialogOpen(false)
      setFormData({
        partner_name: "owner",
        amount: "",
        description: "",
        withdrawal_date: new Date().toISOString().split("T")[0],
      })
      fetchData()
    } catch (error) {
      console.error("Error adding withdrawal:", error)
      toast({
        title: "Error",
        description: "Failed to record withdrawal",
        variant: "destructive",
      })
    }
  }

  const filteredWithdrawals = withdrawals.filter(
    (withdrawal) =>
      withdrawal.partner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      withdrawal.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Calculate partner summaries
  const partnerSummaries: PartnerSummary[] = ["owner", "brother"].map((partnerName) => {
    const partnerWithdrawals = withdrawals.filter((w) => w.partner_name === partnerName)
    const totalWithdrawals = partnerWithdrawals.reduce((sum, w) => sum + Number(w.amount), 0)
    const lastWithdrawal = partnerWithdrawals[0]?.withdrawal_date || "Never"

    // This month withdrawals
    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
    const thisMonthWithdrawals = partnerWithdrawals
      .filter((w) => w.withdrawal_date >= thisMonthStart)
      .reduce((sum, w) => sum + Number(w.amount), 0)

    return {
      partner_name: partnerName,
      totalWithdrawals,
      withdrawalCount: partnerWithdrawals.length,
      lastWithdrawal,
      thisMonthWithdrawals,
    }
  })

  // Calculate overall statistics
  const totalWithdrawals = withdrawals.reduce((sum, w) => sum + Number(w.amount), 0)
  const ownerTotal = partnerSummaries.find((p) => p.partner_name === "owner")?.totalWithdrawals || 0
  const brotherTotal = partnerSummaries.find((p) => p.partner_name === "brother")?.totalWithdrawals || 0

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
  const thisMonthTotal = withdrawals
    .filter((w) => w.withdrawal_date >= thisMonthStart)
    .reduce((sum, w) => sum + Number(w.amount), 0)

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
          <h1 className="text-3xl font-bold text-gray-900">Partner Management</h1>
          <p className="text-gray-600">Track partner withdrawals and profit sharing</p>
        </div>
        <div className="flex space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Withdrawal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Record Partner Withdrawal</DialogTitle>
                <DialogDescription>Add a new partner withdrawal record</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="partner_name">Partner</Label>
                  <Select
                    value={formData.partner_name}
                    onValueChange={(value) => setFormData({ ...formData, partner_name: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select partner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="brother">Brother</SelectItem>
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
                    <Label htmlFor="withdrawal_date">Date</Label>
                    <Input
                      id="withdrawal_date"
                      type="date"
                      value={formData.withdrawal_date}
                      onChange={(e) => setFormData({ ...formData, withdrawal_date: e.target.value })}
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
                    placeholder="Purpose of withdrawal..."
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Record Withdrawal
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Withdrawals</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalWithdrawals.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All partner withdrawals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Owner Withdrawals</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">₹{ownerTotal.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {totalWithdrawals > 0 ? `${((ownerTotal / totalWithdrawals) * 100).toFixed(1)}% of total` : "0% of total"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Brother Withdrawals</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{brotherTotal.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {totalWithdrawals > 0
                ? `${((brotherTotal / totalWithdrawals) * 100).toFixed(1)}% of total`
                : "0% of total"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{thisMonthTotal.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Current month withdrawals</p>
          </CardContent>
        </Card>
      </div>

      {/* Partner Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {partnerSummaries.map((partner) => (
          <Card key={partner.partner_name}>
            <CardHeader>
              <CardTitle className="capitalize">{partner.partner_name} Summary</CardTitle>
              <CardDescription>Withdrawal history and statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Withdrawals:</span>
                  <span className="font-medium">₹{partner.totalWithdrawals.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Number of Withdrawals:</span>
                  <span className="font-medium">{partner.withdrawalCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">This Month:</span>
                  <span className="font-medium">₹{partner.thisMonthWithdrawals.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Last Withdrawal:</span>
                  <span className="font-medium">
                    {partner.lastWithdrawal === "Never"
                      ? "Never"
                      : new Date(partner.lastWithdrawal).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm text-gray-600">Average per Withdrawal:</span>
                  <span className="font-medium">
                    ₹
                    {partner.withdrawalCount > 0
                      ? (partner.totalWithdrawals / partner.withdrawalCount).toLocaleString()
                      : "0"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Withdrawal Records */}
      <Card>
        <CardHeader>
          <CardTitle>Withdrawal Records</CardTitle>
          <CardDescription>Complete history of partner withdrawals</CardDescription>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by partner or description..."
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
                <TableHead>Partner</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWithdrawals.map((withdrawal) => (
                <TableRow key={withdrawal.id}>
                  <TableCell>{new Date(withdrawal.withdrawal_date).toLocaleDateString()}</TableCell>
                  <TableCell className="capitalize">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        withdrawal.partner_name === "owner"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {withdrawal.partner_name}
                    </span>
                  </TableCell>
                  <TableCell>₹{Number(withdrawal.amount).toLocaleString()}</TableCell>
                  <TableCell>{withdrawal.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default function Partners() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <DashboardLayout>
          <PartnersContent />
        </DashboardLayout>
      </ProtectedRoute>
    </AuthProvider>
  )
}
