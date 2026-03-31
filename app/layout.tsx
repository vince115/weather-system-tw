import './globals.css';
import { Providers } from './providers';

export const metadata = {
  title: 'Taiwan Weather System (Manual)',
  description: 'Manual Next.js project setup',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
