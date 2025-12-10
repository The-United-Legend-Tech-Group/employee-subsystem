"use client";
import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import FormLabel from "@mui/material/FormLabel";
import FormControl from "@mui/material/FormControl";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import MuiCard from "@mui/material/Card";
import { styled, keyframes } from "@mui/material/styles";
import { useRouter } from "next/navigation";

// Adjust imports based on your project structure
import AppTheme from "../../../common/material-ui/shared-theme/AppTheme";


import ArcanaLogo from "../../../common/material-ui/shared-theme/ArcanaLogo";
import ColorModeSelect from "../../../common/material-ui/shared-theme/ColorModeSelect";
import { encryptData } from '../../../common/utils/encryption';
        
const floatLayers = keyframes`
    0% {
        transform: translate3d(-40%, -28%, 0) rotate(-18deg) scale(0.9);
        opacity: 0.45;
    }
    25% {
        transform: translate3d(22%, -12%, 0) rotate(8deg) scale(1.14);
        opacity: 0.82;
    }
    50% {
        transform: translate3d(18%, 32%, 0) rotate(-6deg) scale(1.08);
        opacity: 0.68;
    }
    75% {
        transform: translate3d(-16%, 18%, 0) rotate(10deg) scale(1.2);
        opacity: 0.74;
    }
    100% {
        transform: translate3d(-40%, -28%, 0) rotate(-18deg) scale(0.9);
        opacity: 0.45;
    }
`;

const floatLayersReverse = keyframes`
    0% {
        transform: translate3d(32%, 26%, 0) rotate(16deg) scale(1.1);
        opacity: 0.38;
    }
    25% {
        transform: translate3d(-18%, 8%, 0) rotate(-10deg) scale(0.96);
        opacity: 0.62;
    }
    50% {
        transform: translate3d(-26%, -28%, 0) rotate(6deg) scale(1.08);
        opacity: 0.55;
    }
    75% {
        transform: translate3d(12%, -16%, 0) rotate(-4deg) scale(1.22);
        opacity: 0.7;
    }
    100% {
        transform: translate3d(32%, 26%, 0) rotate(16deg) scale(1.1);
        opacity: 0.38;
    }
`;

const pulseGlow = keyframes`
    0% {
        opacity: 0.22;
        transform: scale(0.92) rotate(-8deg);
    }
    50% {
        opacity: 0.6;
        transform: scale(1.18) rotate(18deg);
    }
    100% {
        opacity: 0.22;
        transform: scale(0.92) rotate(-8deg);
    }
`;

const colorWaves = keyframes`
    0% {
        background-position: 0% 50%;
    }
    50% {
        background-position: 100% 50%;
    }
    100% {
        background-position: 0% 50%;
    }
`;

const beamSweep = keyframes`
    0% {
        transform: translate3d(-15%, -10%, 0) rotate(18deg) scale(0.95);
        opacity: 0.25;
    }
    50% {
        transform: translate3d(8%, 12%, 0) rotate(26deg) scale(1.05);
        opacity: 0.6;
    }
    100% {
        transform: translate3d(-15%, -10%, 0) rotate(18deg) scale(0.95);
        opacity: 0.25;
    }
`;


const Card = styled(MuiCard)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignSelf: "center",
  width: "100%",
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: "auto",
  boxShadow:
    "hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px",
  [theme.breakpoints.up("sm")]: {
    width: "450px",
  },
  ...theme.applyStyles("dark", {
    boxShadow:
      "hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px",
  }),
}));

const SignUpContainer = styled(Stack)(({ theme }) => ({
  position: "relative",
  isolation: "isolate",
  overflow: "hidden",
  minHeight: "100dvh",
  padding: theme.spacing(2),
  backgroundImage:
    "linear-gradient(135deg, hsl(210, 100%, 99%), hsl(204, 90%, 95%))",
  backgroundSize: "160% 160%",
  animation: `${colorWaves} 18s ease-in-out alternate infinite`,
  [theme.breakpoints.up("sm")]: {
    padding: theme.spacing(4),
  },
  ...theme.applyStyles("dark", {
    backgroundImage:
      "linear-gradient(135deg, hsl(218, 45%, 14%), hsl(222, 45%, 8%))",
    animation: `${colorWaves} 20s ease-in-out alternate infinite`,
  }),
}));

const AnimatedBackdrop = () => (
  <Box
    aria-hidden
    sx={{
      position: "absolute",
      inset: 0,
      overflow: "hidden",
      pointerEvents: "none",
      zIndex: -1,
    }}
  >
    <Box
      sx={(theme) => ({
        position: "absolute",
        width: { xs: "140vw", sm: "90vw" },
        height: { xs: "140vw", sm: "90vw" },
        top: { xs: "-70vw", sm: "-45vw" },
        left: { xs: "-50vw", sm: "-25vw" },
        borderRadius: "50%",
        background:
          "radial-gradient(circle, rgba(63, 142, 252, 0.32) 0%, rgba(63, 142, 252, 0) 60%)",
        filter: "blur(90px)",
        animation: `${floatLayers} 22s ease-in-out infinite`,
        transformOrigin: "center",
        ...theme.applyStyles("dark", {
          background:
            "radial-gradient(circle, rgba(33, 150, 243, 0.55) 0%, rgba(33, 150, 243, 0) 60%)",
        }),
      })}
    />
    <Box
      sx={(theme) => ({
        position: "absolute",
        width: { xs: "110vw", sm: "70vw" },
        height: { xs: "110vw", sm: "70vw" },
        bottom: { xs: "-65vw", sm: "-40vw" },
        right: { xs: "-55vw", sm: "-30vw" },
        borderRadius: "50%",
        background:
          "radial-gradient(circle, rgba(142, 84, 233, 0.28) 0%, rgba(142, 84, 233, 0) 62%)",
        filter: "blur(80px)",
        animation: `${floatLayersReverse} 28s ease-in-out infinite`,
        transformOrigin: "center",
        ...theme.applyStyles("dark", {
          background:
            "radial-gradient(circle, rgba(124, 77, 255, 0.42) 0%, rgba(124, 77, 255, 0) 62%)",
        }),
      })}
    />
    <Box
      sx={(theme) => ({
        position: "absolute",
        width: { xs: "140vw", sm: "110vw" },
        height: { xs: "140vw", sm: "110vw" },
        top: { xs: "-40vw", sm: "-30vw" },
        right: { xs: "-70vw", sm: "-40vw" },
        background:
          "linear-gradient(120deg, rgba(33, 150, 243, 0.18), rgba(0, 188, 212, 0.05), rgba(255, 255, 255, 0))",
        mixBlendMode: "screen",
        filter: "blur(90px)",
        animation: `${beamSweep} 26s ease-in-out infinite`,
        ...theme.applyStyles("dark", {
          background:
            "linear-gradient(120deg, rgba(21, 101, 192, 0.3), rgba(0, 172, 193, 0.08), rgba(13, 71, 161, 0))",
        }),
      })}
    />
  </Box>
);

export default function EmployeeLogin() {
  const router = useRouter();

  const [emailError, setEmailError] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState("");

  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState("");

  const [formError, setFormError] = React.useState("");

  const validateInputs = () => {
    const email = document.getElementById("email") as HTMLInputElement;
    const password = document.getElementById("password") as HTMLInputElement;

    let isValid = true;

    if (!email.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      setEmailError(true);
      setEmailErrorMessage("Please enter a valid email address.");
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage("");
    }

    if (!password.value || password.value.length < 1) {
      setPasswordError(true);
      setPasswordErrorMessage("Password is required.");
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage("");
    }

    return isValid;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");


    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFormError('');

        if (!validateInputs()) {
            return;
        }

        const data = new FormData(event.currentTarget);
        const payload = {
            email: data.get('email'),
            password: data.get('password'),
        };

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000';
            const response = await fetch(`${apiUrl}/auth/employee/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                // Successful login
                const data = await response.json();
                localStorage.setItem('access_token', data.access_token);

                // Encrypt employeeId before storing
                const encryptedEmployeeId = await encryptData(data.employeeId, data.access_token);
                localStorage.setItem('employeeId', encryptedEmployeeId);

                router.push('/employee/dashboard');
            } else {
                const errorData = await response.json();
                setFormError(errorData.message || 'Login failed. Please check your credentials.');
            }
        } catch (error) {
            console.error('Login error:', error);
            setFormError('An unexpected error occurred. Please try again later.');
        }
    };

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:50000";
      const response = await fetch(`${apiUrl}/auth/employee/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // Successful login
        const data = await response.json();
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("employeeId", data.employeeId);
        router.push("/employee/dashboard");
      } else {
        const errorData = await response.json();
        setFormError(
          errorData.message || "Login failed. Please check your credentials."
        );
      }
    } catch (error) {
      console.error("Login error:", error);
      setFormError("An unexpected error occurred. Please try again later.");
    }
  };

  return (
    <AppTheme>
      <CssBaseline enableColorScheme />

      <SignUpContainer direction="column" justifyContent="center">
        <AnimatedBackdrop />
        <ColorModeSelect
          sx={{ position: "fixed", top: "1rem", right: "1rem" }}
        />
        <Card variant="outlined">
          <ArcanaLogo />
          <Typography
            component="h1"
            variant="h4"
            sx={{ width: "100%", fontSize: "clamp(2rem, 10vw, 2.15rem)" }}
          >
            Employee Login
          </Typography>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <FormControl>
              <FormLabel htmlFor="email">Email</FormLabel>
              <TextField
                required
                fullWidth
                id="email"
                placeholder="your@email.com"
                name="email"
                autoComplete="email"
                variant="outlined"
                error={emailError}
                helperText={emailErrorMessage}
                color={emailError ? "error" : "primary"}
              />
            </FormControl>

            <FormControl>
              <FormLabel htmlFor="password">Password</FormLabel>
              <TextField
                required
                fullWidth
                name="password"
                placeholder="••••••"
                type="password"
                id="password"
                autoComplete="current-password"
                variant="outlined"
                error={passwordError}
                helperText={passwordErrorMessage}
                color={passwordError ? "error" : "primary"}
              />
            </FormControl>

            {formError && (
              <Typography color="error" variant="body2">
                {formError}
              </Typography>
            )}

            <Button type="submit" fullWidth variant="contained">
              Sign in
            </Button>
          </Box>
        </Card>
      </SignUpContainer>
    </AppTheme>
  );
}
