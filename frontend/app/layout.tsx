import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.scss";

export const metadata: Metadata = {
  title: "AI Model Playground",
  description: "Compare AI models side-by-side in real-time",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body suppressHydrationWarning>{children}</body>
      </html>
    </ClerkProvider>
  );
}
