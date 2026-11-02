import React, { useState } from "react";
import { X, Layers, Plus, RotateCw, Trash2, Check } from "lucide-react";

export interface Flashcard {
  id: string;
  qid?: number | string;
  questionNumber: number;
  front: string;
  back: string;
  createdAt: number;
}

interface FlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentQid?: number | string;
  currentQuestionNumber: number;
  flashcards: Flashcard[];
  onAddFlashcard: (card: Omit<Flashcard, "id" | "createdAt">) => void;
  onDeleteFlashcard: (id: string) => void;
  prefillFront?: string;
}

export const FlashcardModal: React.FC<FlashcardModalProps> = ({
  isOpen,
  onClose,
  currentQid,
  currentQuestionNumber,
  flashcards,
  onAddFlashcard,
  onDeleteFlashcard,
  prefillFront = "",
}) => {
  const [activeTab, setActiveTab] = useState<"current" | "all" | "new">(
    prefillFront ? "new" : "current"
  );
  const [frontText, setFrontText] = useState(prefillFront);
  const [backText, setBackText] = useState("");
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const currentCards = flashcards.filter(
    (c) => c.qid === currentQid || c.questionNumber === currentQuestionNumber
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!frontText.trim()) return;
    onAddFlashcard({
      qid: currentQid,
      questionNumber: currentQuestionNumber,
      front: frontText.trim(),
      back: backText.trim(),
    });
    setFrontText("");
    setBackText("");
    setActiveTab("current");
  };

  const toggleFlip = (id: string) => {
    setFlippedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-xl flex flex-col max-h-[85vh] border border-[#ddd] overflow-hidden text-[#333]">
        {/* Header */}
        <div className="bg-[#004976] text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-[15px]">
            <Layers className="h-5 w-5 text-[#88cee7]" />
            <span>UWorld Flashcards</span>
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

        {/* Tab Navigation */}
        <div className="flex border-b border-[#e5e5e5] bg-[#f8f9fa] px-4 pt-2 text-sm font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("current")}
            className={`py-2 px-3 border-b-2 transition-colors ${
              activeTab === "current"
                ? "border-[#2196f3] text-[#2196f3]"
                : "border-transparent text-[#666] hover:text-[#333]"
            }`}
          >
            This Question ({currentCards.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`py-2 px-3 border-b-2 transition-colors ${
              activeTab === "all"
                ? "border-[#2196f3] text-[#2196f3]"
                : "border-transparent text-[#666] hover:text-[#333]"
            }`}
          >
            All Cards ({flashcards.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("new")}
            className={`py-2 px-3 border-b-2 ml-auto flex items-center gap-1.5 transition-colors ${
              activeTab === "new"
                ? "border-[#2196f3] text-[#2196f3]"
                : "border-transparent text-[#2196f3] hover:underline"
            }`}
          >
            <Plus className="h-4 w-4" />
            <span>Create Card</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === "new" && (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-[#555] mb-1">
                  Card Front (Prompt / Keyword)
                </label>
                <textarea
                  value={frontText}
                  onChange={(e) => setFrontText(e.target.value)}
                  placeholder="e.g. Hypothyroidism classic findings..."
                  rows={3}
                  className="w-full border border-[#ccc] rounded p-2.5 text-sm outline-none focus:border-[#2196f3] focus:ring-1 focus:ring-[#2196f3]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#555] mb-1">
                  Card Back (Explanation / Answer)
                </label>
                <textarea
                  value={backText}
                  onChange={(e) => setBackText(e.target.value)}
                  placeholder="e.g. Elevated TSH, decreased free T4, fatigue, delayed reflex relaxation..."
                  rows={4}
                  className="w-full border border-[#ccc] rounded p-2.5 text-sm outline-none focus:border-[#2196f3] focus:ring-1 focus:ring-[#2196f3]"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("current")}
                  className="px-4 py-2 text-sm text-[#666] hover:bg-gray-100 rounded border border-[#ddd]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold bg-[#2196f3] hover:bg-[#1976d2] text-white rounded transition-colors"
                >
                  Save Flashcard
                </button>
              </div>
            </form>
          )}

          {activeTab !== "new" && (
            <div className="space-y-3">
              {(activeTab === "current" ? currentCards : flashcards).length === 0 ? (
                <div className="text-center py-12 text-[#888]">
                  <Layers className="h-10 w-10 mx-auto text-[#ccc] mb-2" />
                  <p className="font-medium text-[15px]">No flashcards yet.</p>
                  <p className="text-xs text-[#999] mt-1">
                    Highlight question text or click "Create Card" to add your first study card.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("new")}
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[#2196f3] rounded hover:bg-[#1976d2]"
                  >
                    <Plus className="h-3.5 w-3.5" /> Create Flashcard
                  </button>
                </div>
              ) : (
                (activeTab === "current" ? currentCards : flashcards).map((card) => {
                  const isFlipped = !!flippedCards[card.id];
                  return (
                    <div
                      key={card.id}
                      className="border border-[#e0e0e0] rounded-lg p-4 bg-white shadow-sm hover:shadow transition-shadow flex flex-col justify-between min-h-[140px]"
                    >
                      <div className="flex items-center justify-between text-xs text-[#888] pb-2 border-b border-[#f0f0f0] mb-2">
                        <span>
                          {card.qid ? `QID: ${card.qid}` : `Item #${card.questionNumber}`}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleFlip(card.id)}
                            className="flex items-center gap-1 text-[#2196f3] hover:underline"
                          >
                            <RotateCw className="h-3.5 w-3.5" />
                            <span>{isFlipped ? "Show Front" : "Show Back"}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteFlashcard(card.id)}
                            className="text-[#e53935] hover:text-red-700 p-1"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="py-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#999]">
                          {isFlipped ? "Back:" : "Front:"}
                        </span>
                        <p className="text-[14px] font-medium text-[#222] whitespace-pre-wrap mt-1">
                          {isFlipped ? card.back : card.front}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
