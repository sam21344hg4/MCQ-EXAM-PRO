import React, { useState, useMemo, useCallback } from "react";
import {
  qbankTaxonomy,
  qbankQuestions,
  filterQuestions,
  generateTestBlock,
  QBankQuestion,
  QuestionMode,
  TestMode,
} from "@/data/coursology";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen, Layers, CheckCircle2, ChevronRight, Sparkles } from "lucide-react";

export interface GeneratedTestConfig {
  testName: string;
  testMode: TestMode;
  questionMode: QuestionMode;
  questionCount: number;
  questions: QBankQuestion[];
}

interface CreateTestProps {
  onStartGeneratedTest: (config: GeneratedTestConfig) => void;
  onCancel?: () => void;
}

export const CreateTest: React.FC<CreateTestProps> = ({
  onStartGeneratedTest,
  onCancel,
}) => {
  // 1. Test Mode & Name
  const [testMode, setTestMode] = useState<TestMode>("timed");
  const [testName, setTestName] = useState<string>("");

  // 2. Question Mode (All, Unused, etc.)
  const [tab, setTab] = useState<"standard" | "custom">("standard");
  const [questionMode, setQuestionMode] = useState<QuestionMode>("all");

  // 3. Subject Selections (Default all selected)
  const allSubjectNames = useMemo(
    () => qbankTaxonomy.subjects.map((s) => s.name),
    []
  );
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(
    new Set(allSubjectNames)
  );

  // 4. System Selections (Default all selected)
  const allSystemNames = useMemo(
    () => qbankTaxonomy.systems.map((s) => s.name),
    []
  );
  const [selectedSystems, setSelectedSystems] = useState<Set<string>>(
    new Set(allSystemNames)
  );

  // Fine-grained Subcategory Selections: Map<systemName, Set<categoryName>>
  const [selectedCategories, setSelectedCategories] = useState<
    Record<string, Set<string>>
  >(() => {
    const initial: Record<string, Set<string>> = {};
    for (const sys of qbankTaxonomy.systems) {
      initial[sys.name] = new Set(sys.categories.map((c) => c.name));
    }
    return initial;
  });

  // 5. Question count
  const [questionCount, setQuestionCount] = useState<number>(40);

  // Dynamic Available Questions Calculation
  const availableQuestions = useMemo(() => {
    // Collect all selected categories across all selected systems
    const activeCategories: string[] = [];
    for (const sys of selectedSystems) {
      const cats = selectedCategories[sys];
      if (cats) {
        cats.forEach((c) => activeCategories.push(c));
      }
    }

    return filterQuestions({
      questionMode,
      selectedSubjects: Array.from(selectedSubjects),
      selectedSystems: Array.from(selectedSystems),
      selectedCategories: activeCategories,
    });
  }, [questionMode, selectedSubjects, selectedSystems, selectedCategories]);

  const totalAvailable = availableQuestions.length;

  // Toggle Subject Selection
  const toggleSubject = useCallback((name: string) => {
    setSelectedSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }, []);

  const toggleAllSubjects = useCallback(() => {
    setSelectedSubjects((prev) => {
      if (prev.size === allSubjectNames.length) {
        return new Set();
      } else {
        return new Set(allSubjectNames);
      }
    });
  }, [allSubjectNames]);

  // Toggle System Selection
  const toggleSystem = useCallback((sysName: string) => {
    setSelectedSystems((prev) => {
      const next = new Set(prev);
      const willSelect = !next.has(sysName);
      if (willSelect) {
        next.add(sysName);
      } else {
        next.delete(sysName);
      }

      // Also select/deselect all subcategories for this system
      const sysData = qbankTaxonomy.systems.find((s) => s.name === sysName);
      if (sysData) {
        setSelectedCategories((cPrev) => ({
          ...cPrev,
          [sysName]: willSelect
            ? new Set(sysData.categories.map((c) => c.name))
            : new Set(),
        }));
      }

      return next;
    });
  }, []);

  const toggleAllSystems = useCallback(() => {
    setSelectedSystems((prev) => {
      const allSelected = prev.size === allSystemNames.length;
      if (allSelected) {
        setSelectedCategories({});
        return new Set();
      } else {
        const fullCats: Record<string, Set<string>> = {};
        for (const sys of qbankTaxonomy.systems) {
          fullCats[sys.name] = new Set(sys.categories.map((c) => c.name));
        }
        setSelectedCategories(fullCats);
        return new Set(allSystemNames);
      }
    });
  }, [allSystemNames]);

  // Toggle Subcategory Selection
  const toggleCategory = useCallback((sysName: string, catName: string) => {
    setSelectedCategories((prev) => {
      const currentSysCats = new Set(prev[sysName] || []);
      if (currentSysCats.has(catName)) {
        currentSysCats.delete(catName);
      } else {
        currentSysCats.add(catName);
      }

      // If category selected and parent system not selected, also select system
      if (currentSysCats.size > 0) {
        setSelectedSystems((sPrev) => new Set(sPrev).add(sysName));
      } else {
        setSelectedSystems((sPrev) => {
          const sNext = new Set(sPrev);
          sNext.delete(sysName);
          return sNext;
        });
      }

      return {
        ...prev,
        [sysName]: currentSysCats,
      };
    });
  }, []);

  // Handle Form Submission
  const handleGenerate = () => {
    const count = Math.min(
      Math.max(1, questionCount),
      Math.min(totalAvailable, 40)
    );
    const selectedBlock = generateTestBlock(availableQuestions, count);

    const generatedName =
      testName.trim() ||
      `Test: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString(
        [],
        { hour: "2-digit", minute: "2-digit" }
      )}`;

    onStartGeneratedTest({
      testName: generatedName,
      testMode,
      questionMode,
      questionCount: count,
      questions: selectedBlock,
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-8 space-y-8 bg-background text-foreground">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Create Test in USMLE 1
            </h1>
            <Badge variant="outline" className="text-primary font-medium">
              Coursology QBank
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Build custom exam blocks from the comprehensive USMLE Step 1 item
            bank.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Back to Exams
            </Button>
          )}
          <Button
            size="lg"
            className="font-semibold shadow-md"
            disabled={totalAvailable === 0}
            onClick={handleGenerate}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Test ({Math.min(questionCount, Math.min(totalAvailable, 40))})
          </Button>
        </div>
      </div>

      {/* Row 1: Test Mode & Test Name */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Test Mode */}
        <div className="p-5 rounded-xl border bg-card shadow-sm space-y-4">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Test Mode
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTestMode("timed")}
              className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all text-sm font-medium ${
                testMode === "timed"
                  ? "border-primary bg-primary/10 text-primary font-semibold"
                  : "border-border hover:border-muted-foreground/30 text-muted-foreground"
              }`}
            >
              <Clock className="h-6 w-6 mb-2" />
              <span>Timed</span>
              <span className="text-xs text-muted-foreground mt-1">
                Standard exam timer
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTestMode("tutor")}
              className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all text-sm font-medium ${
                testMode === "tutor"
                  ? "border-primary bg-primary/10 text-primary font-semibold"
                  : "border-border hover:border-muted-foreground/30 text-muted-foreground"
              }`}
            >
              <BookOpen className="h-6 w-6 mb-2" />
              <span>Tutor</span>
              <span className="text-xs text-muted-foreground mt-1">
                Untimed & immediate feedback
              </span>
            </button>
          </div>
        </div>

        {/* Test Name & Presets */}
        <div className="p-5 rounded-xl border bg-card shadow-sm space-y-4">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            Test Name (Optional)
          </h2>
          <Input
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
            placeholder="e.g. Cardio & Renal Review #1"
            className="h-11"
          />
          <div className="text-xs text-muted-foreground flex items-center justify-between">
            <span>Leave empty to use automatic timestamp</span>
            <span className="font-mono text-primary">
              Available: {totalAvailable.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: Question Mode Filter Bar */}
      <div className="p-5 rounded-xl border bg-card shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold">Question Mode</h2>
            <div className="flex rounded-lg border p-1 bg-muted/40 text-xs font-medium">
              <button
                type="button"
                onClick={() => setTab("standard")}
                className={`px-3 py-1 rounded-md transition-colors ${
                  tab === "standard"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Standard
              </button>
              <button
                type="button"
                onClick={() => setTab("custom")}
                className={`px-3 py-1 rounded-md transition-colors ${
                  tab === "custom"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Custom
              </button>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            Total Available:{" "}
            <span className="font-bold text-foreground">
              {totalAvailable.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Status Mode Selectors */}
        <div className="flex flex-wrap gap-2 pt-2">
          {[
            { mode: "all" as QuestionMode, label: "All", count: totalAvailable },
            { mode: "unused" as QuestionMode, label: "Unused", count: 0 },
            { mode: "used" as QuestionMode, label: "Used", count: totalAvailable },
            { mode: "incorrect" as QuestionMode, label: "Incorrect", count: 0 },
            { mode: "marked" as QuestionMode, label: "Marked", count: 0 },
            { mode: "omitted" as QuestionMode, label: "Omitted", count: 0 },
            { mode: "correct" as QuestionMode, label: "Correct", count: 0 },
          ].map(({ mode, label, count }) => (
            <button
              key={mode}
              type="button"
              onClick={() => setQuestionMode(mode)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                questionMode === mode
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/30 hover:bg-muted text-muted-foreground border-border"
              }`}
            >
              <span>{label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  questionMode === mode
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-background text-foreground border"
                }`}
              >
                {count.toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Row 3: Subjects & Systems Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subjects Column */}
        <div className="p-5 rounded-xl border bg-card shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b">
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all-subjects"
                checked={selectedSubjects.size === allSubjectNames.length}
                onCheckedChange={toggleAllSubjects}
              />
              <label
                htmlFor="select-all-subjects"
                className="font-semibold text-base cursor-pointer"
              >
                Subjects
              </label>
            </div>
            <Badge variant="secondary">
              {selectedSubjects.size} of {allSubjectNames.length} selected
            </Badge>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {qbankTaxonomy.subjects.map((sub) => {
              const isChecked = selectedSubjects.has(sub.name);
              return (
                <div
                  key={sub.name}
                  onClick={() => toggleSubject(sub.name)}
                  className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer ${
                    isChecked
                      ? "bg-primary/5 border-primary/40 text-foreground"
                      : "bg-background border-border text-muted-foreground hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => toggleSubject(sub.name)}
                    />
                    <span className="text-sm font-medium">{sub.name}</span>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    {sub.count}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>

        {/* Systems Column */}
        <div className="p-5 rounded-xl border bg-card shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b">
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all-systems"
                checked={selectedSystems.size === allSystemNames.length}
                onCheckedChange={toggleAllSystems}
              />
              <label
                htmlFor="select-all-systems"
                className="font-semibold text-base cursor-pointer"
              >
                Systems
              </label>
            </div>
            <Badge variant="secondary">
              {selectedSystems.size} of {allSystemNames.length} selected
            </Badge>
          </div>

          <Accordion
            type="multiple"
            className="space-y-2 max-h-[500px] overflow-y-auto pr-1"
          >
            {qbankTaxonomy.systems.map((sys) => {
              const isSysChecked = selectedSystems.has(sys.name);
              const sysCats = selectedCategories[sys.name] || new Set();

              return (
                <AccordionItem
                  key={sys.name}
                  value={sys.name}
                  className="border rounded-lg px-3 overflow-hidden"
                >
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2.5">
                      <Checkbox
                        checked={isSysChecked}
                        onCheckedChange={() => toggleSystem(sys.name)}
                      />
                      <span className="text-sm font-medium text-foreground">
                        {sys.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {sys.count}
                      </Badge>
                      {sys.categories.length > 0 && (
                        <AccordionTrigger className="p-1 hover:no-underline" />
                      )}
                    </div>
                  </div>

                  {sys.categories.length > 0 && (
                    <AccordionContent className="pt-2 pb-3 pl-6 pr-2 space-y-1.5 border-t">
                      {sys.categories.map((cat) => {
                        const isCatChecked = sysCats.has(cat.name);
                        return (
                          <div
                            key={cat.name}
                            onClick={() => toggleCategory(sys.name, cat.name)}
                            className="flex items-center justify-between py-1 px-2 rounded hover:bg-muted/50 cursor-pointer text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={isCatChecked}
                                onCheckedChange={() =>
                                  toggleCategory(sys.name, cat.name)
                                }
                              />
                              <span className="text-muted-foreground hover:text-foreground">
                                {cat.name}
                              </span>
                            </div>
                            <span className="font-mono text-muted-foreground text-[11px]">
                              {cat.count}
                            </span>
                          </div>
                        );
                      })}
                    </AccordionContent>
                  )}
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </div>

      {/* Row 4: No. of Questions and Generate Test Action */}
      <div className="p-6 rounded-xl border bg-card shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">No. of Questions</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Maximum 40 questions per USMLE Step 1 practice block
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={1}
              max={Math.min(40, totalAvailable || 40)}
              value={questionCount}
              onChange={(e) => setQuestionCount(parseInt(e.target.value) || 0)}
              className="w-24 text-center font-bold text-lg h-11"
            />

            <div className="flex items-center gap-1.5">
              {[10, 20, 30, 40].map((num) => (
                <Button
                  key={num}
                  variant={questionCount === num ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setQuestionCount(Math.min(num, totalAvailable || num))
                  }
                  disabled={totalAvailable < num}
                >
                  {num}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuestionCount(Math.min(40, totalAvailable))}
                disabled={totalAvailable === 0}
              >
                Max
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm">
            <span className="text-muted-foreground">Ready to generate: </span>
            <span className="font-bold text-primary">
              {Math.min(questionCount, Math.min(totalAvailable, 40))} Questions
            </span>
          </div>

          <Button
            size="lg"
            className="px-8 font-semibold shadow-lg"
            disabled={totalAvailable === 0 || questionCount <= 0}
            onClick={handleGenerate}
          >
            Generate Test
          </Button>
        </div>
      </div>
    </div>
  );
};
