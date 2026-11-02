import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Contrast, Flag, Search, X, Award, BarChart2 } from "lucide-react";
import { Question } from "@/data/examQuestions";
import { OptionButton } from "./OptionButton";
import { useExamUI } from "./ExamUIProvider";
import { ContextualMenu } from "./coursology/ContextualMenu";

interface QuestionCardProps {
  question: Question;
  displayNumber: number;
  selectedAnswer: string | null;
  showExplanation: boolean;
  onSelectAnswer: (answer: string) => void;
  onNext?: () => void;
  strikethroughs: Set<string>;
  onToggleStrikethrough: (optionLabel: string) => void;
  isFlagged?: boolean;
  onFlag?: () => void;
  canMark?: boolean;
  highlights?: string[];
  onAddHighlight?: (text: string) => void;
  onRemoveHighlight?: (text: string) => void;
  onAddFlashcard?: (text: string) => void;
  onAddNotebook?: (text: string) => void;
}

type ImageTool = "invert" | "contrast" | null;

export const QuestionCard = ({
  question,
  displayNumber,
  selectedAnswer,
  showExplanation,
  onSelectAnswer,
  onNext,
  strikethroughs,
  onToggleStrikethrough,
  isFlagged = false,
  onFlag,
  canMark = true,
  highlights = [],
  onAddHighlight,
  onRemoveHighlight,
  onAddFlashcard,
  onAddNotebook,
}: QuestionCardProps) => {
  const { activePopup, openPopup, closePopup } = useExamUI();
  const isZoomOpen = activePopup === "zoom";
  const isCorrect = selectedAnswer === question.correctAnswer;
  const stemRef = useRef<HTMLDivElement>(null);
  const zoomTriggerRef = useRef<HTMLButtonElement>(null);
  const wasZoomOpenRef = useRef(false);
  const [activeImageTool, setActiveImageTool] = useState<ImageTool>(null);
  const [invertValue, setInvertValue] = useState(-100);
  const [contrastValue, setContrastValue] = useState(0);
  const [invertEnabled, setInvertEnabled] = useState(false);
  const [contrastEnabled, setContrastEnabled] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Contextual Selection Menu State
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedText, setSelectedText] = useState("");

  useEffect(() => {
    if (wasZoomOpenRef.current && !isZoomOpen) {
      setZoomLevel(1);
      zoomTriggerRef.current?.focus();
    }
    wasZoomOpenRef.current = isZoomOpen;
  }, [isZoomOpen]);

  useEffect(() => {
    setZoomLevel(1);
    setActiveImageTool(null);
    setInvertValue(-100);
    setContrastValue(0);
    setInvertEnabled(false);
    setContrastEnabled(false);
    setContextMenuPos(null);
    setSelectedText("");
    if (isZoomOpen) closePopup("zoom");
  }, [question.id]);

  const highlightedStem = useMemo(() => {
    if (highlights.length === 0) return question.stem;
    const unique = Array.from(new Set(highlights.filter(Boolean))).sort((a, b) => b.length - a.length);
    if (unique.length === 0) return question.stem;
    const escaped = unique.map((value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const matcher = new RegExp(`(${escaped.join("|")})`, "g");

    return question.stem.split(matcher).map((part, index) => {
      const matched = unique.find((value) => value === part);
      if (!matched) return <span key={`${index}-${part.slice(0, 12)}`}>{part}</span>;
      return (
        <mark
          key={`${index}-${part.slice(0, 12)}`}
          className="classic-highlight cursor-pointer"
          title="Click to remove highlight"
          onClick={(event) => {
            event.stopPropagation();
            onRemoveHighlight?.(matched);
          }}
        >
          {part}
        </mark>
      );
    });
  }, [question.stem, highlights, onRemoveHighlight]);

  const handleSelectionMouseUp = () => {
    if (isZoomOpen) return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setContextMenuPos(null);
      setSelectedText("");
      return;
    }

    const text = selection.toString().trim();
    if (text.length < 2 || text.length > 350) {
      setContextMenuPos(null);
      setSelectedText("");
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setContextMenuPos({
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
      setSelectedText(text);
    }
  };

  const invertPercent = invertEnabled ? ((invertValue + 100) / 200) * 100 : 0;
  const contrastPercent = contrastEnabled ? contrastValue + 100 : 100;
  const imageFilter = `invert(${invertPercent}%) contrast(${contrastPercent}%)`;

  const resetInvert = () => {
    setInvertValue(-100);
    setInvertEnabled(false);
  };

  const resetContrast = () => {
    setContrastValue(0);
    setContrastEnabled(false);
  };

  const openZoom = () => {
    setActiveImageTool(null);
    setZoomLevel(1);
    openPopup("zoom");
  };

  const zoomIn = () => setZoomLevel((value) => Math.min(4, Number((value + 0.25).toFixed(2))));
  const zoomOut = () => setZoomLevel((value) => Math.max(0.25, Number((value - 0.25).toFixed(2))));

  const renderSlider = (tool: Exclude<ImageTool, null>) => {
    const isInvert = tool === "invert";
    const value = isInvert ? invertValue : contrastValue;
    const enabled = isInvert ? invertEnabled : contrastEnabled;
    const setValue = isInvert ? setInvertValue : setContrastValue;
    const setEnabled = isInvert ? setInvertEnabled : setContrastEnabled;
    const min = isInvert ? -100 : 0;
    const max = 100;
    const label = isInvert ? "Invert" : "Contrast";

    return (
      <div className="source-slider-popover" role="dialog" aria-label={`${label} control`}>
        <div className="source-slider-content">
          <label className="source-slider-check">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
            <span>Enable</span>
          </label>
          <input
            type="range"
            min={min}
            max={max}
            step={1}
            value={value}
            disabled={!enabled}
            onChange={(e) => setValue(Number(e.target.value))}
            aria-label={`${label} level`}
          />
          <button
            type="button"
            className="source-slider-reset"
            onClick={isInvert ? resetInvert : resetContrast}
            disabled={!enabled && value === min}
          >
            Reset
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Contextual Selection Menu */}
      <ContextualMenu
        position={contextMenuPos}
        selectedText={selectedText}
        onHighlight={(text) => {
          onAddHighlight?.(text);
          window.getSelection()?.removeAllRanges();
          setContextMenuPos(null);
        }}
        onAddFlashcard={(text) => {
          onAddFlashcard?.(text);
          setContextMenuPos(null);
        }}
        onAddNotebook={(text) => {
          onAddNotebook?.(text);
          setContextMenuPos(null);
        }}
        onClose={() => setContextMenuPos(null)}
      />

      <motion.div
        key={question.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="classic-exam-content"
      >
        <div className="classic-stem-area" onMouseUp={handleSelectionMouseUp}>
          <div className="classic-stem-main">
            <div ref={stemRef} className="classic-stem-text">
              {highlightedStem}
            </div>

            {question.image ? (
              <figure className="classic-image-container">
                <div className="classic-image-frame">
                  <div className="classic-image-tools" role="toolbar" aria-label="Image display tools">
                    <div className="classic-image-tool-anchor">
                      <button
                        type="button"
                        aria-pressed={activeImageTool === "invert"}
                        onClick={() => setActiveImageTool((c) => (c === "invert" ? null : "invert"))}
                        title="Invert"
                      >
                        <Contrast size={29} strokeWidth={1.8} /><span>Invert</span>
                      </button>
                      {activeImageTool === "invert" ? renderSlider("invert") : null}
                    </div>

                    <div className="classic-image-tool-anchor">
                      <button
                        type="button"
                        aria-pressed={activeImageTool === "contrast"}
                        onClick={() => setActiveImageTool((c) => (c === "contrast" ? null : "contrast"))}
                        title="Contrast"
                      >
                        <Contrast size={29} strokeWidth={1.8} /><span>Contrast</span>
                      </button>
                      {activeImageTool === "contrast" ? renderSlider("contrast") : null}
                    </div>

                    <button ref={zoomTriggerRef} type="button" onClick={openZoom} title="Zoom">
                      <Search size={29} strokeWidth={1.8} /><span>Zoom</span>
                    </button>
                  </div>

                  <div className="classic-image-canvas">
                    <img src={question.image} alt={question.imageCaption || "Question image"} style={{ filter: imageFilter }} draggable={false} />
                  </div>
                </div>
                {question.imageCaption ? <figcaption>{question.imageCaption}</figcaption> : null}
              </figure>
            ) : null}
          </div>
        </div>

        {/* Answer Choices */}
        <div className="classic-options" role="radiogroup" aria-label="Answer choices">
          {question.options.map((option) => (
            <OptionButton
              key={option.label}
              label={option.label}
              text={option.text}
              isSelected={selectedAnswer === option.label}
              isCorrect={option.label === question.correctAnswer}
              showResult={showExplanation}
              onClick={() => onSelectAnswer(option.label)}
              disabled={showExplanation}
              isStrikethrough={strikethroughs.has(`${question.id}-${option.label}`)}
              onToggleStrikethrough={() => onToggleStrikethrough(option.label)}
              peerPercent={
                showExplanation
                  ? option.peerPercent ??
                    (question.peerStats ? question.peerStats[option.label] : undefined)
                  : undefined
              }
            />
          ))}
        </div>

        {!showExplanation && onNext ? (
          <div className="classic-proceed-row">
            <button type="button" className="classic-proceed-button" onClick={onNext}>
              Proceed to Next Item
            </button>
          </div>
        ) : null}

        {/* UWorld Tutor/Review Mode Explanation Box */}
        {showExplanation ? (
          <div className="mt-8 border border-[#e0e0e0] rounded-lg overflow-hidden bg-white shadow-sm" onMouseUp={handleSelectionMouseUp}>
            {/* Header / Tabs */}
            <div className="bg-[#f5f7fa] border-b border-[#e0e0e0] px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[#004976]">Explanation</span>
                {question.qid && (
                  <span className="text-xs bg-[#e3f2fd] text-[#0277bd] font-semibold px-2 py-0.5 rounded">
                    QID: {question.qid}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded ${isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                  {isCorrect ? "Correct" : `Correct Answer: ${question.correctAnswer}`}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Explanation Text */}
              {typeof question.explanation === "string" && /<[a-z][\s\S]*>/i.test(question.explanation) ? (
                <div
                  className="qbank-rich-content text-left text-sm text-[#333] leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: question.explanation }}
                />
              ) : (
                <p className="text-sm text-[#333] leading-relaxed whitespace-pre-wrap">{question.explanation}</p>
              )}

              {/* Educational Objective Box */}
              {question.educationalObjective && (
                <div className="mt-5 border-l-4 border-l-[#2196f3] bg-[#f0f7ff] p-4 rounded-r-md">
                  <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-[#0277bd] mb-1">
                    <Award className="h-4 w-4" />
                    <span>Educational Objective</span>
                  </div>
                  <p className="text-sm text-[#263238] font-medium leading-normal">
                    {question.educationalObjective}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </motion.div>

      {/* Magnified Image Modal */}
      {isZoomOpen && question.image ? (
        <section className="source-image-viewer" role="dialog" aria-modal="false" aria-label="Magnified image">
          <div className="source-viewer-toolbar" role="group" aria-label="Image zoom controls">
            <button type="button" onClick={zoomIn} disabled={zoomLevel >= 4}>Zoom In</button>
            <button type="button" onClick={zoomOut} disabled={zoomLevel <= 0.25}>Zoom Out</button>
            <button type="button" onClick={() => setZoomLevel(1)} disabled={zoomLevel === 1}>Reset</button>
          </div>
          <button type="button" className="source-viewer-close" onClick={() => closePopup("zoom")} aria-label="Close magnified image">
            <span className="source-viewer-close-icon"><X size={30} /></span><span>Close</span>
          </button>
          <div className="source-viewer-canvas">
            <div className="source-viewer-image-wrap">
              <img
                src={question.image}
                alt={question.imageCaption || "Magnified question image"}
                style={{ filter: imageFilter, width: `${90 * zoomLevel}%` }}
                draggable={false}
              />
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
};
