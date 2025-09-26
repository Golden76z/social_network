'use client';

import { cn } from '@/lib/utils';
import Button from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useNotifications } from '@/lib/floating-notification';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const router = useRouter();
  const { register, isLoading } = useAuth();
  const { showNotification } = useNotifications();
  const [form, setForm] = useState({
    nickname: '',
    first_name: '',
    last_name: '',
    email: '',
    date_of_birth: '',
    password: '',
    confirm_password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showconfirm_password, setShowconfirm_password] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (form.password !== form.confirm_password) {
      showNotification('Passwords do not match', 'error', 8000);
      return false;
    }

    if (form.password.length < 8) {
      showNotification('Password must be at least 8 characters long', 'error', 8000);
      return false;
    }

    // Check if user is at least 13 years old
    const today = new Date();
    const birthDate = new Date(form.date_of_birth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    if (age < 13) {
      showNotification('You must be at least 13 years old to register', 'error', 8000);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    try {
      await register({
        nickname: form.nickname,
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        date_of_birth: form.date_of_birth,
        password: form.password,
        confirmPassword: ""
      })
      // Show success notification
      showNotification("Registration successful! Redirecting...", 'success', 2000);
      router.push("/") // Redirect to home page on success
    } catch (err) {
      console.log('Register error caught:', err);
      // Extract user-friendly error message
      let errorMessage = "Registration failed. Please try again.";
      
      if (err instanceof Error) {
        console.log('Registration error instanceof Error:', err.message);
        errorMessage = err.message.trim();
      } else if (err && typeof err === 'object' && 'message' in err) {
        console.log('Registration error object with message:', err.message);
        errorMessage = String(err.message).trim();
      } else {
        console.log('Registration unknown error object:', err);
      }
      
      console.log('Final registration error message to display:', errorMessage);
      
      // Show floating notification instead of form state  
      showNotification(errorMessage, 'error', 8000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn('flex flex-col gap-6 max-w-2xl mx-auto w-full px-8', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Register your account</CardTitle>
          <CardDescription>
            Enter your information below to create a new account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="nickname">Nickname *</Label>
                <Input
                  id="nickname"
                  name="nickname"
                  type="text"
                  placeholder="Pseudo"
                  required
                  value={form.nickname}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="h-12"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-3">
                  <Label htmlFor="first-name">First Name *</Label>
                  <Input
                    id="first-name"
                    name="first_name"
                    type="text"
                    placeholder="John"
                    required
                    value={form.first_name}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="h-12"
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="last-name">Last Name *</Label>
                  <Input
                    id="last-name"
                    name="last_name"
                    type="text"
                    placeholder="Doe"
                    required
                    value={form.last_name}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="h-12"
                  />
                </div>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="email">Email *</Label>
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
                <Label htmlFor="date-of-birth">Date of Birth *</Label>
                <Input
                  id="date-of-birth"
                  name="date_of_birth"
                  type="date"
                  required
                  value={form.date_of_birth}
                  onChange={handleChange}
                  disabled={isLoading}
                  max={new Date().toISOString().split('T')[0]} // Prevent future dates
                  className="h-12"
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="pr-10 h-12"
                    placeholder="At least 8 characters"
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

              <div className="grid gap-3">
                <Label htmlFor="confirm-password">Confirm Password *</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    name="confirm_password"
                    type={showconfirm_password ? 'text' : 'password'}
                    required
                    value={form.confirm_password}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="pr-10 h-12"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      setShowconfirm_password(!showconfirm_password)
                    }
                  >
                    {showconfirm_password ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-12" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Register'
                )}
              </Button>
            </div>

            <div className="mt-4 text-center text-sm">
              Already have an account?{' '}
              <Link href="/login" className="underline underline-offset-4">
                Login
              </Link>
            </div>

            <div className="flex flex-col gap-3">
              <div className="mt-6 mb-3 text-center text-sm text-muted-foreground">
                Or
              </div>

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
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
