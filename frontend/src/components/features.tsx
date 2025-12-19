import { Users, Brain, TrendingUp, Shield } from "lucide-react"
import Button from "@mui/material/Button"
import Card from "@mui/material/Card"
import CardContent from "@mui/material/CardContent"

const features = [
  {
    icon: Users,
    title: "Talent Acquisition",
    description:
      "AI-driven recruitment that identifies top candidates and streamlines your hiring process with precision.",
  },
  {
    icon: Brain,
    title: "Smart Analytics",
    description:
      "Deep insights into workforce metrics, performance trends, and predictive analytics for strategic planning.",
  },
  {
    icon: TrendingUp,
    title: "Performance Management",
    description: "Real-time performance tracking and automated feedback systems that drive continuous improvement.",
  },
  {
    icon: Shield,
    title: "Compliance & Security",
    description: "Enterprise-grade security with automated compliance monitoring across global regulations.",
  },
]

export function Features() {
  return (
    <section id="features" className="py-24 px-6 bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4 text-balance">
            ELEVATE YOUR
            <br />
            <span className="text-muted-foreground">WORKFORCE</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Comprehensive HR solutions designed for the modern enterprise
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              sx={{
                bgcolor: "transparent",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                transition: "border-color 0.3s",
                "&:hover": {
                  borderColor: "rgba(255, 255, 255, 0.2)",
                  "& .feature-icon": {
                    transform: "scale(1.1)",
                  },
                },
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <feature.icon className="feature-icon w-12 h-12 mb-6 text-foreground transition-transform" />
                <h3 className="text-2xl font-bold mb-3 tracking-tight">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card
          sx={{
            bgcolor: "transparent",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            mt: 8,
          }}
        >
          <CardContent sx={{ p: 6, textAlign: "center" }}>
            <div className="max-w-3xl mx-auto">
              <h3 className="text-3xl md:text-5xl font-bold mb-6 tracking-tighter text-balance">
                READY TO TRANSFORM YOUR HR OPERATIONS?
              </h3>
              <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                Join thousands of companies already leveraging our platform to build exceptional teams
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="contained"
                  size="large"
                  sx={{
                    bgcolor: "white",
                    color: "black",
                    borderRadius: "999px",
                    px: 4,
                    py: 1.5,
                    textTransform: "none",
                    fontWeight: 500,
                    "&:hover": {
                      bgcolor: "rgba(255, 255, 255, 0.9)",
                    },
                  }}
                >
                  SCHEDULE A DEMO
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  sx={{
                    borderColor: "white",
                    color: "white",
                    borderRadius: "999px",
                    px: 4,
                    py: 1.5,
                    textTransform: "none",
                    fontWeight: 500,
                    borderWidth: 2,
                    "&:hover": {
                      borderWidth: 2,
                      borderColor: "rgba(255, 255, 255, 0.8)",
                      bgcolor: "transparent",
                    },
                  }}
                >
                  VIEW PRICING
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
