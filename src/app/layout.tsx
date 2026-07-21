import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import { Sidebar } from "@/components/layout/sidebar";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Chat",
  description: "Chat app",
};

// Chạy trước hydration để tránh flash sai theme: đọc localStorage override
// nếu có, else fallback OS preference. Đồng bộ với useTheme() ở client.
const THEME_INIT_SCRIPT = `
  (function() {
    try {
      var stored = localStorage.getItem("chat_theme");
      var isDark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (isDark) document.documentElement.classList.add("dark");
    } catch (e) {}
  })();
`;

// suppressHydrationWarning trên <html>: script bên dưới thêm class "dark"
// TRƯỚC khi React hydrate xong (đọc localStorage/OS preference để tránh
// flash sai theme) — làm className thực tế khác với SSR output. Đây là
// pattern chuẩn cho dark-mode toggle (next-themes cũng làm vậy), chỉ cảnh
// báo ở đúng element này, không tắt hydration check toàn trang.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={plusJakarta.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="h-screen overflow-hidden bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <Providers>
          <div className="flex h-screen">
            <Sidebar />
            <main className="flex-1 flex flex-col min-w-0 min-h-0">{children}</main>
          </div>
        </Providers>
        <Toaster position="bottom-right" toastOptions={{ duration: 2000 }} />
      </body>
    </html>
  );
}
