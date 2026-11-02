import { useCallback, useEffect, useMemo, useState } from "react";
import { availableExams, ExamData } from "@/data/exams";
import { StartScreen } from "@/components/StartScreen";
import { ExamHeader, ExamSectionMeta } from "@/components/ExamHeader";
import { QuestionCard } from "@/components/QuestionCard";
import { QuestionStatusPanel } from "@/components/QuestionStatusPanel";
import { ExamSummary } from "@/components/ExamSummary";
import { BlockReview } from "@/components/BlockReview";
import { useExamUI } from "@/components/ExamUIProvider";
import { CreateTest, GeneratedTestConfig } from "@/components/coursology/CreateTest";
import { FlashcardModal, Flashcard } from "@/components/coursology/FlashcardModal";
import { NotebookModal, NotebookEntry } from "@/components/coursology/NotebookModal";
import { FeedbackModal } from "@/components/coursology/FeedbackModal";
import { TutorialModal } from "@/components/coursology/TutorialModal";

type ExamMode = "start" | "timed" | "practice" | "complete" | "review" | "create-test";

const Index = () => {
  const [currentTestId, setCurrentTestId] = useState<string>("200561420");
  const [testSubMode, setTestSubMode] = useState<string>("TIMED");

  // Flashcards state with LocalStorage persistence
  const [flashcards, setFlashcards] = useState<Flashcard[]>(() => {
    try {
      const saved = localStorage.getItem("medimedia_flashcards");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Notebook state with LocalStorage persistence
  const [notebookEntries, setNotebookEntries] = useState<NotebookEntry[]>(() => {
    try {
      const saved = localStorage.getItem("medimedia_notebook");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [flashcardPrefill, setFlashcardPrefill] = useState<string>("");
  const [notebookPrefill, setNotebookPrefill] = useState<string>("");

  const handleStartGeneratedTest = useCallback(async (config: GeneratedTestConfig) => {
    try {
      const generatedId = String(Math.floor(100000000 + Math.random() * 900000000));
      setCurrentTestId(generatedId);
      setTestSubMode(config.testMode.toUpperCase());

      const loadedQuestions = await Promise.all(
        config.questions.map(async (meta, index) => {
          try {
            const res = await fetch(`/qbank/q_${meta.id}.json`);
            if (res.ok) {
              const data = await res.json();
              return {
                id: index + 1, // 1-based sequential index for engine navigation
                qid: meta.id,  // Authentic database QID (e.g. 19624)
                subject: meta.subject,
                system: meta.system,
                topic: meta.topic,
                stem: data.stem || `Question ID: ${meta.id} - ${meta.topic}`,
                options: data.options || [],
                correctAnswer: data.correctAnswer || meta.correctAnswer || "A",
                explanation: data.explanation || "",
                educationalObjective: data.educationalObjective || "",
                image: data.image,
                imageCaption: data.imageCaption,
                peerStats: meta.peerCorrect ? { [meta.correctAnswer]: Math.round(Number(meta.peerCorrect)) } : undefined,
              };
            }
          } catch (e) {
            console.error("Failed to load question", meta.id, e);
          }
          return {
            id: index + 1,
            qid: meta.id,
            subject: meta.subject,
            system: meta.system,
            topic: meta.topic,
            stem: `Question ID: ${meta.id} - ${meta.topic}`,
            options: [
              { label: "A", text: "Option A" },
              { label: "B", text: "Option B" },
              { label: "C", text: "Option C" },
              { label: "D", text: "Option D" },
            ],
            correctAnswer: meta.correctAnswer || "A",
            explanation: `Topic: ${meta.topic} (${meta.subject})`,
            educationalObjective: `Understanding ${meta.topic}.`,
            peerStats: meta.peerCorrect ? { [meta.correctAnswer]: Math.round(Number(meta.peerCorrect)) } : undefined,
          };
        })
      );

      const customExam: ExamData = {
        id: `qbank-custom-${generatedId}`,
        title: config.testName,
        section: "USMLE Step 1 QBank",
        totalQuestions: loadedQuestions.length,
        timeLimit: Math.max(1, Math.round(loadedQuestions.length * 1.5)),
        sections: [
          {
            itemCount: loadedQuestions.length,
            timeLimitMinutes: Math.max(1, Math.round(loadedQuestions.length * 1.5)),
          },
        ],
        questions: loadedQuestions,
      };

      setSelectedExam(customExam);
      setAnswers({});
      setFlagged(new Set());
      setNotes({});
      setHighlights({});
      setStrikethroughs(new Set());
      setCurrentQuestion(1);
      setCurrentSection(1);
      setTimeSpent(0);
      setTimeRemaining(customExam.timeLimit * 60);
      setShowExplanation(config.testMode === "tutor");
      setShowBlockReview(false);
      setIsPaused(false);
      setMode(config.testMode === "tutor" ? "practice" : "timed");
    } catch (err) {
      console.error("Error generating test:", err);
    }
  }, []);

  const { activePopup, openPopup, closePopup, closeCalculator } = useExamUI();
  const [selectedExam, setSelectedExam] = useState<ExamData>(availableExams[0]);
  const [mode, setMode] = useState<ExamMode>("start");
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(selectedExam.sections[0]?.timeLimitMinutes * 60 || selectedExam.timeLimit * 60);
  const [timeSpent, setTimeSpent] = useState(0);
  const [currentSection, setCurrentSection] = useState(1);
  const [strikethroughs, setStrikethroughs] = useState<Set<string>>(new Set());
  const [highlights, setHighlights] = useState<Record<number, string[]>>({});
  const [showBlockReview, setShowBlockReview] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const questions = selectedExam.questions;
  const totalQuestions = questions.length;
  const totalSections = Math.max(1, selectedExam.sections.length);

  const sectionRanges = useMemo(() => {
    let cursor = 1;
    return selectedExam.sections.map((section, index) => {
      const start = cursor;
      const declaredEnd = start + section.itemCount - 1;
      const end = Math.min(declaredEnd, totalQuestions);
      cursor = declaredEnd + 1;
      return {
        block: index + 1,
        start,
        end,
        itemCount: Math.max(end - start + 1, 0),
        durationSeconds: section.timeLimitMinutes * 60,
      };
    }).filter((section) => section.itemCount > 0);
  }, [selectedExam.sections, totalQuestions]);

  const effectiveTotalSections = Math.max(1, sectionRanges.length);

  const displayedSection = useMemo(() => {
    if (mode === "timed") return Math.min(currentSection, effectiveTotalSections);
    const found = sectionRanges.find((range) => currentQuestion >= range.start && currentQuestion <= range.end);
    return found?.block || 1;
  }, [mode, currentSection, currentQuestion, effectiveTotalSections, sectionRanges]);

  const sectionInfo = sectionRanges[displayedSection - 1] || {
    block: 1,
    start: 1,
    end: totalQuestions,
    itemCount: totalQuestions,
    durationSeconds: selectedExam.timeLimit * 60,
  };

  const question = questions.find((item) => item.id === currentQuestion) || questions[0];

  const sectionQuestions = useMemo(
    () => Array.from({ length: sectionInfo.itemCount }, (_, index) => sectionInfo.start + index),
    [sectionInfo.itemCount, sectionInfo.start]
  );

  const answeredInSection = sectionQuestions.filter((number) => answers[number] !== undefined).length;
  const markedInSection = sectionQuestions.filter((number) => flagged.has(number)).length;
  const dayTimeLimitSeconds = sectionRanges.reduce((sum, section) => sum + section.durationSeconds, 0) || selectedExam.timeLimit * 60;

  const overviewSections = useMemo<ExamSectionMeta[]>(
    () => sectionRanges.map((section) => ({
      block: section.block,
      itemCount: section.itemCount,
      durationSeconds: section.durationSeconds,
      completed: mode === "timed" ? section.block < currentSection : false,
    })),
    [sectionRanges, mode, currentSection]
  );

  const scrollExamTop = useCallback(() => {
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(".classic-exam-main")?.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
  }, []);

  const dismissTransientTools = useCallback(() => {
    if (activePopup && activePopup !== "notes") closePopup(activePopup);
    closeCalculator();
  }, [activePopup, closePopup, closeCalculator]);

  const sectionTime = useCallback((sectionNumber: number) => {
    return sectionRanges[sectionNumber - 1]?.durationSeconds || selectedExam.timeLimit * 60;
  }, [sectionRanges, selectedExam.timeLimit]);

  const sectionStart = useCallback((sectionNumber: number) => {
    return sectionRanges[sectionNumber - 1]?.start || 1;
  }, [sectionRanges]);

  const resetSessionState = useCallback(() => {
    setCurrentQuestion(1);
    setCurrentSection(1);
    setAnswers({});
    setFlagged(new Set());
    setNotes({});
    setShowExplanation(false);
    setTimeRemaining(sectionTime(1));
    setTimeSpent(0);
    setStrikethroughs(new Set());
    setHighlights({});
    setShowBlockReview(false);
    setIsPaused(false);
    dismissTransientTools();
  }, [sectionTime, dismissTransientTools]);

  useEffect(() => {
    if (mode !== "timed" || isPaused) return;
    const interval = window.setInterval(() => {
      setTimeRemaining((previous) => Math.max(previous - 1, 0));
      setTimeSpent((previous) => previous + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [mode, isPaused]);

  useEffect(() => {
    if (mode !== "timed" || timeRemaining > 0) return;

    if (currentSection < effectiveTotalSections) {
      const nextSection = currentSection + 1;
      setCurrentSection(nextSection);
      setCurrentQuestion(sectionStart(nextSection));
      setTimeRemaining(sectionTime(nextSection));
      setShowExplanation(false);
      setShowBlockReview(false);
      dismissTransientTools();
      scrollExamTop();
    } else {
      setMode("complete");
      dismissTransientTools();
    }
  }, [mode, timeRemaining, currentSection, effectiveTotalSections, sectionStart, sectionTime, dismissTransientTools, scrollExamTop]);

  useEffect(() => {
    if (mode !== "practice" || isPaused) return;
    const interval = window.setInterval(() => setTimeSpent((previous) => previous + 1), 1000);
    return () => window.clearInterval(interval);
  }, [mode, isPaused]);

  const handleSelectExam = useCallback((examId: string) => {
    const exam = availableExams.find((item) => item.id === examId);
    if (exam) {
      setSelectedExam(exam);
      setTimeRemaining(exam.sections[0]?.timeLimitMinutes * 60 || exam.timeLimit * 60);
    }
  }, []);

  const handleStart = useCallback(() => {
    resetSessionState();
    setCurrentTestId("200561420");
    setTestSubMode("TIMED");
    setMode("timed");
  }, [resetSessionState]);

  const handlePractice = useCallback(() => {
    resetSessionState();
    setCurrentTestId("200561420");
    setTestSubMode("TUTOR");
    setMode("practice");
  }, [resetSessionState]);

  const handleEndSection = useCallback(() => {
    setShowBlockReview(false);
    setIsPaused(false);
    dismissTransientTools();

    if (currentSection < effectiveTotalSections) {
      const nextSection = currentSection + 1;
      setCurrentSection(nextSection);
      setCurrentQuestion(sectionStart(nextSection));
      setTimeRemaining(sectionTime(nextSection));
      setShowExplanation(false);
      scrollExamTop();
    } else {
      setMode("complete");
    }
  }, [currentSection, effectiveTotalSections, sectionStart, sectionTime, dismissTransientTools, scrollExamTop]);

  const handleEndBlock = useCallback(() => {
    if (mode === "practice") {
      setMode("complete");
      return;
    }
    setShowBlockReview(true);
  }, [mode]);

  const handleSelectAnswer = useCallback((answer: string) => {
    if (mode === "review") return;
    const strikeKey = `${currentQuestion}-${answer}`;
    if (strikethroughs.has(strikeKey)) {
      setStrikethroughs((previous) => {
        const next = new Set(previous);
        next.delete(strikeKey);
        return next;
      });
    }
    setAnswers((previous) => ({ ...previous, [currentQuestion]: answer }));
  }, [currentQuestion, mode, strikethroughs]);

  const handleNext = useCallback(() => {
    if (showBlockReview) return;
    dismissTransientTools();

    if (mode === "timed") {
      if (currentQuestion < sectionInfo.end) {
        setCurrentQuestion((previous) => previous + 1);
        setShowExplanation(false);
        scrollExamTop();
      } else {
        setShowBlockReview(true);
      }
      return;
    }

    if (currentQuestion < totalQuestions) {
      setCurrentQuestion((previous) => previous + 1);
      setShowExplanation(mode === "review");
      scrollExamTop();
    } else if (mode !== "review") {
      setMode("complete");
    }
  }, [showBlockReview, dismissTransientTools, mode, currentQuestion, sectionInfo.end, totalQuestions, scrollExamTop]);

  const handlePrevious = useCallback(() => {
    if (showBlockReview) return;
    const lowerBound = mode === "timed" ? sectionInfo.start : 1;
    if (currentQuestion > lowerBound) {
      dismissTransientTools();
      setCurrentQuestion((previous) => previous - 1);
      setShowExplanation(mode === "review");
      scrollExamTop();
    }
  }, [showBlockReview, mode, sectionInfo.start, currentQuestion, dismissTransientTools, scrollExamTop]);

  const handleFlag = useCallback(() => {
    if (mode === "review") return;
    setFlagged((previous) => {
      const next = new Set(previous);
      if (next.has(currentQuestion)) next.delete(currentQuestion);
      else next.add(currentQuestion);
      return next;
    });
  }, [currentQuestion, mode]);

  const handleNavigate = useCallback((questionNumber: number) => {
    const lower = mode === "timed" ? sectionInfo.start : 1;
    const upper = mode === "timed" ? sectionInfo.end : totalQuestions;
    if (questionNumber < lower || questionNumber > upper) return;
    dismissTransientTools();
    setCurrentQuestion(questionNumber);
    setShowExplanation(mode === "review");
    scrollExamTop();
  }, [mode, sectionInfo.start, sectionInfo.end, totalQuestions, dismissTransientTools, scrollExamTop]);

  const handleToggleStrikethrough = useCallback((optionLabel: string) => {
    const key = `${currentQuestion}-${optionLabel}`;
    setStrikethroughs((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, [currentQuestion]);

  const handleNoteChange = useCallback((itemId: number, value: string) => {
    setNotes((previous) => {
      const next = { ...previous };
      if (value.trim()) next[itemId] = value;
      else delete next[itemId];
      return next;
    });
  }, []);

  const handleAddHighlight = useCallback((text: string) => {
    setHighlights((previous) => {
      const existing = previous[currentQuestion] || [];
      if (existing.includes(text)) return previous;
      return { ...previous, [currentQuestion]: [...existing, text] };
    });
  }, [currentQuestion]);

  const handleRemoveHighlight = useCallback((text: string) => {
    setHighlights((previous) => {
      const nextValues = (previous[currentQuestion] || []).filter((value) => value !== text);
      if (nextValues.length === 0) {
        const next = { ...previous };
        delete next[currentQuestion];
        return next;
      }
      return { ...previous, [currentQuestion]: nextValues };
    });
  }, [currentQuestion]);

  // Flashcards Handlers
  const handleAddFlashcard = useCallback((card: Omit<Flashcard, "id" | "createdAt">) => {
    const newCard: Flashcard = {
      ...card,
      id: `fc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: Date.now(),
    };
    setFlashcards((prev) => {
      const next = [newCard, ...prev];
      try {
        localStorage.setItem("medimedia_flashcards", JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const handleDeleteFlashcard = useCallback((id: string) => {
    setFlashcards((prev) => {
      const next = prev.filter((c) => c.id !== id);
      try {
        localStorage.setItem("medimedia_flashcards", JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Notebook Handlers
  const handleSaveNotebookEntry = useCallback((entry: Omit<NotebookEntry, "id" | "updatedAt"> & { id?: string }) => {
    setNotebookEntries((prev) => {
      let next: NotebookEntry[];
      if (entry.id) {
        next = prev.map((e) =>
          e.id === entry.id
            ? { ...e, title: entry.title, content: entry.content, updatedAt: Date.now() }
            : e
        );
      } else {
        const newEntry: NotebookEntry = {
          id: `nb-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          qid: entry.qid,
          questionNumber: entry.questionNumber,
          title: entry.title,
          content: entry.content,
          updatedAt: Date.now(),
        };
        next = [newEntry, ...prev];
      }
      try {
        localStorage.setItem("medimedia_notebook", JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const handleDeleteNotebookEntry = useCallback((id: string) => {
    setNotebookEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      try {
        localStorage.setItem("medimedia_notebook", JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const handleRestart = useCallback(() => {
    resetSessionState();
    setMode("start");
  }, [resetSessionState]);

  const handlePostExamReview = useCallback(() => {
    dismissTransientTools();
    setMode("review");
    setTestSubMode("REVIEW");
    setCurrentQuestion(1);
    setCurrentSection(1);
    setShowExplanation(true);
    setShowBlockReview(false);
    setIsPaused(false);
    scrollExamTop();
  }, [dismissTransientTools, scrollExamTop]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    if (mode === "start" || mode === "create-test" || mode === "complete") return;

    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input or textarea
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }

      if (e.key === "j" || e.key === "J" || e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === "k" || e.key === "K" || e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        handleFlag();
      } else if (["1", "2", "3", "4", "5"].includes(e.key)) {
        const choiceLabels = ["A", "B", "C", "D", "E"];
        const label = choiceLabels[parseInt(e.key) - 1];
        if (label && question.options.some((o) => o.label === label)) {
          e.preventDefault();
          handleSelectAnswer(label);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode, handlePrevious, handleNext, handleFlag, handleSelectAnswer, question]);

  if (mode === "create-test") {
    return <CreateTest onStartGeneratedTest={handleStartGeneratedTest} onCancel={() => setMode("start")} />;
  }

  if (mode === "start") {
    return (
      <StartScreen
        exams={availableExams}
        selectedExam={selectedExam}
        onSelectExam={handleSelectExam}
        onStart={handleStart}
        onPractice={handlePractice}
        onCreateTest={() => setMode("create-test")}
      />
    );
  }

  if (mode === "complete") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <ExamSummary questions={questions} answers={answers} timeSpent={timeSpent} onRestart={handleRestart} onReview={handlePostExamReview} />
      </div>
    );
  }

  const canPrevious = !showBlockReview && currentQuestion > (mode === "timed" ? sectionInfo.start : 1);
  const canNext = !showBlockReview && currentQuestion < (mode === "timed" ? sectionInfo.end : totalQuestions);
  const displayNumber = currentQuestion - sectionInfo.start + 1;

  return (
    <div className="classic-exam-shell">
      <a className="classic-skip-link" href="#classic-main">Skip to main</a>
      <a className="classic-skip-link" href="#classic-status">Skip to navigation</a>
      <div className="classic-visually-hidden" aria-live="assertive">Item {displayNumber} of {sectionInfo.itemCount}</div>

      <ExamHeader
        currentQuestion={currentQuestion}
        qid={question.qid}
        testId={currentTestId}
        examMode={mode === "review" ? "REVIEW" : testSubMode}
        timeRemaining={timeRemaining}
        timeSpent={timeSpent}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onEndBlock={handleEndBlock}
        onPause={() => setIsPaused(true)}
        showTimer={mode === "timed"}
        currentSection={displayedSection}
        totalSections={effectiveTotalSections}
        sectionStart={sectionInfo.start}
        sectionEnd={sectionInfo.end}
        sectionTimeLimitSeconds={sectionInfo.durationSeconds}
        dayTimeLimitSeconds={dayTimeLimitSeconds}
        sections={overviewSections}
        answeredInSection={answeredInSection}
        markedInSection={markedInSection}
        canPrevious={canPrevious}
        canNext={canNext}
        note={notes[currentQuestion] || ""}
        onNoteChange={handleNoteChange}
        isFlagged={flagged.has(currentQuestion)}
        onToggleFlag={handleFlag}
        flashcardCount={flashcards.length}
        onOpenFlashcards={() => {
          setFlashcardPrefill("");
          openPopup("flashcards");
        }}
        onOpenNotebook={() => {
          setNotebookPrefill("");
          openPopup("notebook");
        }}
        onOpenFeedback={() => openPopup("feedback")}
        onOpenTutorial={() => openPopup("tutorial")}
      />

      {!showBlockReview ? (
        <div id="classic-status">
          <QuestionStatusPanel
            sectionStart={sectionInfo.start}
            sectionEnd={sectionInfo.end}
            currentQuestion={currentQuestion}
            answers={answers}
            flagged={flagged}
            notes={notes}
            onNavigate={handleNavigate}
          />
        </div>
      ) : null}

      <main id="classic-main" className="classic-exam-main" aria-live="polite">
        {showBlockReview ? (
          <BlockReview
            sectionStart={sectionInfo.start}
            sectionEnd={sectionInfo.end}
            currentQuestion={currentQuestion}
            answers={answers}
            flagged={flagged}
            onNavigate={handleNavigate}
            onReturn={() => setShowBlockReview(false)}
            onEndBlock={handleEndBlock}
          />
        ) : (
          <QuestionCard
            question={question}
            displayNumber={displayNumber}
            selectedAnswer={answers[currentQuestion] || null}
            showExplanation={showExplanation || mode === "review"}
            onSelectAnswer={handleSelectAnswer}
            onNext={handleNext}
            strikethroughs={strikethroughs}
            onToggleStrikethrough={handleToggleStrikethrough}
            isFlagged={flagged.has(currentQuestion)}
            onFlag={handleFlag}
            canMark={mode !== "review"}
            highlights={highlights[currentQuestion] || []}
            onAddHighlight={handleAddHighlight}
            onRemoveHighlight={handleRemoveHighlight}
            onAddFlashcard={(text) => {
              setFlashcardPrefill(text);
              openPopup("flashcards");
            }}
            onAddNotebook={(text) => {
              setNotebookPrefill(text);
              openPopup("notebook");
            }}
          />
        )}
      </main>

      {/* Paused Overlay */}
      {isPaused ? (
        <div className="classic-pause-overlay fixed inset-0 z-[150] bg-black/90 flex items-center justify-center p-4">
          <section className="bg-white rounded-lg p-8 max-w-sm w-full text-center shadow-2xl border border-gray-300">
            <h2 id="pause-title" className="text-xl font-bold text-[#004976] mb-2">Test Paused</h2>
            <p className="text-sm text-gray-600 mb-6">The exam timer is stopped while paused.</p>
            <button
              type="button"
              autoFocus
              onClick={() => setIsPaused(false)}
              className="w-full py-2.5 bg-[#2196f3] hover:bg-[#1976d2] text-white font-bold text-sm rounded shadow transition-colors"
            >
              Resume Test
            </button>
          </section>
        </div>
      ) : null}

      {/* Modals from UWorld QBank Demo */}
      <FlashcardModal
        isOpen={activePopup === "flashcards"}
        onClose={() => closePopup("flashcards")}
        currentQid={question.qid}
        currentQuestionNumber={currentQuestion}
        flashcards={flashcards}
        onAddFlashcard={handleAddFlashcard}
        onDeleteFlashcard={handleDeleteFlashcard}
        prefillFront={flashcardPrefill}
      />

      <NotebookModal
        isOpen={activePopup === "notebook"}
        onClose={() => closePopup("notebook")}
        currentQid={question.qid}
        currentQuestionNumber={currentQuestion}
        entries={notebookEntries}
        onSaveEntry={handleSaveNotebookEntry}
        onDeleteEntry={handleDeleteNotebookEntry}
        prefillContent={notebookPrefill}
      />

      <FeedbackModal
        isOpen={activePopup === "feedback"}
        onClose={() => closePopup("feedback")}
        currentQid={question.qid}
        currentQuestionNumber={currentQuestion}
      />

      <TutorialModal
        isOpen={activePopup === "tutorial" || activePopup === "help"}
        onClose={() => {
          if (activePopup === "tutorial") closePopup("tutorial");
          if (activePopup === "help") closePopup("help");
        }}
      />
    </div>
  );
};

export default Index;
