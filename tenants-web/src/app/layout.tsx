import type { Metadata } from "next";
import "./globals.scss";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Property Manager",
  description: "Property and tenant management with utility bill tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
