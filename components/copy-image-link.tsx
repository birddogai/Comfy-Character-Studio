"use client";

import { useState } from "react";
import { copyImage } from "./client-api";

export function CopyImageLink({ image }: { image: string }) {
  const [label, setLabel] = useState("Copy image");
  async function copy() {
    try { await copyImage(image); setLabel("Copied"); }
    catch { setLabel("Couldn't copy, try Download"); }
  }
  return <button type="button" className="link" onClick={() => void copy()}>{label}</button>;
}
