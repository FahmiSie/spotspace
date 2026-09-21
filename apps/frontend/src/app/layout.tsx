import type { Metadata } from "next";
// import localFont from 'next/font/local';
import "./globals.css";
import { Providers } from "./providers";

/*
// Uncomment jika file font sudah tersedia di public/fonts/
export const abcSocial = localFont({
  src: [
    {
      path: '../../public/fonts/ABCSocial-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/ABCSocial-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/ABCSocial-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-abc-social',
  display: 'swap',
  fallback: ['Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
});
*/

export const metadata: Metadata = {
  title: "SpotSpace",
  description: "Platform pemesanan ruang kerja",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <script
          type="text/javascript"
          src="https://app.sandbox.midtrans.com/snap/snap.js"
          data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        ></script>
      </head>
      {/* className={`${abcSocial.variable} font-sans antialiased bg-stone-50 text-stone-900 min-h-screen flex flex-col`} */}
      <body className="font-sans antialiased bg-stone-50 text-stone-900 min-h-screen flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
