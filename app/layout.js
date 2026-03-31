import "./globals.css";

export const metadata = {
  title: "SecureAuth | Premium Security",
  description: "A secure authentication demonstration using Next.js protecting against XSS and SQLi.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-blue-500/30 selection:text-white">
        <main className="min-h-screen flex items-center justify-center p-4">
          {children}
        </main>
      </body>
    </html>
  );
}
