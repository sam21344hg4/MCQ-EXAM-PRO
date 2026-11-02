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

type ExamMode = "start" | "timed" | "practice" | "complete" | "review" | "create-test";

const Index = () => {
  const handleStartGeneratedTest = useCallback(async (config: GeneratedTestConfig) => {
    try {
      const loadedQuestions = await Promise.all(
        config.questions.map(async (meta) => {
          try {
            const res = await fetch(`/qbank/q_${meta.id}.json`);
            if (res.ok) {
              const data = await res.json();
              return {
                id: meta.id,
                stem: data.stem || `Question ID: ${meta.id} - ${meta.topic}`,
                options: data.options || [],
                correctAnswer: data.correctAnswer || meta.correctAnswer || "A",
                explanation: data.explanation || "",
                educationalObjective: data.educationalObjective || "",
                image: data.image,
                imageCaption: data.imageCaption,
              };
            }
          } catch (e) {
            console.error("Failed to load question", meta.id, e);
          }
          return {
            id: meta.id,
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
          };
        })
      );

      const customExam: ExamData = {
        id: `qbank-custom-${Date.now()}`,
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
      setCurrentQuestion(loadedQuestions[0]?.id || 1);
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

  const { activePopup, closePopup, closeCalculator } = useExamUI();
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
    setMode("timed");
  }, [resetSessionState]);

  const handlePractice = useCallback(() => {
    resetSessionState();
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
    if (mode === "timed") handleEndSection();
    else {
      setMode("complete");
      setShowBlockReview(false);
      dismissTransientTools();
    }
  }, [mode, handleEndSection, dismissTransientTools]);

  const handleSelectAnswer = useCallback((answer: string) => {
    if (mode === "review") return;
    const strikeKey = `${currentQuestion}-${answer}`;
    setStrikethroughs((previous) => {
      if (!previous.has(strikeKey)) return previous;
      const next = new Set(previous);
      next.delete(strikeKey);
      return next;
    });
    setAnswers((previous) => ({ ...previous, [currentQuestion]: answer }));
  }, [currentQuestion, mode]);

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

  const handleRestart = useCallback(() => {
    resetSessionState();
    setMode("start");
  }, [resetSessionState]);

  const handlePostExamReview = useCallback(() => {
    dismissTransientTools();
    setMode("review");
    setCurrentQuestion(1);
    setCurrentSection(1);
    setShowExplanation(true);
    setShowBlockReview(false);
    setIsPaused(false);
    scrollExamTop();
  }, [dismissTransientTools, scrollExamTop]);

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
      />

      {!showBlockReview ? (
        <div id="classic-status">
          <QuestionStatusPanel sectionStart={sectionInfo.start} sectionEnd={sectionInfo.end} currentQuestion={currentQuestion} answers={answers} flagged={flagged} notes={notes} onNavigate={handleNavigate} />
        </div>
      ) : null}

      <main id="classic-main" className="classic-exam-main" aria-live="polite">
        {showBlockReview ? (
          <BlockReview sectionStart={sectionInfo.start} sectionEnd={sectionInfo.end} currentQuestion={currentQuestion} answers={answers} flagged={flagged} onNavigate={handleNavigate} onReturn={() => setShowBlockReview(false)} onEndBlock={handleEndBlock} />
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
          />
        )}
      </main>

      {isPaused ? (
        <div className="classic-pause-overlay" role="dialog" aria-modal="true" aria-labelledby="pause-title">
          <section className="classic-pause-card">
            <h2 id="pause-title">Exam Paused</h2>
            <p>The timer is stopped while this simulator is paused.</p>
            <button type="button" autoFocus onClick={() => setIsPaused(false)}>Resume</button>
          </section>
        </div>
      ) : null}
    </div>
  );
};

export default Index;
