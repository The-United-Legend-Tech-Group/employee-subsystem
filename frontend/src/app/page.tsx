"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Hero3D } from "@/components/hero-3d"
import { Navigation } from "@/components/navigation"
import { Features } from "@/components/features"
import { Contact } from "@/components/contact"
import { isAuthenticated } from "@/lib/auth-utils"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    if (typeof window === "undefined") return
    const authed = isAuthenticated()
    if (authed) {
      router.replace("/employee/dashboard")
    }
  }, [router])

  return (
    <main className="min-h-screen">
      <Navigation />
      <Hero3D />
      <Features />
      <Contact />
    </main>
  )
}
