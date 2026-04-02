import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "CCC Barber Academy",
  description: "Book your next haircut at Carteret Community College Barber Academy.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-[#f8fbfd] text-gray-900">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
