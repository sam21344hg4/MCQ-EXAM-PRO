import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  LockKeyhole,
  Maximize2,
  Menu,
  Minimize2,
  Moon,
  Pause,
  Sun,
  Type,
  X,
  Layers,
  BookOpen,
  MessageSquare,
  HelpCircle,
} from "lucide-react";
import { Calculator } from "./Calculator";
import { CoordinatedLabValues } from "./CoordinatedLabValues";
import { Notes } from "./Notes";
import { useExamUI } from "./ExamUIProvider";

export interface ExamSectionMeta {
  block: number;
  itemCount: number;
  durationSeconds: number;
  completed: boolean;
}

interface ExamHeaderProps {
  currentQuestion: number;
  qid?: number | string;
  testId?: string;
  examMode?: string;
  timeRemaining: number;
  timeSpent: number;
  onPrevious: () => void;
  onNext: () => void;
  onEndBlock: () => void;
  onPause: () => void;
  showTimer: boolean;
  currentSection: number;
  totalSections: number;
  sectionStart: number;
  sectionEnd: number;
  sectionTimeLimitSeconds: number;
  dayTimeLimitSeconds: number;
  sections: ExamSectionMeta[];
  answeredInSection: number;
  markedInSection: number;
  canPrevious: boolean;
  canNext: boolean;
  note: string;
  onNoteChange: (itemId: number, note: string) => void;
  isFlagged?: boolean;
  onToggleFlag?: () => void;
  flashcardCount?: number;
  onOpenFlashcards?: () => void;
  onOpenNotebook?: () => void;
  onOpenFeedback?: () => void;
  onOpenTutorial?: () => void;
}

const formatClock = (seconds: number) => {
  const safe = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const formatLongTime = (seconds: number) => {
  const safe = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  return `${hours} hr ${minutes} min ${secs} sec`;
};

export const ExamHeader = ({
  currentQuestion,
  qid,
  testId,
  examMode = "TIMED",
  timeRemaining,
  timeSpent,
  onPrevious,
  onNext,
  onEndBlock,
  onPause,
  showTimer,
  currentSection,
  totalSections,
  sectionStart,
  sectionEnd,
  sectionTimeLimitSeconds,
  dayTimeLimitSeconds,
  sections,
  answeredInSection,
  markedInSection,
  canPrevious,
  canNext,
  note,
  onNoteChange,
  isFlagged = false,
  onToggleFlag,
  flashcardCount = 0,
  onOpenFlashcards,
  onOpenNotebook,
  onOpenFeedback,
  onOpenTutorial,
}: ExamHeaderProps) => {
  const {
    activePopup,
    openPopup,
    closePopup,
    togglePopup,
    showStrikeout,
    setShowStrikeout,
    textZoom,
    setTextZoom,
    cycleTextZoom,
    darkTheme,
    setDarkTheme,
    toggleDarkTheme,
  } = useExamUI();

  const [showResizeMenu, setShowResizeMenu] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const itemInSection = Math.max(1, currentQuestion - sectionStart + 1);
  const itemsInSection = Math.max(sectionEnd - sectionStart + 1, 0);
  const unanswered = Math.max(itemsInSection - answeredInSection, 0);
  const blockElapsed = showTimer ? Math.max(sectionTimeLimitSeconds - timeRemaining, 0) : timeSpent;
  const dayRemaining = showTimer ? Math.max(dayTimeLimitSeconds - timeSpent, 0) : 0;
  const dayElapsed = showTimer ? Math.min(timeSpent, dayTimeLimitSeconds) : timeSpent;

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  useEffect(() => {
    if (activePopup !== "settings") {
      setShowResizeMenu(false);
      setShowColorMenu(false);
    }
  }, [activePopup]);

  const confirmEndBlock = () => {
    closePopup("end");
    onEndBlock();
  };

  return (
    <>
      <header className="classic-exam-header source-exam-header" role="banner">
        {/* Left: Item Index & QID */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`classic-header-stats source-item-info-trigger ${activePopup === "overview" ? "is-open" : ""}`}
            aria-expanded={activePopup === "overview"}
            onClick={() => togglePopup("overview")}
            title="Item Information & Overview"
          >
            <span>Item: {itemInSection} of {itemsInSection}</span>
            {qid ? (
              <span className="text-[11px] font-normal opacity-90 text-[#a0e2fc]">
                Question Id: {qid}
              </span>
            ) : (
              <span>Block: {currentSection} of {totalSections}</span>
            )}
          </button>

          {/* Mark Button */}
          {onToggleFlag && (
            <button
              type="button"
              onClick={onToggleFlag}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded border transition-colors ${
                isFlagged
                  ? "bg-[#ff9800] text-white border-[#f57c00] shadow-xs"
                  : "bg-white/10 text-white/90 border-white/20 hover:bg-white/20"
              }`}
              title={isFlagged ? "Unmark Question" : "Mark Question"}
            >
              <Flag className="h-3.5 w-3.5" fill={isFlagged ? "currentColor" : "none"} />
              <span>Mark</span>
            </button>
          )}
        </div>

        {/* Center: Navigation */}
        <nav className="classic-header-navigation" aria-label="Question navigation">
          <button type="button" onClick={onPrevious} disabled={!canPrevious} title="Previous">
            <ChevronLeft aria-hidden="true" /><span>Previous</span>
          </button>
          <div className="classic-header-question-number">{itemInSection} / {itemsInSection}</div>
          <button type="button" onClick={onNext} disabled={!canNext} title="Next">
            <ChevronRight aria-hidden="true" /><span>Next</span>
          </button>
        </nav>

        {/* Right: Tools Bar */}
        <div className="classic-header-tools" aria-label="Exam tools">
          {/* Full Screen */}
          <button
            type="button"
            onClick={toggleFullScreen}
            className="hidden md:flex items-center gap-1 px-2.5 py-1 text-xs text-white/90 hover:text-white rounded hover:bg-white/10 transition-colors"
            title="Full Screen"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            <span className="hidden xl:inline">Full Screen</span>
          </button>

          {/* Tutorial / Help */}
          <button
            type="button"
            onClick={onOpenTutorial || (() => openPopup("help"))}
            className="hidden md:flex items-center gap-1 px-2.5 py-1 text-xs text-white/90 hover:text-white rounded hover:bg-white/10 transition-colors"
            title="Tutorial & Shortcuts"
          >
            <HelpCircle className="h-4 w-4 text-[#88cee7]" />
            <span className="hidden xl:inline">Tutorial</span>
          </button>

          <div className="classic-header-tool-slot"><CoordinatedLabValues /></div>
          <div className="classic-header-tool-slot"><Notes itemId={currentQuestion} notes={note} onNotesChange={onNoteChange} /></div>
          <div className="classic-header-tool-slot"><Calculator /></div>

          {/* Reverse Color (Dark/Light Mode) */}
          <button
            type="button"
            onClick={toggleDarkTheme}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-white/90 hover:text-white rounded hover:bg-white/10 transition-colors"
            title="Reverse Color / Night Mode"
          >
            {darkTheme ? <Sun className="h-4 w-4 text-amber-300" /> : <Moon className="h-4 w-4" />}
            <span className="hidden xl:inline">Reverse Color</span>
          </button>

          {/* Text Zoom */}
          <button
            type="button"
            onClick={cycleTextZoom}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-white/90 hover:text-white rounded hover:bg-white/10 transition-colors"
            title={`Text Zoom (${textZoom}%)`}
          >
            <Type className="h-4 w-4" />
            <span className="hidden xl:inline">Text Zoom</span>
            <span className="text-[10px] bg-white/20 px-1 rounded">{textZoom}%</span>
          </button>

          {/* Settings Menu */}
          <div className="classic-settings-wrap">
            <button
              type="button"
              className={`classic-header-settings ${activePopup === "settings" ? "is-open" : ""}`}
              onClick={() => togglePopup("settings")}
              aria-expanded={activePopup === "settings"}
              title="Settings"
            >
              <Menu aria-hidden="true" /><span>Settings</span>
            </button>

            {activePopup === "settings" ? (
              <div className="classic-settings-menu source-settings-menu" role="menu">
                <div className="source-settings-submenu-wrap">
                  <button type="button" role="menuitem" aria-haspopup="true" aria-expanded={showResizeMenu} onClick={() => { setShowResizeMenu((value) => !value); setShowColorMenu(false); }}>
                    <span>Resize Text</span><span className="source-settings-caret">▶</span>
                  </button>
                  {showResizeMenu ? (
                    <div className="source-settings-submenu source-resize-menu" role="menu">
                      {([100, 125, 150, 200] as const).map((zoom) => (
                        <button key={zoom} type="button" role="menuitemradio" aria-checked={textZoom === zoom} onClick={() => { setTextZoom(zoom); setShowResizeMenu(false); }}>
                          <span>{zoom}%{textZoom === zoom ? "*" : ""}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="source-settings-submenu-wrap">
                  <button type="button" role="menuitem" aria-haspopup="true" aria-expanded={showColorMenu} onClick={() => { setShowColorMenu((value) => !value); setShowResizeMenu(false); }}>
                    <span>Color Theme</span><span className="source-settings-caret">▶</span>
                  </button>
                  {showColorMenu ? (
                    <div className="source-settings-submenu source-color-menu" role="menu">
                      <button type="button" role="menuitemradio" aria-checked={!darkTheme} onClick={() => { setDarkTheme(false); setShowColorMenu(false); }}><span>Default{!darkTheme ? "*" : ""}</span></button>
                      <button type="button" role="menuitemradio" aria-checked={darkTheme} onClick={() => { setDarkTheme(true); setShowColorMenu(false); }}><span>Dark Theme{darkTheme ? "*" : ""}</span></button>
                    </div>
                  ) : null}
                </div>

                <button type="button" role="menuitemcheckbox" aria-checked={showStrikeout} onClick={() => setShowStrikeout(!showStrikeout)}>
                  <span>Show/Hide Strikeout</span>
                </button>
                <button type="button" role="menuitem" id="tools-help" onClick={onOpenTutorial || (() => openPopup("help"))}>
                  <span>Keyboard Shortcuts</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* Footer Toolbar */}
      <footer className="classic-bottom-bar source-bottom-bar flex items-center justify-between px-3" aria-label="Exam controls">
        {/* Left: Test ID and Mode */}
        <div className="classic-footer-left flex items-center gap-3">
          <div className="text-[12px] font-bold text-white/90 flex items-center gap-2">
            <span>Test Id: {testId || "200561420"}</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold tracking-wide uppercase bg-[#00897b] text-white">
              {examMode}
            </span>
          </div>

          <button type="button" className={`source-timer-trigger ${activePopup === "timer" ? "is-open" : ""}`} onClick={() => togglePopup("timer")} aria-expanded={activePopup === "timer"}>
            <span>Block Time Remaining:</span><strong>{showTimer ? formatClock(timeRemaining) : "untimed"}</strong>
            {showTimer ? <><span>Day Time Remaining:</span><strong>{formatClock(dayRemaining)}</strong></> : null}
          </button>
          <button type="button" className="classic-footer-button" onClick={onPause} title="Pause"><Pause aria-hidden="true" /><span>Pause</span></button>
        </div>

        {/* Right: UWorld Toolbar (Notebook, Flashcards, Feedback, End Block) */}
        <div className="flex items-center gap-2">
          {/* Flashcards */}
          <button
            type="button"
            onClick={onOpenFlashcards}
            className="classic-footer-button flex items-center gap-1.5 text-xs text-white"
            title="Flashcards"
          >
            <Layers className="h-4 w-4 text-[#88cee7]" />
            <span className="hidden sm:inline">Flashcards</span>
            <span className="bg-[#2196f3] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {flashcardCount}
            </span>
          </button>

          {/* Notebook */}
          <button
            type="button"
            onClick={onOpenNotebook}
            className="classic-footer-button flex items-center gap-1.5 text-xs text-white"
            title="My Notebook"
          >
            <BookOpen className="h-4 w-4 text-[#81c784]" />
            <span className="hidden sm:inline">My Notebook</span>
          </button>

          {/* Feedback */}
          <button
            type="button"
            onClick={onOpenFeedback}
            className="classic-footer-button flex items-center gap-1 text-xs text-white"
            title="Feedback"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Feedback</span>
          </button>

          {/* Lock */}
          <button type="button" className="classic-footer-button classic-lock-button" onClick={onPause} title="Lock">
            <LockKeyhole aria-hidden="true" /><span>Lock</span>
          </button>

          {/* End Block */}
          <button
            type="button"
            className={`classic-footer-button classic-end-button ${unanswered === 0 ? "is-complete" : ""}`}
            onClick={() => togglePopup("end")}
            title="End Block"
          >
            <span className="classic-end-icon">{unanswered === 0 ? <ChevronRight aria-hidden="true" /> : <X aria-hidden="true" />}</span>
            <span>End Block</span>
          </button>
        </div>
      </footer>

      {activePopup === "overview" ? (
        <section className="source-overview-panel" role="dialog" aria-modal="false" aria-labelledby="overview-title">
          <div className="source-overview-header">
            <div className="source-overview-headings">
              <h2 id="overview-title">Question Overview</h2>
              <p>Current Block: {currentSection} of {totalSections}</p>
            </div>
            <button type="button" className="source-overview-close" onClick={() => closePopup("overview")} aria-label="Close overview">
              <span className="source-overview-close-icon"><X size={30} /></span><span>Close</span>
            </button>
          </div>
          <div className="source-overview-content">
            <table className="source-overview-table" aria-label="Section status table">
              <thead>
                <tr>
                  <th scope="col">Block</th>
                  <th scope="col">Total Items</th>
                  <th scope="col">Time Limit</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {sections.map((section) => (
                  <tr key={section.block} className={section.block === currentSection ? "is-current-section" : ""}>
                    <td>Block {section.block}</td>
                    <td>{section.itemCount}</td>
                    <td>{formatLongTime(section.durationSeconds)}</td>
                    <td>{section.completed ? "Completed" : section.block === currentSection ? "In Progress" : "Not Started"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {activePopup === "timer" ? (
        <section className="source-timer-panel" role="dialog" aria-modal="false" aria-label="Timing Details">
          <div className="source-timer-header">
            <h2>Timing Details</h2>
            <button type="button" className="source-timer-close" onClick={() => closePopup("timer")} aria-label="Close timing details">
              <span className="source-overview-close-icon"><X size={30} /></span><span>Close</span>
            </button>
          </div>
          <div className="source-timer-content">
            <div className="source-timer-grid">
              <div className="source-timer-metric"><span>Block Time Remaining</span><strong>{showTimer ? formatClock(timeRemaining) : "Untimed"}</strong></div>
              <div className="source-timer-metric"><span>Block Time Used</span><strong>{formatClock(blockElapsed)}</strong></div>
              <div className="source-timer-metric"><span>Day Time Remaining</span><strong>{showTimer ? formatClock(dayRemaining) : "Untimed"}</strong></div>
              <div className="source-timer-metric"><span>Day Time Used</span><strong>{formatClock(dayElapsed)}</strong></div>
            </div>
          </div>
        </section>
      ) : null}

      {activePopup === "end" ? (
        <section className="source-end-dialog" role="dialog" aria-modal="true" aria-labelledby="end-dialog-title">
          <div className="source-end-panel">
            <div className="source-end-header">
              <h2 id="end-dialog-title">End Block Confirmation</h2>
              <button type="button" className="source-end-close" onClick={() => closePopup("end")} aria-label="Close dialog">
                <span className="source-overview-close-icon"><X size={30} /></span><span>Close</span>
              </button>
            </div>
            <div className="source-end-body">
              <p>Are you sure you want to end this block?</p>
              <div className="source-end-stats">
                <div className="source-end-stat"><span>Answered</span><strong>{answeredInSection}</strong></div>
                <div className="source-end-stat"><span>Unanswered</span><strong>{unanswered}</strong></div>
                <div className="source-end-stat"><span>Marked</span><strong>{markedInSection}</strong></div>
                <div className="source-end-stat"><span>Total Items</span><strong>{itemsInSection}</strong></div>
              </div>
              {unanswered > 0 ? (
                <div className="source-end-warning">
                  ⚠️ You have <strong>{unanswered}</strong> unanswered item{unanswered > 1 ? "s" : ""} in this block.
                </div>
              ) : null}
            </div>
            <div className="source-end-actions">
              <button type="button" className="source-end-cancel" onClick={() => closePopup("end")}>Cancel</button>
              <button type="button" className="source-end-confirm" onClick={confirmEndBlock}>Yes, End Block</button>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
};
