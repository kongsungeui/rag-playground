import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RAG Playground",
  description: "Cloudflare-powered RAG playground with Vectorize, D1, and R2",
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
