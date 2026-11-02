import React from "react";
import { X, AlertTriangle } from "lucide-react";

interface EndBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  answeredCount: number;
  unansweredCount: number;
  markedCount: number;
  totalQuestions: number;
  isReviewMode?: boolean;
}

export const EndBlockModal: React.FC<EndBlockModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  answeredCount,
  unansweredCount,
  markedCount,
  totalQuestions,
  isReviewMode = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md border border-[#ddd] overflow-hidden text-[#333]">
        {/* Header */}
        <div className="bg-[#b71c1c] text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-[15px]">
            <AlertTriangle className="h-5 w-5 text-amber-300" />
            <span>{isReviewMode ? "End Review?" : "End Block Confirmation"}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-[#444] font-medium leading-relaxed">
            {isReviewMode
              ? "Are you sure you want to exit the review session and return to the main dashboard?"
              : "Are you sure you want to end this block? You will not be able to change answers after ending."}
          </p>

          <div className="bg-[#f5f5f5] rounded-lg p-4 grid grid-cols-3 gap-2 text-center border border-[#e0e0e0]">
            <div className="p-2 bg-white rounded shadow-2xs">
              <div className="text-xl font-bold text-[#2e7d32]">{answeredCount}</div>
              <div className="text-[11px] font-semibold text-[#666] uppercase mt-0.5">Answered</div>
            </div>
            <div className="p-2 bg-white rounded shadow-2xs">
              <div className="text-xl font-bold text-[#c62828]">{unansweredCount}</div>
              <div className="text-[11px] font-semibold text-[#666] uppercase mt-0.5">Unanswered</div>
            </div>
            <div className="p-2 bg-white rounded shadow-2xs">
              <div className="text-xl font-bold text-[#f57c00]">{markedCount}</div>
              <div className="text-[11px] font-semibold text-[#666] uppercase mt-0.5">Marked</div>
            </div>
          </div>

          {unansweredCount > 0 && !isReviewMode && (
            <div className="text-xs text-[#c62828] bg-red-50 p-2.5 rounded border border-red-200">
              Notice: You have <strong>{unansweredCount}</strong> unanswered question{unansweredCount > 1 ? "s" : ""}.
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-semibold text-[#555] bg-gray-100 hover:bg-gray-200 rounded border border-[#ccc] transition-colors"
            >
              No, Continue
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="px-6 py-2 text-xs font-bold text-white bg-[#b71c1c] hover:bg-[#880e4f] rounded shadow-sm transition-colors"
            >
              Yes, End Block
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
