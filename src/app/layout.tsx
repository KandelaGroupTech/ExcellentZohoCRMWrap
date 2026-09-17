import localFont from "next/font/local";
import { Inter, Outfit } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import ReactQueryProvider from '@/providers/ReactQueryProvider';
import { Toaster } from 'react-hot-toast';
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const outfit = Outfit({ subsets: ["latin"], variable: '--font-outfit' });

export const metadata = {
  title: "Journey Office Builders",
  description: "Tenant improvements, delivered right the first time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.variable} ${outfit.variable} font-sans`}>
          <ReactQueryProvider>
            {children}
            <Toaster position="bottom-right" />
          </ReactQueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
