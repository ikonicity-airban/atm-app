'use client';

import React, { useState } from 'react';
import { MessageSquare, Send, X, ShieldCheck, PhoneCall } from 'lucide-react';
import { BRAND } from '@atm/shared';

interface WhatsAppChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WhatsAppChatModal({ open, onOpenChange }: WhatsAppChatModalProps) {
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('Booking Assistance');
  const [reference, setReference] = useState('');
  const [message, setMessage] = useState('');

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const phone = BRAND.supportDeskWhatsapp.replace(/[^0-9]/g, '');

    const greeting = name.trim() ? `Hello, my name is ${name.trim()}.` : 'Hello Ascent Support Team.';
    const refText = reference.trim() ? ` Reference: ${reference.trim()}.` : '';
    const bodyText = message.trim() ? message.trim() : 'I would like more information on Ascent transport services.';

    const fullMessage = `${greeting} Category: [${topic}].${refText}\n\n${bodyText}`;
    const encoded = encodeURIComponent(fullMessage);
    const whatsappUrl = `https://wa.me/${phone}?text=${encoded}`;

    if (typeof window !== 'undefined') {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }
    onOpenChange(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Modal Surface */}
      <div className="relative w-full max-w-md bg-card text-card-foreground rounded-3xl border border-border p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-foreground">Ascent WhatsApp Desk</h3>
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping" />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Official verified support • Direct WhatsApp dispatch
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted transition-colors cursor-pointer"
            aria-label="Close WhatsApp chat modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Composition Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Your Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chioma Okeke"
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/30 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Help Category
              </label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
              >
                <option value="Booking Assistance">Booking Assistance</option>
                <option value="Courier Tracking">Courier &amp; Parcels</option>
                <option value="Private Charter">Private Sienna Charter</option>
                <option value="Roadside Emergency">Emergency Roadside</option>
                <option value="General Enquiries">General Enquiries</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Booking / Waybill Ref
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value.toUpperCase())}
                placeholder="ATM-XXXXXX (Optional)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/30 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Message to Support
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your question or booking details here..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/30 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>

          <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 flex items-center gap-2.5 text-[11px] text-emerald-800 dark:text-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Connects directly to {BRAND.supportDeskWhatsapp} on WhatsApp</span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-transform active:scale-95 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Launch WhatsApp Chat</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
