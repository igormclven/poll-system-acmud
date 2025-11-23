import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Poll System",
  description: "Serverless poll system with AWS and Vercel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
