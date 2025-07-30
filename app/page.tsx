"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { AuthProvider, useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { createDemoUserAction, signUpUser, resetDemoUser } from "./actions/auth"
import { RefreshCw } from "lucide-react"

function AuthForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [role, setRole] = useState("staff")
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      router.push("/dashboard")
    }
  }, [user, authLoading, router])

  // Don't render if still loading or user is authenticated
  if (authLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log("Attempting signup with:", { email, name, role })

      const result = await signUpUser(email, password, name, role)

      if (!result.success) {
        throw new Error(result.message)
      }

      toast({
        title: "Success",
        description: "Account created successfully! You can now sign in.",
      })

      // Switch to login mode and pre-fill email
      setIsSignUp(false)
      setPassword("")
      setName("")
    } catch (error: any) {
      console.error("Signup error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create account",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log("Attempting signin with:", email)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Signin error:", error)
        throw error
      }

      if (data.user) {
        toast({
          title: "Success",
          description: "Signed in successfully!",
        })
        // Navigation will happen automatically via useEffect
      }
    } catch (error: any) {
      console.error("Signin error:", error)
      toast({
        title: "Error",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setDemoLoading(true)

    try {
      console.log("Attempting demo login...")

      // First, try to sign in directly
      const { data, error } = await supabase.auth.signInWithPassword({
        email: "owner@detergent.com",
        password: "password123",
      })

      if (!error && data.user) {
        toast({
          title: "Success",
          description: "Demo login successful!",
        })
        return
      }

      console.log("Direct login failed, trying to setup demo user...")

      // If direct login fails, try to setup the demo user
      const createResult = await createDemoUserAction()
      console.log("Demo user setup result:", createResult)

      if (!createResult.success) {
        throw new Error(createResult.message)
      }

      // Wait a moment for user creation/update to complete
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Try signing in again
      const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
        email: "owner@detergent.com",
        password: "password123",
      })

      if (retryError) {
        console.error("Retry login failed:", retryError)
        throw new Error("Demo login failed after setup. Please try creating a new account instead.")
      }

      if (retryData.user) {
        toast({
          title: "Success",
          description: "Demo user setup and login successful!",
        })
      }
    } catch (error: any) {
      console.error("Demo login error:", error)
      toast({
        title: "Demo Login Failed",
        description: "Please try creating a new account or use the reset demo button.",
        variant: "destructive",
      })
    } finally {
      setDemoLoading(false)
    }
  }

  const handleResetDemo = async () => {
    setDemoLoading(true)

    try {
      console.log("Resetting demo user...")

      const result = await resetDemoUser()

      if (!result.success) {
        throw new Error(result.message)
      }

      toast({
        title: "Success",
        description: "Demo user reset successfully! You can now try demo login.",
      })

      // Wait a moment then try to login
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const { data, error } = await supabase.auth.signInWithPassword({
        email: "owner@detergent.com",
        password: "password123",
      })

      if (!error && data.user) {
        toast({
          title: "Success",
          description: "Demo login successful after reset!",
        })
      }
    } catch (error: any) {
      console.error("Reset demo error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to reset demo user",
        variant: "destructive",
      })
    } finally {
      setDemoLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Detergent Manufacturing</CardTitle>
          <CardDescription>{isSignUp ? "Create your account" : "Sign in to your account"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
            {isSignUp && (
              <>
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="mt-1"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1"
                placeholder={isSignUp ? "Create a password (min 6 characters)" : "Enter your password"}
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || demoLoading}>
              {loading ? (isSignUp ? "Creating Account..." : "Signing in...") : isSignUp ? "Create Account" : "Sign In"}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setEmail("")
                setPassword("")
                setName("")
              }}
              className="text-sm text-blue-600 hover:text-blue-500"
              disabled={loading || demoLoading}
            >
              {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
            </button>
          </div>

          {!isSignUp && (
            <div className="space-y-3">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">Demo Options</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="bg-transparent"
                  onClick={handleDemoLogin}
                  disabled={loading || demoLoading}
                >
                  {demoLoading ? "Setting up..." : "Try Demo"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="bg-transparent"
                  onClick={handleResetDemo}
                  disabled={loading || demoLoading}
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  {demoLoading ? "Resetting..." : "Reset Demo"}
                </Button>
              </div>

              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                <p className="font-medium">Demo Account:</p>
                <p>Email: owner@detergent.com</p>
                <p>Password: password123</p>
                <div className="text-xs mt-2 space-y-1">
                  <p>• "Try Demo" - Quick login/setup</p>
                  <p>• "Reset Demo" - Fix login issues</p>
                </div>
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
            <p className="font-medium text-blue-800">Getting Started:</p>
            <p>1. Create your own account (recommended)</p>
            <p>2. Or use demo account for testing</p>
            <p>3. If demo fails, try "Reset Demo" button</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AuthPage() {
  return (
    <AuthProvider>
      <AuthForm />
    </AuthProvider>
  )
}
