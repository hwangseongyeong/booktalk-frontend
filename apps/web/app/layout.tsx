import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "BookTalk",
  description: "읽은 책이 하나의 서재가 되다",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
