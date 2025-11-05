import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "FounderFinder",
  description: "Find your cofounder match",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <div className="mx-auto max-w-3xl px-4 py-8">{children}</div>
      </body>
    </html>
  );
}


