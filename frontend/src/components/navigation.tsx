"use client"

import { useEffect, useState } from "react"
import Button from "@mui/material/Button"
import Link from "next/link"

export function Navigation() {
  const [ctaHref, setCtaHref] = useState("/employee/login")

  useEffect(() => {
    if (typeof window === "undefined") return
    const token = localStorage.getItem("access_token")
    setCtaHref(token ? "/employee/dashboard" : "/employee/login")
  }, [])

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl">
      <div className="bg-background/80 backdrop-blur-md border border-border rounded-full px-6 py-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="text-xl font-bold tracking-tight">
          <span className="text-muted-foreground">Ar</span>cana
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              FEATURES
            </a>
            <a href="#solutions" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              SOLUTIONS
            </a>
            <a href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ABOUT
            </a>
            <a href="#contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              CONTACT
            </a>
          </div>

          <Button
            component={Link}
            href={ctaHref}
            variant="contained"
            sx={{
              bgcolor: "white",
              color: "black",
              borderRadius: "999px",
              px: 3,
              py: 1,
              textTransform: "none",
              fontWeight: 500,
              "&:hover": {
                bgcolor: "rgba(255, 255, 255, 0.9)",
              },
            }}
          >
            LOGIN
          </Button>
        </div>
      </div>
    </nav>
  )
}
