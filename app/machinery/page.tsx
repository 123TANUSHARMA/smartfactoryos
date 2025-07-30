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
import { Plus, Search, Wrench, Calendar } from "lucide-react"
import { supabase } from "@/lib/supabase"
import DashboardLayout from "@/components/dashboard-layout"
import { AuthProvider } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import ProtectedRoute from "@/components/protected-route"

interface Machine {
  id: string
  name: string
  type: string
}

interface MaintenanceRecord {
  id: string
  machine_name: string
  maintenance_date: string
  cost: number
  description: string
  maintenance_type: string
}

function MachineryContent() {
  const [machines, setMachines] = useState<Machine[]>([])
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"maintenance" | "overview">("overview")
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    machine_id: "",
    cost: "",
    description: "",
    maintenance_type: "routine",
    maintenance_date: new Date().toISOString().split("T")[0],
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch machines
      const { data: machinesData } = await supabase.from("machines").select("*").order("name")

      // Fetch maintenance records with machine names
      const { data: maintenanceData } = await supabase
        .from("machine_maintenance")
        .select(`
          *,
          machines(name)
        `)
        .order("maintenance_date", { ascending: false })

      setMachines(machinesData || [])

      // Transform maintenance data
      const transformedMaintenance =
        maintenanceData?.map((record) => ({
          id: record.id,
          machine_name: record.machines?.name || "",
          maintenance_date: record.maintenance_date,
          cost: record.cost,
          description: record.description,
          maintenance_type: record.maintenance_type,
        })) || []

      setMaintenance(transformedMaintenance)
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
      const { error } = await supabase.from("machine_maintenance").insert({
        machine_id: formData.machine_id,
        maintenance_date: formData.maintenance_date,
        cost: Number.parseFloat(formData.cost),
        description: formData.description,
        maintenance_type: formData.maintenance_type,
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Maintenance record added successfully",
      })

      setIsAddDialogOpen(false)
      setFormData({
        machine_id: "",
        cost: "",
        description: "",
        maintenance_type: "routine",
        maintenance_date: new Date().toISOString().split("T")[0],
      })
      fetchData()
    } catch (error) {
      console.error("Error adding maintenance record:", error)
      toast({
        title: "Error",
        description: "Failed to add maintenance record",
        variant: "destructive",
      })
    }
  }

  const filteredMaintenance = maintenance.filter(
    (record) =>
      record.machine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Calculate statistics
  const totalMaintenanceCost = maintenance.reduce((sum, record) => sum + Number(record.cost), 0)
  const thisMonthCost = maintenance
    .filter((record) => {
      const recordDate = new Date(record.maintenance_date)
      const now = new Date()
      return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear()
    })
    .reduce((sum, record) => sum + Number(record.cost), 0)

  const machineStats = machines.map((machine) => {
    const machineRecords = maintenance.filter((record) => record.machine_name === machine.name)
    const totalCost = machineRecords.reduce((sum, record) => sum + Number(record.cost), 0)
    const lastMaintenance = machineRecords[0]?.maintenance_date || "Never"

    return {
      ...machine,
      totalCost,
      lastMaintenance,
      recordCount: machineRecords.length,
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
          <h1 className="text-3xl font-bold text-gray-900">Machinery Management</h1>
          <p className="text-gray-600">Track machine maintenance and operational costs</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Maintenance
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record Machine Maintenance</DialogTitle>
              <DialogDescription>Add a new maintenance or repair record</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="machine">Machine</Label>
                <Select
                  value={formData.machine_id}
                  onValueChange={(value) => setFormData({ ...formData, machine_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select machine" />
                  </SelectTrigger>
                  <SelectContent>
                    {machines.map((machine) => (
                      <SelectItem key={machine.id} value={machine.id}>
                        {machine.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="maintenance_type">Maintenance Type</Label>
                <Select
                  value={formData.maintenance_type}
                  onValueChange={(value) => setFormData({ ...formData, maintenance_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="routine">Routine Maintenance</SelectItem>
                    <SelectItem value="repair">Repair</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cost">Cost (₹)</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="maintenance_date">Date</Label>
                  <Input
                    id="maintenance_date"
                    type="date"
                    value={formData.maintenance_date}
                    onChange={(e) => setFormData({ ...formData, maintenance_date: e.target.value })}
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
                  placeholder="Describe the maintenance work..."
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Record Maintenance
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Maintenance Cost</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalMaintenanceCost.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time maintenance expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{thisMonthCost.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Current month expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Machines</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{machines.length}</div>
            <p className="text-xs text-muted-foreground">Total machines in operation</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6">
        <Button variant={activeTab === "overview" ? "default" : "outline"} onClick={() => setActiveTab("overview")}>
          Machine Overview
        </Button>
        <Button
          variant={activeTab === "maintenance" ? "default" : "outline"}
          onClick={() => setActiveTab("maintenance")}
        >
          Maintenance Records
        </Button>
      </div>

      {activeTab === "overview" && (
        <Card>
          <CardHeader>
            <CardTitle>Machine Overview</CardTitle>
            <CardDescription>Status and maintenance summary for each machine</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {machineStats.map((machine) => (
                <Card key={machine.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{machine.name}</CardTitle>
                    <CardDescription className="capitalize">{machine.type.replace("_", " ")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Maintenance Cost:</span>
                        <span className="font-medium">₹{machine.totalCost.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Maintenance Records:</span>
                        <span className="font-medium">{machine.recordCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Last Maintenance:</span>
                        <span className="font-medium">
                          {machine.lastMaintenance === "Never"
                            ? "Never"
                            : new Date(machine.lastMaintenance).toLocaleDateString()}
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

      {activeTab === "maintenance" && (
        <Card>
          <CardHeader>
            <CardTitle>Maintenance Records</CardTitle>
            <CardDescription>Complete history of machine maintenance and repairs</CardDescription>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by machine or description..."
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
                  <TableHead>Machine</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMaintenance.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{new Date(record.maintenance_date).toLocaleDateString()}</TableCell>
                    <TableCell>{record.machine_name}</TableCell>
                    <TableCell className="capitalize">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          record.maintenance_type === "repair"
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {record.maintenance_type}
                      </span>
                    </TableCell>
                    <TableCell>{record.description}</TableCell>
                    <TableCell>₹{Number(record.cost).toLocaleString()}</TableCell>
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

export default function Machinery() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <DashboardLayout>
          <MachineryContent />
        </DashboardLayout>
      </ProtectedRoute>
    </AuthProvider>
  )
}
