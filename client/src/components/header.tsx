"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function Header() {
  const router = useRouter();
  const handleLogout = () => {
    router.push("/login");
  }

  return (
    <header className="w-full flex items-center justify-between px-6 py-4 bg-gray-100 border-b">
      <span className="font-semibold text-lg">Social Network</span>
      <Button variant="outline" onClick={handleLogout}>
        Logout
      </Button>
    </header>
  )
}