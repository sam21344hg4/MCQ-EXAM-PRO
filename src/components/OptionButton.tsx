import type { MouseEvent } from "react";
import { cn } from "@/lib/utils";

interface OptionButtonProps {
  label: string;
  text: string;
  isSelected: boolean;
  isCorrect: boolean;
  showResult: boolean;
  onClick: () => void;
  disabled?: boolean;
  isStrikethrough?: boolean;
  onToggleStrikethrough?: () => void;
  peerPercent?: number;
}

export const OptionButton = ({
  label,
  text,
  isSelected,
  isCorrect,
  showResult,
  onClick,
  disabled,
  isStrikethrough = false,
  onToggleStrikethrough,
  peerPercent,
}: OptionButtonProps) => {
  const handleContextMenu = (event: MouseEvent<HTMLElement>) => {
    if (showResult || !onToggleStrikethrough) return;
    event.preventDefault();
    onToggleStrikethrough();
  };

  return (
    <div
      className="classic-option-row flex items-center justify-between"
      onContextMenu={handleContextMenu}
    >
      <label
        className={cn(
          "classic-option flex-1 cursor-pointer",
          isSelected && "is-selected",
          showResult && isCorrect && "is-correct",
          showResult && isSelected && !isCorrect && "is-incorrect",
          isStrikethrough && !showResult && "is-struck"
        )}
      >
        <input
          className="classic-radio-input"
          type="radio"
          name="classic-exam-answer"
          checked={isSelected}
          onChange={onClick}
          disabled={disabled}
          aria-label={`Option ${label}`}
        />
        <span className={cn("classic-option-text", isStrikethrough && !showResult && "is-struck")}>
          <strong>{label}.</strong> {text}
        </span>
      </label>

      {/* Peer Response Rate in Review / Explanation Mode */}
      {showResult && typeof peerPercent === "number" && (
        <span
          className={cn(
            "ml-3 px-2 py-0.5 rounded text-xs font-bold shrink-0",
            isCorrect
              ? "bg-green-100 text-green-800 border border-green-300"
              : "bg-gray-100 text-gray-700 border border-gray-200"
          )}
          title="Peer Response Rate"
        >
          {peerPercent}%
        </span>
      )}

      {/* Struck Indicator / Unstrike Button: only shows when an option is struck out */}
      {!showResult && onToggleStrikethrough && isStrikethrough ? (
        <button
          type="button"
          onClick={onToggleStrikethrough}
          className="ml-3 px-2 py-0.5 text-[11px] font-semibold text-gray-400 hover:text-red-600 border border-gray-200 hover:border-red-300 rounded shrink-0 transition-colors"
          title={`Remove strikethrough from option ${label}`}
          aria-label={`Remove strikethrough from option ${label}`}
        >
          Restore
        </button>
      ) : null}
    </div>
  );
};
