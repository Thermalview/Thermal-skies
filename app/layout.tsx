import "./globals.css";
import { ForecastProvider } from "./context/ForecastContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ForecastProvider>{children}</ForecastProvider>
      </body>
    </html>
  );
}
