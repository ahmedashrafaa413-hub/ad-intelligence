import "./globals.css";

export const metadata = {
  title: "AdIntelligence",
  description: "AI-powered marketing intelligence platform"
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
