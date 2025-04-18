import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import Header from "@/components/Header";
import AuthGuard from "@/components/AuthGuard";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "@/utils/theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MealGen - Smart Meal Planning",
  description:
    "Plan your meals, track nutrition, and manage food costs effectively",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <AppRouterCacheProvider>
            <ThemeProvider theme={theme}>
              <Header />
              <main className="min-h-screen">
                {/* AuthGuard will handle loading states and redirects based on auth status */}
                <AuthGuard>{children}</AuthGuard>
              </main>
            </ThemeProvider>
          </AppRouterCacheProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
