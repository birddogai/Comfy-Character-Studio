"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { translate, type Locale } from "../lib/messages";
const LanguageContext = createContext<{ locale: Locale; setLocale: (value: Locale) => void }>({ locale: "en", setLocale: () => {} });
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");
  useEffect(() => {
    try { const saved = localStorage.getItem("studio-language"); if (saved === "es" || saved === "zh-CN" || saved === "en") { setLocale(saved); document.documentElement.lang = saved; } } catch {}
  }, []);
  function change(value: Locale) { setLocale(value); document.documentElement.lang = value; try { localStorage.setItem("studio-language", value); } catch {} }
  return <LanguageContext.Provider value={{ locale, setLocale: change }}>{children}</LanguageContext.Provider>;
}
export function useLanguage() { const context = useContext(LanguageContext); return { ...context, t: (text: string) => translate(context.locale, text) }; }
export function LanguageSelect() {
  const { locale, setLocale, t } = useLanguage();
  return <label className="language-select"><span>{t("Language")}</span><select value={locale} onChange={event => setLocale(event.target.value as Locale)}><option value="en">English</option><option value="es">Español</option><option value="zh-CN">简体中文</option></select></label>;
}
