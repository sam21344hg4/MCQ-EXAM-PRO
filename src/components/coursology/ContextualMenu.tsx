import React from "react";
import { Highlighter, Layers, BookOpen } from "lucide-react";

interface ContextualMenuProps {
  position: { x: number; y: number } | null;
  selectedText: string;
  onHighlight: (text: string) => void;
  onAddFlashcard: (text: string) => void;
  onAddNotebook: (text: string) => void;
  onClose: () => void;
}

export const ContextualMenu: React.FC<ContextualMenuProps> = ({
  position,
  selectedText,
  onHighlight,
  onAddFlashcard,
  onAddNotebook,
  onClose,
}) => {
  if (!position || !selectedText) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${Math.max(10, position.y - 44)}px`,
        transform: "translateX(-50%)",
        zIndex: 110,
      }}
      className="bg-[#1f2937] text-white px-2 py-1 rounded-md shadow-xl flex items-center gap-1 border border-gray-700 animate-in fade-in duration-150"
      onMouseDown={(e) => e.preventDefault()} // Prevent losing selection
    >
      <button
        type="button"
        onClick={() => {
          onHighlight(selectedText);
          onClose();
        }}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium hover:bg-white/20 rounded transition-colors"
        title="Highlight Selected Text"
      >
        <Highlighter className="h-3.5 w-3.5 text-yellow-300" />
        <span>Highlight</span>
      </button>

      <span className="h-3.5 w-[1px] bg-gray-600" />

      <button
        type="button"
        onClick={() => {
          onAddFlashcard(selectedText);
          onClose();
        }}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium hover:bg-white/20 rounded transition-colors"
        title="Create Flashcard from Selection"
      >
        <Layers className="h-3.5 w-3.5 text-sky-300" />
        <span>Flashcard</span>
      </button>

      <span className="h-3.5 w-[1px] bg-gray-600" />

      <button
        type="button"
        onClick={() => {
          onAddNotebook(selectedText);
          onClose();
        }}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium hover:bg-white/20 rounded transition-colors"
        title="Add to My Notebook"
      >
        <BookOpen className="h-3.5 w-3.5 text-emerald-300" />
        <span>Notebook</span>
      </button>
    </div>
  );
};
