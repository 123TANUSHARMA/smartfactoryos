"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"

export default function AuthDebug() {
  const [debugInfo, setDebugInfo] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const checkAuthStatus = async () => {
    setLoading(true)
    try {
      const { data: session } = await supabase.auth.getSession()
      const { data: user } = await supabase.auth.getUser()

      const info = {
        session: session.session ? "Active" : "None",
        user: user.user ? user.user.email : "None",
        timestamp: new Date().toISOString(),
      }

      setDebugInfo(JSON.stringify(info, null, 2))
    } catch (error) {
      setDebugInfo(`Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const testDemoLogin = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: "owner@detergent.com",
        password: "password123",
      })

      const result = {
        success: !error,
        error: error?.message || "None",
        user: data.user?.email || "None",
        timestamp: new Date().toISOString(),
      }

      setDebugInfo(JSON.stringify(result, null, 2))
    } catch (error) {
      setDebugInfo(`Test Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm">Debug Tools</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={checkAuthStatus} disabled={loading}>
            Check Auth
          </Button>
          <Button size="sm" variant="outline" onClick={testDemoLogin} disabled={loading}>
            Test Demo
          </Button>
        </div>
        {debugInfo && <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">{debugInfo}</pre>}
      </CardContent>
    </Card>
  )
}
