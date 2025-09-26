"use client";

import { cn } from "@/lib/utils";
import Button from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthProvider"
import { useNotifications } from "@/lib/floating-notification"
import { Eye, EyeOff, Loader2 } from "lucide-react"
// import GoogleSignInButton from "./ui/googleButton"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const { login, isLoading } = useAuth()
  const { showNotification } = useNotifications()
  const [form, setForm] = useState({
    email: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    // DON'T clear error immediately - let users see them and provide clear feedback
    // This gives them opportunity to read and act upon errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      await login(form.email, form.password)
      // Show success notification
      showNotification("Login successful! Redirecting...", 'success', 2000)
      router.push("/") // Redirect to home page on success
    } catch (err) {
      console.log('Login error caught:', err);
      // Extract user-friendly error message
      let errorMessage = "Login failed. Please try again.";
      
      if (err instanceof Error) {
        console.log('Error instanceof Error:', err.message);
        errorMessage = err.message.trim();
      } else if (err && typeof err === 'object' && 'message' in err) {
        console.log('Error object with message:', err.message);
        errorMessage = String(err.message).trim();
      } else {
        console.log('Unknown error object:', err);
      }
      
      console.log('Final error message to display:', errorMessage);
      
      // Show floating notification instead of form state
      showNotification(errorMessage, 'error', 8000)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6 max-w-2xl mx-auto w-full px-8", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              className="w-full h-12 hover:bg-destructive hover:text-white"
              type="button"
            >
              Login with Google
            </Button>
            <Button
              variant="outline"
              className="w-full h-12 hover:bg-chart-3 hover:text-white"
              type="button"
            >
              Login with Facebook
            </Button>
            <Button variant="outline" className="w-full h-12 mb-8" type="button">
              Login with Apple
            </Button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={form.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="h-12"
                />
              </div>
              
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={form.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="pr-10 h-12"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full h-12" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
                {/* <Button className="w-full" type="button" disabled={isLoading}>
                  Login with Google
                </Button> */}
                {/* <GoogleSignInButton/> */}
              </div>
            </div>
            
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="underline underline-offset-4">
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
