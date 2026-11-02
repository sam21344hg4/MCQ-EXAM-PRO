import React, { useState } from "react";
import { X, MessageSquare, CheckCircle2 } from "lucide-react";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentQid?: number | string;
  currentQuestionNumber: number;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  currentQid,
  currentQuestionNumber,
}) => {
  const [feedbackType, setFeedbackType] = useState<"content" | "explanation" | "technical">("content");
  const [comments, setComments] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comments.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setComments("");
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg border border-[#ddd] overflow-hidden text-[#333]">
        {/* Header */}
        <div className="bg-[#004976] text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-[15px]">
            <MessageSquare className="h-5 w-5 text-[#88cee7]" />
            <span>Submit Feedback</span>
            {currentQid && (
              <span className="text-[12px] font-normal text-white/80 bg-white/20 px-2 py-0.5 rounded">
                QID: {currentQid}
              </span>
            )}
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
        <div className="p-6">
          {submitted ? (
            <div className="text-center py-8 space-y-3">
              <CheckCircle2 className="h-12 w-12 text-[#4caf50] mx-auto" />
              <h3 className="text-lg font-bold text-[#222]">Feedback Received</h3>
              <p className="text-sm text-[#666]">
                Thank you! Your feedback for Question {currentQid || currentQuestionNumber} has been logged.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-[#555] mb-2">
                  Feedback Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFeedbackType("content")}
                    className={`py-2 px-2 text-xs font-semibold rounded border text-center transition-colors ${
                      feedbackType === "content"
                        ? "bg-[#2196f3] text-white border-[#2196f3]"
                        : "bg-white text-[#666] border-[#ddd] hover:bg-gray-50"
                    }`}
                  >
                    Question Stem
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackType("explanation")}
                    className={`py-2 px-2 text-xs font-semibold rounded border text-center transition-colors ${
                      feedbackType === "explanation"
                        ? "bg-[#2196f3] text-white border-[#2196f3]"
                        : "bg-white text-[#666] border-[#ddd] hover:bg-gray-50"
                    }`}
                  >
                    Explanation
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackType("technical")}
                    className={`py-2 px-2 text-xs font-semibold rounded border text-center transition-colors ${
                      feedbackType === "technical"
                        ? "bg-[#2196f3] text-white border-[#2196f3]"
                        : "bg-white text-[#666] border-[#ddd] hover:bg-gray-50"
                    }`}
                  >
                    Software / Tech
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#555] mb-1">
                  Comments & Details
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Describe any issues, clarification needed, or suggestion..."
                  rows={4}
                  className="w-full border border-[#ccc] rounded p-2.5 text-sm outline-none focus:border-[#2196f3]"
                  required
                />
              </div>

              <div className="text-[11px] text-[#888] bg-[#f9f9f9] p-2.5 rounded border border-[#eee]">
                Item #{currentQuestionNumber} {currentQid ? `| Question ID: ${currentQid}` : ""} will be automatically attached to this submission.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs text-[#666] border border-[#ddd] rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-[#2196f3] text-white rounded hover:bg-[#1976d2] transition-colors"
                >
                  Submit Feedback
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
