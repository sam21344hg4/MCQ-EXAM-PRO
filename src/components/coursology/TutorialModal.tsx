import React from "react";
import { X, HelpCircle, Command } from "lucide-react";

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: "J / ←", desc: "Navigate to Previous Question" },
    { key: "K / →", desc: "Navigate to Next Question" },
    { key: "1 - 5 / A - E", desc: "Select Answer Choice" },
    { key: "M", desc: "Toggle Mark / Flag Question" },
    { key: "H", desc: "Highlight Selected Text" },
    { key: "L", desc: "Open / Close Lab Values" },
    { key: "N", desc: "Open / Close Question Notes" },
    { key: "C", desc: "Open / Close Calculator" },
    { key: "R", desc: "Toggle Inverted / Dark Theme" },
    { key: "Z", desc: "Cycle Text Zoom (100% → 125% → 150%)" },
    { key: "Esc", desc: "Close Active Dialog / Popup" },
  ];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg border border-[#ddd] overflow-hidden text-[#333]">
        {/* Header */}
        <div className="bg-[#004976] text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-[15px]">
            <HelpCircle className="h-5 w-5 text-[#88cee7]" />
            <span>Tutorial & Keyboard Shortcuts</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded transition-colors"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="flex items-center gap-2 text-xs font-bold text-[#555] uppercase mb-3">
            <Command className="h-4 w-4 text-[#2196f3]" />
            <span>Essential Exam Shortcuts</span>
          </div>

          <div className="border border-[#e0e0e0] rounded-lg divide-y divide-[#eee] overflow-hidden">
            {shortcuts.map((s, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 text-xs">
                <span className="font-semibold text-[#333]">{s.desc}</span>
                <kbd className="px-2 py-1 bg-[#f4f5f7] border border-[#d1d5db] rounded font-mono font-bold text-[#111] shadow-xs">
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>

          <div className="mt-5 p-3 bg-[#e3f2fd] rounded-lg text-xs text-[#0277bd] space-y-1">
            <div className="font-bold">Text Highlight & Tools:</div>
            <div>Select any text in the question stem or explanation to instantly highlight or create flashcards.</div>
          </div>

          <div className="flex justify-end pt-5">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-xs font-semibold bg-[#2196f3] text-white rounded hover:bg-[#1976d2] transition-colors"
            >
              Got It
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
