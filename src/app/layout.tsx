import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Backdrop from "@/components/layout/Backdrop";
import MobileContentWrapper from "@/components/layout/MobileContentWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tunas - Swimming Analytics Dashboard",
  description: "Swimming meet results analysis and relay optimization",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const savedTheme = localStorage.getItem('tunas-theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
                if (shouldBeDark) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <SidebarProvider>
            <div className="min-h-screen lg:flex lg:flex-row bg-gray-50 dark:bg-gray-950">
              <Sidebar />
              <Backdrop />
              <MobileContentWrapper>
                <Header />
                <div className="p-4 mx-auto max-w-[1536px] md:p-6">
                  {children}
                </div>
              </MobileContentWrapper>
            </div>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
