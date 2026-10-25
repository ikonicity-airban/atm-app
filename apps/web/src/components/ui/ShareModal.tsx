'use client';

import React, { useState } from 'react';
import { Share2, Copy, Check, X, MessageSquare } from 'lucide-react';

interface ShareModalProps {
  title?: string;
  url?: string;
  description?: string;
}

export function ShareModal({
  title = 'Ascent Transport Management (ATM Nigeria)',
  url,
  description = 'Executive 5 seat Toyota Sienna passenger transport and express courier logistics across Nigeria.',
}: ShareModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const getShareUrl = () => {
    if (url) return url;
    if (typeof window !== 'undefined') return window.location.href;
    return 'https://ascent.ng';
  };

  const handleShareClick = async () => {
    const shareUrl = getShareUrl();
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url: shareUrl,
        });
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }
    setIsOpen(true);
  };

  const handleCopyLink = () => {
    const shareUrl = getShareUrl();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const shareToWhatsApp = () => {
    const shareUrl = getShareUrl();
    const text = encodeURIComponent(`${title}\n${description}\n${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  const shareToTwitter = () => {
    const shareUrl = getShareUrl();
    const text = encodeURIComponent(`${title} — ${description}`);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  const shareToFacebook = () => {
    const shareUrl = getShareUrl();
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(fbUrl, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleShareClick}
        aria-label="Share page to social media"
        className="w-10 h-10 rounded-full bg-card hover:bg-muted text-foreground border border-border shadow-md flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
        title="Share this page"
      >
        <Share2 className="w-4 h-4 text-muted-foreground hover:text-foreground" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-sm bg-card text-card-foreground rounded-3xl border border-border p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-sm font-bold text-foreground">Share this Page</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground my-3">
              Share intercity trip schedules, tracking updates, and route manifests with companions.
            </p>

            <div className="grid grid-cols-3 gap-2.5 my-4">
              <button
                type="button"
                onClick={shareToWhatsApp}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold gap-1.5 cursor-pointer transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={shareToTwitter}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-400 border border-sky-500/20 text-xs font-semibold gap-1.5 cursor-pointer transition-colors"
              >
                <span className="font-bold text-sm">𝕏</span>
                <span>X / Twitter</span>
              </button>

              <button
                type="button"
                onClick={shareToFacebook}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-500/20 text-xs font-semibold gap-1.5 cursor-pointer transition-colors"
              >
                <span className="font-bold text-sm">f</span>
                <span>Facebook</span>
              </button>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <input
                type="text"
                readOnly
                value={getShareUrl()}
                className="flex-1 px-3 py-2 text-xs bg-muted/40 border border-border rounded-xl text-muted-foreground font-mono truncate"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
