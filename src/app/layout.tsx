import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "拾迹 - 个人知识库",
  description: "记录 · 整理 · 回忆",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
