"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment, useGLTF } from "@react-three/drei"
import { Suspense } from "react"
import Button from "@mui/material/Button"
import Link from "next/link"

function Model() {
  const { scene } = useGLTF("/images/kitchen-transformed.glb")

  return <primitive object={scene} scale={1.2} position={[0, -0.5, 0]} rotation={[0, Math.PI * 0.25, 0]} />
}

function Scene() {
  return (
    <>
      <ambientLight intensity={1.2} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} />
      <pointLight position={[-10, -10, -10]} intensity={1} />
      <Suspense fallback={null}>
        <Model />
      </Suspense>
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.5}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 3}
      />
      <Environment preset="studio" />
    </>
  )
}

export function Hero3D() {
  return (
    <section className="relative h-screen w-full overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
          <Scene />
        </Canvas>
      </div>

      <div className="absolute inset-0 z-10 bg-gradient-to-b from-background/60 via-background/40 to-background pointer-events-none" />

      <div className="relative z-20 h-full flex items-center justify-center px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-6 text-balance">
            THE FUTURE OF
            <br />
            <span className="text-muted-foreground">HUMAN RESOURCES</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Transform your workforce management with cutting-edge AI-powered solutions. Experience seamless talent
            acquisition, development, and retention.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              variant="outlined"
              size="large"
              component={Link}
              href="/candidate/register"
              sx={{
                borderColor: "white",
                color: "white",
                borderRadius: "999px",
                px: 4,
                py: 1.5,
                fontSize: "1rem",
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
              GET STARTED
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
