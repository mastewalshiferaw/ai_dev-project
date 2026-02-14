import "./globals.css"; // Ensure your Tailwind/CSS is imported

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* This "children" is where your /login page or /chat page will be injected */}
        {children}
      </body>
    </html>
  );
}