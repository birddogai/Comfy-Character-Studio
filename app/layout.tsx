import type { Metadata } from "next";
import "./globals.css";
import { ToastHost } from "../components/toast";
import { ConfirmationHost } from "../components/confirmation";
import { LanguageProvider } from "../components/language";

export const metadata: Metadata = {
  title: "AI Character Studio",
  description: "Create original characters with open models on ComfyUI, then dress them and put them in storyboards.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><LanguageProvider>{children}<ConfirmationHost /><ToastHost /></LanguageProvider></body>
    </html>
  );
}
