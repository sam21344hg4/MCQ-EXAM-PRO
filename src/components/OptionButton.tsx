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
    <div className="classic-option-row flex items-center justify-between" onContextMenu={handleContextMenu}>
      <label
        className={cn(
          "classic-option flex-1",
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

      {showResult && typeof peerPercent === "number" && (
        <span
          className={cn(
            "ml-3 px-2 py-0.5 rounded text-xs font-bold shrink-0",
            isCorrect ? "bg-green-100 text-green-800 border border-green-300" : "bg-gray-100 text-gray-700 border border-gray-200"
          )}
          title="Peer Response Rate"
        >
          {peerPercent}%
        </span>
      )}

      {!showResult && onToggleStrikethrough ? (
        <button
          type="button"
          className="classic-strike-button shrink-0"
          aria-label={isStrikethrough ? `Remove strikeout from option ${label}` : `Strike out option ${label}`}
          aria-pressed={isStrikethrough}
          title={isStrikethrough ? `Remove strikeout from option ${label}` : `Strike out option ${label}`}
          onClick={onToggleStrikethrough}
          onContextMenu={(event) => {
            event.preventDefault();
            onToggleStrikethrough();
          }}
        >
          <span className="classic-strike-glyph" aria-hidden="true">ab</span>
        </button>
      ) : null}
    </div>
  );
};
