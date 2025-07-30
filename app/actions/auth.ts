"use server"

import { createServerClient } from "@/lib/supabase"

export async function createDemoUserAction() {
  const supabase = createServerClient()

  try {
    // First check if user already exists
    const { data: existingUser } = await supabase.auth.admin.getUserById("owner@detergent.com")

    if (existingUser) {
      console.log("Demo user already exists, updating password...")

      // Update the existing user's password
      const { data, error } = await supabase.auth.admin.updateUserById(existingUser.user?.id || "", {
        password: "password123",
        user_metadata: {
          name: "Business Owner",
          role: "owner",
        },
      })

      if (error) {
        console.error("Error updating demo user:", error)
        // If update fails, try to delete and recreate
        await supabase.auth.admin.deleteUser(existingUser.user?.id || "")
        return await createNewDemoUser(supabase)
      }

      return { success: true, message: "Demo user password updated successfully" }
    } else {
      return await createNewDemoUser(supabase)
    }
  } catch (error: any) {
    console.error("Error in createDemoUserAction:", error)

    // If there's an error, try to create a new user anyway
    return await createNewDemoUser(supabase)
  }
}

async function createNewDemoUser(supabase: any) {
  try {
    // Create new demo user
    const { data, error } = await supabase.auth.admin.createUser({
      email: "owner@detergent.com",
      password: "password123",
      email_confirm: true,
      user_metadata: {
        name: "Business Owner",
        role: "owner",
      },
    })

    if (error) {
      if (error.message.includes("already registered")) {
        // User exists but we couldn't find them, try to reset password
        const { error: resetError } = await supabase.auth.admin.generateLink({
          type: "recovery",
          email: "owner@detergent.com",
        })

        if (!resetError) {
          return { success: true, message: "Demo user exists, password reset initiated" }
        }
      }
      throw error
    }

    // Also insert/update in our users table
    if (data.user) {
      await supabase.from("users").upsert({
        id: data.user.id,
        email: "owner@detergent.com",
        name: "Business Owner",
        role: "owner",
      })
    }

    return { success: true, message: "Demo user created successfully" }
  } catch (error: any) {
    console.error("Error creating new demo user:", error)
    return { success: false, message: error.message }
  }
}

export async function signUpUser(email: string, password: string, name: string, role: string) {
  const supabase = createServerClient()

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
        },
      },
    })

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    console.error("Signup error:", error)
    return { success: false, message: error.message }
  }
}

export async function resetDemoUser() {
  const supabase = createServerClient()

  try {
    // First, try to find and delete existing demo user
    const { data: users } = await supabase.auth.admin.listUsers()
    const demoUser = users.users?.find((user) => user.email === "owner@detergent.com")

    if (demoUser) {
      await supabase.auth.admin.deleteUser(demoUser.id)
      console.log("Deleted existing demo user")
    }

    // Wait a moment
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Create fresh demo user
    const { data, error } = await supabase.auth.admin.createUser({
      email: "owner@detergent.com",
      password: "password123",
      email_confirm: true,
      user_metadata: {
        name: "Business Owner",
        role: "owner",
      },
    })

    if (error) throw error

    // Also insert into our users table
    if (data.user) {
      await supabase.from("users").upsert({
        id: data.user.id,
        email: "owner@detergent.com",
        name: "Business Owner",
        role: "owner",
      })
    }

    return { success: true, message: "Demo user reset successfully" }
  } catch (error: any) {
    console.error("Error resetting demo user:", error)
    return { success: false, message: error.message }
  }
}
