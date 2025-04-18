"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import LoadingStateDisplay from "./LoadingStateDisplay";
import LockIcon from "@mui/icons-material/Lock";
import { Box } from "@mui/material";

import AuthPage from "@/app/auth/page";
import { theme } from "@/utils/theme";

interface AuthGuardProps {
  children: ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showLoading, setShowLoading] = useState(true);
  // Check if user has token - this will be used for initial routing decisions
  const [hasToken, setHasToken] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);

  // On initial load, check for token
  useEffect(() => {
    if (typeof window !== "undefined") {
      const tokenExists = !!localStorage.getItem("auth_token");
      setHasToken(tokenExists);
      setShowLoading(!tokenExists);
    }
  }, []);

  // Handle routing based on authentication state
  useEffect(() => {
    // Handle auth page redirection immediately if token exists
    // This prevents the auth page from showing briefly
    // if (pathname === "/auth" && hasToken) {
    //   router.replace("/");
    //   return;
    // }

    
    // For other routes, wait until loading is complete
    if (!loading) {
        console.log("User:", user);
      if (user) {
        // User is successfully authenticated
        if (pathname === "/auth") {
          router.replace("/");
        }
        setNeedsLogin(false); // User is authenticated
      } else {
        // User is not authenticated (either no token or invalid token)
        if (pathname !== "/auth" && pathname !== "/") {
            setNeedsLogin(true);
        }
        setShowLoading(false); // Hide loading state after initial check
      }
    }

  }, [user, loading, pathname, router]);

    const routeColorTranslation: { [key: string]: "primary" | "secondary" | "success" | "error" | "info" | "warning" } = {
        '/': "primary",
        '/ingredients': "success",
        '/meals': "secondary",
        '/meal-plans': "primary",
        "/auth": "primary",
    };

  if (!needsLogin && (showLoading && loading) || (!hasToken && showLoading && !user) || (((!user && loading && hasToken) || user) && pathname === "/auth")) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          minWidth: "50vw",
        }}
      >
        <Box
          sx={{
            display: "block",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "10vh",
            minWidth: "50vw",
          }}
        >
          <LoadingStateDisplay
            text="Authenticating..."
            icon={<LockIcon />}
            color={routeColorTranslation[pathname] || "primary"}
            size="medium"
          />
        </Box>
      </Box>
    );
  }

  if (needsLogin) {
    return <AuthPage />;
  }

  return <>{children}</>;
};

export default AuthGuard;
