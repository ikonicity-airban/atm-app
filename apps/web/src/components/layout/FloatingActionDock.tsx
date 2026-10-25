'use client';

import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { ThemeToggle } from '../theme/ThemeToggle.tsx';
import { SoundToggle } from '../theme/SoundToggle.tsx';
import { WhatsAppChatModal } from '../ui/WhatsAppChatModal.tsx';
import { ShareModal } from '../ui/ShareModal.tsx';

export function FloatingActionDock() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      <aside
        aria-label="Quick Actions Dock"
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 sm:gap-2.5 p-1.5 rounded-full bg-card/85 backdrop-blur-md border border-border shadow-2xl"
      >
        {/* Desktop Sticky Theme Toggle */}
        <div className="hidden sm:block">
          <ThemeToggle variant="dropdown" />
        </div>

        {/* Desktop Sticky Sound Effects Toggle */}
        <div className="hidden sm:block">
          <SoundToggle />
        </div>

        {/* Share Button Modal */}
        <ShareModal />

        {/* Floating WhatsApp Live Chat Trigger */}
        <button
          type="button"
          onClick={() => setIsChatOpen(true)}
          aria-label="Open Ascent WhatsApp Support Chat"
          className="relative group w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          title="Chat with Ascent Dispatch on WhatsApp"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-card" />
        </button>
      </aside>

      <WhatsAppChatModal open={isChatOpen} onOpenChange={setIsChatOpen} />
    </>
  );
}
