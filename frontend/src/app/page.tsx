"use client"
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
    <main
      className="min-h-screen"
      style={{
        // Use CSS variable with safe fallback so text isn't black if the CSS file fails to load
        color: 'var(--foreground, #ffffff)',
        backgroundColor: 'var(--background, #0b1220)'
      }}
    >
      <Navigation />
      {/* Force white writing color for homepage content */}
      <div style={{ color: '#ffffff' }}>
        <Hero3D />
        <Features />
        <Contact />
      </div>
    </main>
  )
}
