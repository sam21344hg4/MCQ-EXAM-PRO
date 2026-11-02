import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

export type ExamPopup =
  | "lab"
  | "notes"
  | "settings"
  | "help"
  | "timer"
  | "overview"
  | "end"
  | "zoom"
  | "flashcards"
  | "notebook"
  | "feedback"
  | "tutorial"
  | null;

interface ExamUIContextValue {
  activePopup: ExamPopup;
  calculatorOpen: boolean;
  showStrikeout: boolean;
  textZoom: 100 | 125 | 150 | 200;
  darkTheme: boolean;
  openPopup: (popup: Exclude<ExamPopup, null>) => void;
  closePopup: (popup?: Exclude<ExamPopup, null>) => void;
  togglePopup: (popup: Exclude<ExamPopup, null>) => void;
  dismissAllTools: () => void;
  openCalculator: () => void;
  closeCalculator: () => void;
  toggleCalculator: () => void;
  setShowStrikeout: (show: boolean) => void;
  setTextZoom: (zoom: 100 | 125 | 150 | 200) => void;
  cycleTextZoom: () => void;
  setDarkTheme: (dark: boolean) => void;
  toggleDarkTheme: () => void;
}

const ExamUIContext = createContext<ExamUIContextValue | null>(null);

export const ExamUIProvider = ({ children }: { children: ReactNode }) => {
  const [activePopup, setActivePopup] = useState<ExamPopup>(null);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [suspendedPopup, setSuspendedPopup] = useState<ExamPopup>(null);
  const [showStrikeout, setShowStrikeout] = useState(true);
  const [textZoom, setTextZoom] = useState<100 | 125 | 150 | 200>(100);
  const [darkTheme, setDarkTheme] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("classic-show-strikeout", showStrikeout);
    return () => document.body.classList.remove("classic-show-strikeout");
  }, [showStrikeout]);

  useEffect(() => {
    document.documentElement.classList.toggle("classic-dark-theme", darkTheme);
    return () => document.documentElement.classList.remove("classic-dark-theme");
  }, [darkTheme]);

  useEffect(() => {
    document.documentElement.dataset.examTextZoom = String(textZoom);
    document.documentElement.classList.remove("zoom100", "zoom125", "zoom150", "zoom200");
    document.documentElement.classList.add(`zoom${textZoom}`);
    return () => {
      delete document.documentElement.dataset.examTextZoom;
      document.documentElement.classList.remove("zoom100", "zoom125", "zoom150", "zoom200");
    };
  }, [textZoom]);

  const openPopup = (popup: Exclude<ExamPopup, null>) => {
    if (popup === "zoom") {
      setSuspendedPopup(activePopup === "lab" ? "lab" : null);
      setActivePopup("zoom");
      setCalculatorOpen(false);
      return;
    }

    setSuspendedPopup(null);
    setActivePopup(popup);
    if (popup !== "notes") setCalculatorOpen(false);
  };

  const closePopup = (popup?: Exclude<ExamPopup, null>) => {
    setActivePopup((current) => {
      if (popup && current !== popup) return current;
      if (current === "zoom" && suspendedPopup === "lab") {
        setSuspendedPopup(null);
        return "lab";
      }
      setSuspendedPopup(null);
      return null;
    });
  };

  const dismissAllTools = () => {
    setSuspendedPopup(null);
    setActivePopup(null);
    setCalculatorOpen(false);
  };

  const togglePopup = (popup: Exclude<ExamPopup, null>) => {
    if (activePopup === popup) closePopup(popup);
    else openPopup(popup);
  };

  const openCalculator = () => {
    if (activePopup !== "notes") setActivePopup(null);
    setSuspendedPopup(null);
    setCalculatorOpen(true);
  };

  const closeCalculator = () => setCalculatorOpen(false);

  const toggleCalculator = () => {
    if (calculatorOpen) closeCalculator();
    else openCalculator();
  };

  const cycleTextZoom = () => {
    setTextZoom((current) => {
      if (current === 100) return 125;
      if (current === 125) return 150;
      if (current === 150) return 200;
      return 100;
    });
  };

  const toggleDarkTheme = () => {
    setDarkTheme((current) => !current);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (activePopup === "notes") return;

      if (activePopup) {
        event.preventDefault();
        closePopup(activePopup);
        return;
      }

      if (calculatorOpen) {
        event.preventDefault();
        setCalculatorOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activePopup, calculatorOpen, suspendedPopup]);

  const value = useMemo<ExamUIContextValue>(() => ({
    activePopup,
    calculatorOpen,
    showStrikeout,
    textZoom,
    darkTheme,
    openPopup,
    closePopup,
    togglePopup,
    dismissAllTools,
    openCalculator,
    closeCalculator,
    toggleCalculator,
    setShowStrikeout,
    setTextZoom,
    cycleTextZoom,
    setDarkTheme,
    toggleDarkTheme,
  }), [activePopup, calculatorOpen, showStrikeout, textZoom, darkTheme, suspendedPopup]);

  return <ExamUIContext.Provider value={value}>{children}</ExamUIContext.Provider>;
};

export const useExamUI = () => {
  const context = useContext(ExamUIContext);
  if (!context) throw new Error("useExamUI must be used inside ExamUIProvider");
  return context;
};
