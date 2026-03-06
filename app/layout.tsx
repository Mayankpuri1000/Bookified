import type { Metadata } from "next";
import { IBM_Plex_Serif, Mona_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";

const ibmPlexSerif = IBM_Plex_Serif({
  subsets: ["latin"],
  variable: "--font-ibm-plex-serif",
  weight: ["400", "500", "600", "700"],
  display: "swap"
});

const monaSans = Mona_Sans({
  subsets: ["latin"],
  variable: "--font-mona-sans",
  display: "swap"
})

export const metadata: Metadata = {
  title: "Bookified AI",
  description: "Bookified AI is a platform for book lovers to connect and share their love of books.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${monaSans.variable} ${ibmPlexSerif.variable} relative font-sans antialiased`}
      >
        <ClerkProvider>
          <Navbar />
          {children}
          <Toaster />
        </ClerkProvider>
      </body>
    </html>
  );
}
