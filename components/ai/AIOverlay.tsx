"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import ChatFAB from "@/components/ai/ChatFAB";

// Lazy-load the heavy drawer so it doesn't block initial page render
const ChatDrawer = dynamic(() => import("@/components/ai/ChatDrawer"), {
  ssr: false,
});

export default function AIOverlay() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <ChatFAB onClick={() => setOpen(true)} />
      <ChatDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
