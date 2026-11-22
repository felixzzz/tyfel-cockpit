"use client";

import React from "react";
import Link from "next/link";
import { buildWhatsAppLink } from "@/lib/catering-whatsapp";
import type { WhatsAppModalState } from "./types";
import {
  MessageSquare,
  Users,
  Smartphone,
  ExternalLink,
  Copy,
  Check,
  Send,
  X,
} from "lucide-react";

export interface CateringWhatsAppModalProps {
  waModal: WhatsAppModalState;
  setWaModal: React.Dispatch<React.SetStateAction<WhatsAppModalState>>;
  copiedNotice: boolean;
  onCopy: (text: string, label: string) => void;
  onClose: () => void;
}

export function CateringWhatsAppModal({
  waModal,
  setWaModal,
  copiedNotice,
  onCopy,
  onClose,
}: CateringWhatsAppModalProps) {
  if (!waModal.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="cockpit-panel rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl border border-[var(--border-strong)]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)] font-display">
                {waModal.title}
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                {waModal.subtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Recipient Info Card */}
        <div className="p-3 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <div>
              <div className="font-bold text-[var(--text-primary)]">
                {waModal.recipientName}
              </div>
              <div className="text-[11px] font-mono text-[var(--text-muted)]">
                {waModal.recipientPhone || "No phone number registered"}
              </div>
            </div>
          </div>
          <span className="badge-emerald px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold">
            WhatsApp Ready
          </span>
        </div>

        {/* Message Preview & Quick Edit */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-secondary)] uppercase font-semibold">
            <span>Message Content (Editable)</span>
            <span className="text-[10px] normal-case text-[var(--text-muted)]">
              Formatted for WhatsApp
            </span>
          </div>
          <textarea
            rows={9}
            value={waModal.messageText}
            onChange={(e) =>
              setWaModal((prev) => ({
                ...prev,
                messageText: e.target.value,
              }))
            }
            className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] font-mono leading-relaxed resize-y focus:outline-hidden focus:border-[var(--accent-primary)]"
          />
        </div>

        {/* If portal link exists, show quick preview button */}
        {waModal.portalUrl && (
          <div className="p-2.5 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 truncate text-[11px] text-[var(--text-secondary)]">
              <Smartphone className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0" />
              <span className="truncate">{waModal.portalUrl}</span>
            </div>
            <Link
              href={waModal.portalUrl}
              target="_blank"
              className="px-2.5 py-1 rounded-lg bg-[var(--bg-surface-3)] hover:bg-[var(--bg-surface-2)] text-[10px] font-semibold text-[var(--text-primary)] inline-flex items-center gap-1 shrink-0"
            >
              <span>Test Portal</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={() =>
              onCopy(
                waModal.messageText,
                `WhatsApp message for ${waModal.recipientName}`
              )
            }
            className="px-3.5 py-2 rounded-xl bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] text-xs font-semibold text-[var(--text-secondary)] inline-flex items-center gap-1.5 cursor-pointer"
          >
            {copiedNotice ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-500 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Text</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                const url = buildWhatsAppLink(
                  waModal.recipientPhone,
                  waModal.messageText
                );
                window.open(url, "_blank");
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Open WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
