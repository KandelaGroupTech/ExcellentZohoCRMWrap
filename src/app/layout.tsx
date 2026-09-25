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
        <head>
          {/* Standard favicon */}
          <link rel="icon" href="/favicon-crm/icon.ico" sizes="any" />
          
          {/* iOS home screen icon */}
          <link rel="apple-touch-icon" sizes="180x180" href="/favicon-crm/icon-180x180.png" />
          
          {/* iPad */}
          <link rel="apple-touch-icon" sizes="167x167" href="/favicon-crm/icon-167x167.png" />
          <link rel="apple-touch-icon" sizes="152x152" href="/favicon-crm/icon-152x152.png" />
          
          {/* Android / PWA manifest (also covers Chrome install prompt) */}
          <link rel="manifest" href="/site.webmanifest" />
          
          {/* iOS PWA behavior tags */}
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-title" content="JOB CRM" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          
          {/* Theme color for browser chrome / Android task switcher */}
          <meta name="theme-color" content="#910000" />
        </head>
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
