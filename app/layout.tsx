import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Thư Mời Tham Dự Lễ Bảo Vệ Đồ Án Tốt Nghiệp",
  description: "Trân trọng kính mời bạn tham dự buổi lễ bảo vệ đồ án tốt nghiệp đại học.",
  openGraph: {
    title: "Thư Mời Tốt Nghiệp",
    description: "Bạn được mời tham dự lễ bảo vệ đồ án tốt nghiệp",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;0,800;1,400;1,600&family=Alex+Brush&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Dancing+Script:wght@600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
