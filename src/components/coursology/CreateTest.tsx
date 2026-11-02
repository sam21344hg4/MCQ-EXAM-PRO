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
import {
  Info,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";

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
  // 1. Collapsed Step Panels
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    step1: false,
    step2: false,
    step3: false,
    step4: false,
    step5: false,
  });

  const toggleCollapse = (step: string) => {
    setCollapsed((prev) => ({ ...prev, [step]: !prev[step] }));
  };

  // 2. Test Mode (Tutor vs Timed)
  const [isTutor, setIsTutor] = useState<boolean>(false);
  const [isTimed, setIsTimed] = useState<boolean>(true);

  // 3. Question Mode (Unused, Incorrect, Marked, All, Custom)
  const [questionMode, setQuestionMode] = useState<QuestionMode>("all");

  // 4. Subject Selections (Default all 13 selected)
  const allSubjectNames = useMemo(
    () => qbankTaxonomy.subjects.map((s) => s.name),
    []
  );
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(
    new Set(allSubjectNames)
  );

  // 5. System Selections (Default all 26 selected)
  const allSystemNames = useMemo(
    () => qbankTaxonomy.systems.map((s) => s.name),
    []
  );
  const [selectedSystems, setSelectedSystems] = useState<Set<string>>(
    new Set(allSystemNames)
  );

  // Systems accordion expansion state
  const [expandedSystems, setExpandedSystems] = useState<Set<string>>(new Set());

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

  // 6. Question Count
  const [questionCount, setQuestionCount] = useState<number>(40);

  // --------------------------------------------------------------------------
  // EXACT DYNAMIC SHARED INTERSECTION COUNTS
  // --------------------------------------------------------------------------

  // Base pool filtered by question status mode (All, Unused, etc.)
  const basePool = useMemo(() => {
    return qbankQuestions;
  }, []);

  // System and Subcategory counts dynamically shared by the SELECTED SUBJECTS:
  // For each system and each category, count how many questions belong to the selected subjects.
  const { systemCounts, categoryCounts } = useMemo(() => {
    const sysCounts: Record<string, number> = {};
    const catCounts: Record<string, Record<string, number>> = {};

    for (const sys of qbankTaxonomy.systems) {
      sysCounts[sys.name] = 0;
      catCounts[sys.name] = {};
      for (const cat of sys.categories) {
        catCounts[sys.name][cat.name] = 0;
      }
    }

    for (const q of basePool) {
      if (selectedSubjects.has(q.subject)) {
        if (sysCounts[q.system] !== undefined) {
          sysCounts[q.system]++;
        }
        if (
          catCounts[q.system] &&
          catCounts[q.system][q.category] !== undefined
        ) {
          catCounts[q.system][q.category]++;
        }
      }
    }

    return { systemCounts: sysCounts, categoryCounts: catCounts };
  }, [basePool, selectedSubjects]);

  // Subject counts dynamically shared by the SELECTED SYSTEMS & CATEGORIES:
  // For each subject, count how many questions belong to the selected systems/categories.
  const subjectCounts = useMemo(() => {
    const subCounts: Record<string, number> = {};
    for (const sub of qbankTaxonomy.subjects) {
      subCounts[sub.name] = 0;
    }

    for (const q of basePool) {
      if (selectedSystems.has(q.system)) {
        const activeCats = selectedCategories[q.system];
        if (
          !activeCats ||
          activeCats.size === 0 ||
          activeCats.has(q.category)
        ) {
          if (subCounts[q.subject] !== undefined) {
            subCounts[q.subject]++;
          }
        }
      }
    }

    return subCounts;
  }, [basePool, selectedSystems, selectedCategories]);

  // Total available questions (Intersection of selected subjects AND selected systems & categories)
  const availableQuestions = useMemo(() => {
    return basePool.filter((q) => {
      if (!selectedSubjects.has(q.subject)) return false;
      if (!selectedSystems.has(q.system)) return false;
      const activeCats = selectedCategories[q.system];
      if (activeCats && activeCats.size > 0 && !activeCats.has(q.category)) {
        return false;
      }
      return true;
    });
  }, [basePool, selectedSubjects, selectedSystems, selectedCategories]);

  const totalAvailable = availableQuestions.length;
  const maxBlockQuestions = Math.min(40, totalAvailable);

  // --------------------------------------------------------------------------
  // Selection Handlers
  // --------------------------------------------------------------------------

  const toggleSubject = useCallback((name: string) => {
    setSelectedSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const toggleAllSubjects = useCallback(() => {
    setSelectedSubjects((prev) => {
      if (prev.size === allSubjectNames.length) return new Set();
      return new Set(allSubjectNames);
    });
  }, [allSubjectNames]);

  const toggleSystem = useCallback((sysName: string) => {
    setSelectedSystems((prev) => {
      const next = new Set(prev);
      const willSelect = !next.has(sysName);
      if (willSelect) next.add(sysName);
      else next.delete(sysName);

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

  const toggleExpandAllSystems = () => {
    if (expandedSystems.size === allSystemNames.length) {
      setExpandedSystems(new Set());
    } else {
      setExpandedSystems(new Set(allSystemNames));
    }
  };

  const toggleSystemExpand = (sysName: string) => {
    setExpandedSystems((prev) => {
      const next = new Set(prev);
      if (next.has(sysName)) next.delete(sysName);
      else next.add(sysName);
      return next;
    });
  };

  const toggleCategory = useCallback((sysName: string, catName: string) => {
    setSelectedCategories((prev) => {
      const currentSysCats = new Set(prev[sysName] || []);
      if (currentSysCats.has(catName)) {
        currentSysCats.delete(catName);
      } else {
        currentSysCats.add(catName);
      }

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

  // Generate Action
  const handleGenerate = () => {
    const count = Math.min(
      Math.max(1, questionCount),
      Math.min(totalAvailable, 40)
    );
    const selectedBlock = generateTestBlock(availableQuestions, count);

    const testMode: TestMode = isTutor ? "tutor" : "timed";
    const generatedName = `Test: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString(
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
    <div className="min-h-screen w-full bg-[#f3f3f4] text-[#313131] font-sans overflow-y-auto">
      {/* Centered Main Container */}
      <div className="w-full max-w-5xl mx-auto px-4 py-6 md:py-8 space-y-4 pb-32">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Standard Exams</span>
              </button>
            )}
            <div className="text-[19px] font-medium text-[#2196f3] border-b-[3px] border-[#2196f3] pb-1 px-1">
              Create Test
            </div>
          </div>

          <div className="flex items-center gap-2 text-[13.5px] font-medium text-[#2196f3] cursor-pointer hover:underline">
            <ExternalLink className="h-4 w-4" />
            <span>Launch Tutorial</span>
          </div>
        </div>

        {/* ==================================================== */}
        {/* Step 1: Test Mode (UWorld row-option)                */}
        {/* ==================================================== */}
        <div className="bg-white rounded border border-[#e7eaec] shadow-sm overflow-hidden">
          <div
            className="flex items-center justify-between px-6 py-4 border-b border-[#e7eaec] cursor-pointer select-none"
            onClick={() => toggleCollapse("step1")}
          >
            <div className="flex items-center gap-2 text-[16px] font-medium text-[#313131]">
              <span>Test Mode</span>
              <Info className="h-4 w-4 text-[#2196f3]" />
            </div>
            <div className="text-[#c4c4c4]">
              {collapsed.step1 ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronUp className="h-5 w-5" />
              )}
            </div>
          </div>

          {!collapsed.step1 && (
            <div className="p-6">
              <div className="flex flex-wrap items-center gap-12">
                {/* Tutor Toggle */}
                <div
                  className="flex items-center gap-3 cursor-pointer select-none"
                  onClick={() => setIsTutor(!isTutor)}
                >
                  <div
                    className={`w-[52px] h-[24px] rounded-full relative transition-colors duration-200 ${
                      isTutor ? "bg-[#2196f3]" : "bg-[#d1d5db]"
                    }`}
                  >
                    <div
                      className={`w-[18px] h-[18px] rounded-full bg-white absolute top-[3px] left-[3px] transition-transform duration-200 shadow-sm ${
                        isTutor ? "translate-x-[28px]" : ""
                      }`}
                    />
                  </div>
                  <span className="text-[13.5px] text-[#65656a]">Tutor</span>
                </div>

                {/* Timed Toggle */}
                <div
                  className="flex items-center gap-3 cursor-pointer select-none"
                  onClick={() => setIsTimed(!isTimed)}
                >
                  <div
                    className={`w-[52px] h-[24px] rounded-full relative transition-colors duration-200 ${
                      isTimed ? "bg-[#2196f3]" : "bg-[#d1d5db]"
                    }`}
                  >
                    <div
                      className={`w-[18px] h-[18px] rounded-full bg-white absolute top-[3px] left-[3px] transition-transform duration-200 shadow-sm ${
                        isTimed ? "translate-x-[28px]" : ""
                      }`}
                    />
                  </div>
                  <span className="text-[13.5px] text-[#65656a]">Timed</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ==================================================== */}
        {/* Step 2: Question Mode (UWorld row-option)            */}
        {/* ==================================================== */}
        <div className="bg-white rounded border border-[#e7eaec] shadow-sm overflow-hidden">
          <div
            className="flex items-center justify-between px-6 py-4 border-b border-[#e7eaec] cursor-pointer select-none"
            onClick={() => toggleCollapse("step2")}
          >
            <div className="flex items-center gap-2 text-[16px] font-medium text-[#313131]">
              <span>Question Mode</span>
              <Info className="h-4 w-4 text-[#2196f3]" />
            </div>
            <div className="text-[#c4c4c4]">
              {collapsed.step2 ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronUp className="h-5 w-5" />
              )}
            </div>
          </div>

          {!collapsed.step2 && (
            <div className="p-6">
              <div className="flex flex-wrap items-center gap-8">
                {[
                  {
                    mode: "unused" as QuestionMode,
                    label: "Unused",
                    count: 0,
                  },
                  {
                    mode: "incorrect" as QuestionMode,
                    label: "Incorrect",
                    count: 0,
                  },
                  {
                    mode: "marked" as QuestionMode,
                    label: "Marked",
                    count: 0,
                  },
                  {
                    mode: "all" as QuestionMode,
                    label: "All",
                    count: totalAvailable,
                  },
                  {
                    mode: "custom" as any,
                    label: "Custom",
                    count: null,
                  },
                ].map(({ mode, label, count }) => {
                  const isSelected = questionMode === mode;
                  return (
                    <label
                      key={label}
                      className="inline-flex items-center gap-2 cursor-pointer select-none text-[13.5px] text-[#313131]"
                      onClick={() => setQuestionMode(mode)}
                    >
                      <div
                        className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected ? "border-[#2196f3]" : "border-[#b2b2b2]"
                        }`}
                      >
                        {isSelected && (
                          <div className="w-[10px] h-[10px] rounded-full bg-[#2196f3]" />
                        )}
                      </div>
                      <span>
                        {label}
                        {count !== null && (
                          <span className="ml-1 text-[#65656a]">
                            {count.toLocaleString()}
                          </span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ==================================================== */}
        {/* Step 3: Subjects (UWorld row-option)                 */}
        {/* ==================================================== */}
        <div className="bg-white rounded border border-[#e7eaec] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#e7eaec]">
            <div className="flex items-center gap-3">
              <Checkbox
                id="uw-master-subjects"
                checked={selectedSubjects.size === allSubjectNames.length}
                onCheckedChange={toggleAllSubjects}
                className="data-[state=checked]:bg-[#2196f3] data-[state=checked]:border-[#2196f3] border-gray-400"
              />
              <label
                htmlFor="uw-master-subjects"
                className="cursor-pointer font-medium text-[16px] text-[#313131]"
              >
                Subjects
              </label>
            </div>

            <div
              className="cursor-pointer p-1 text-[#c4c4c4]"
              onClick={() => toggleCollapse("step3")}
            >
              {collapsed.step3 ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronUp className="h-5 w-5" />
              )}
            </div>
          </div>

          {!collapsed.step3 && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                {qbankTaxonomy.subjects.map((sub) => {
                  const isChecked = selectedSubjects.has(sub.name);
                  // Dynamic count shared by currently selected systems/categories
                  const dynamicCount = subjectCounts[sub.name] || 0;
                  const isDisabled = dynamicCount === 0;

                  return (
                    <div
                      key={sub.name}
                      onClick={() => toggleSubject(sub.name)}
                      className={`flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50 cursor-pointer select-none transition-colors ${
                        isDisabled ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleSubject(sub.name)}
                          className="data-[state=checked]:bg-[#2196f3] data-[state=checked]:border-[#2196f3] border-gray-400"
                        />
                        <span
                          className={`text-[13.5px] ${
                            isDisabled
                              ? "text-[#b2b2b2]"
                              : isChecked
                              ? "text-[#313131] font-medium"
                              : "text-[#65656a]"
                          }`}
                        >
                          {sub.name}
                        </span>
                      </div>

                      {/* UWorld Custom Badge */}
                      <span
                        className={`inline-block min-w-[34px] h-[22px] leading-[20px] px-2 rounded-full text-center text-[12px] font-semibold border ${
                          isDisabled
                            ? "border-[#b2b2b2] text-[#b2b2b2]"
                            : "border-[#b2b2b2] text-[#2196f3] bg-white"
                        }`}
                      >
                        {dynamicCount}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ==================================================== */}
        {/* Step 4: Systems (UWorld row-option)                  */}
        {/* ==================================================== */}
        <div className="bg-white rounded border border-[#e7eaec] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#e7eaec]">
            <div className="flex items-center gap-3">
              <Checkbox
                id="uw-master-systems"
                checked={selectedSystems.size === allSystemNames.length}
                onCheckedChange={toggleAllSystems}
                className="data-[state=checked]:bg-[#2196f3] data-[state=checked]:border-[#2196f3] border-gray-400"
              />
              <label
                htmlFor="uw-master-systems"
                className="cursor-pointer font-medium text-[16px] text-[#313131]"
              >
                Systems
              </label>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={toggleExpandAllSystems}
                className="text-[13.5px] font-semibold text-[#2196f3] hover:underline flex items-center gap-1"
              >
                {expandedSystems.size === allSystemNames.length ? (
                  <>
                    <Minus className="h-3.5 w-3.5" />
                    <span>Collapse All</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" />
                    <span>Expand All</span>
                  </>
                )}
              </button>

              <div
                className="cursor-pointer p-1 text-[#c4c4c4]"
                onClick={() => toggleCollapse("step4")}
              >
                {collapsed.step4 ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronUp className="h-5 w-5" />
                )}
              </div>
            </div>
          </div>

          {!collapsed.step4 && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                {qbankTaxonomy.systems.map((sys) => {
                  const isSysChecked = selectedSystems.has(sys.name);
                  const isExpanded = expandedSystems.has(sys.name);
                  const sysCats = selectedCategories[sys.name] || new Set();

                  // Dynamic count shared by currently selected subjects
                  const dynamicSysCount = systemCounts[sys.name] || 0;
                  const isSysDisabled = dynamicSysCount === 0;

                  return (
                    <div key={sys.name} className="flex flex-col">
                      <div
                        className={`flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50 select-none transition-colors ${
                          isSysDisabled ? "opacity-60" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Checkbox
                            checked={isSysChecked}
                            onCheckedChange={() => toggleSystem(sys.name)}
                            className="data-[state=checked]:bg-[#2196f3] data-[state=checked]:border-[#2196f3] border-gray-400"
                          />
                          <span
                            onClick={() => toggleSystem(sys.name)}
                            className={`text-[13.5px] cursor-pointer truncate ${
                              isSysDisabled
                                ? "text-[#b2b2b2]"
                                : isSysChecked
                                ? "text-[#313131] font-medium"
                                : "text-[#65656a]"
                            }`}
                          >
                            {sys.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 ml-2 shrink-0">
                          {/* UWorld Custom Badge showing exact shared count */}
                          <span
                            className={`inline-block min-w-[34px] h-[22px] leading-[20px] px-2 rounded-full text-center text-[12px] font-semibold border ${
                              isSysDisabled
                                ? "border-[#b2b2b2] text-[#b2b2b2]"
                                : "border-[#b2b2b2] text-[#2196f3] bg-white"
                            }`}
                          >
                            {dynamicSysCount}
                          </span>

                          {sys.categories.length > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSystemExpand(sys.name);
                              }}
                              className="p-1 text-gray-400 hover:text-gray-700"
                              title={isExpanded ? "Collapse" : "Expand"}
                            >
                              {isExpanded ? (
                                <Minus className="h-3.5 w-3.5" />
                              ) : (
                                <Plus className="h-3.5 w-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Subcategories under System showing exact shared counts */}
                      {isExpanded && sys.categories.length > 0 && (
                        <div className="ml-7 pl-3 my-1 border-l-2 border-gray-200 space-y-1">
                          {sys.categories.map((cat) => {
                            const isCatChecked = sysCats.has(cat.name);
                            // Dynamic count for this specific subcategory shared with selected subjects
                            const dynamicCatCount =
                              categoryCounts[sys.name]?.[cat.name] || 0;
                            const isCatDisabled = dynamicCatCount === 0;

                            return (
                              <div
                                key={cat.name}
                                onClick={() =>
                                  toggleCategory(sys.name, cat.name)
                                }
                                className={`flex items-center justify-between py-1 px-2 rounded hover:bg-gray-100 cursor-pointer select-none text-xs transition-colors ${
                                  isCatDisabled ? "opacity-50" : ""
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <Checkbox
                                    checked={isCatChecked}
                                    onCheckedChange={() =>
                                      toggleCategory(sys.name, cat.name)
                                    }
                                    className="h-3.5 w-3.5 data-[state=checked]:bg-[#2196f3] data-[state=checked]:border-[#2196f3] border-gray-400"
                                  />
                                  <span
                                    className={`truncate ${
                                      isCatDisabled
                                        ? "text-[#b2b2b2]"
                                        : "text-[#65656a] hover:text-[#313131]"
                                    }`}
                                  >
                                    {cat.name}
                                  </span>
                                </div>

                                <span
                                  className={`font-mono text-[11px] shrink-0 ml-2 ${
                                    isCatDisabled
                                      ? "text-[#b2b2b2]"
                                      : "text-[#2196f3] font-semibold"
                                  }`}
                                >
                                  {dynamicCatCount}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ==================================================== */}
        {/* Step 5: No. of Questions (UWorld row-option)         */}
        {/* ==================================================== */}
        <div className="bg-white rounded border border-[#e7eaec] shadow-sm overflow-hidden">
          <div
            className="flex items-center justify-between px-6 py-4 border-b border-[#e7eaec] cursor-pointer select-none"
            onClick={() => toggleCollapse("step5")}
          >
            <span className="font-medium text-[16px] text-[#313131]">
              No. of Questions
            </span>
            <div className="text-[#c4c4c4]">
              {collapsed.step5 ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronUp className="h-5 w-5" />
              )}
            </div>
          </div>

          {!collapsed.step5 && (
            <div className="p-6 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={maxBlockQuestions || 40}
                    value={questionCount}
                    onChange={(e) =>
                      setQuestionCount(parseInt(e.target.value) || 0)
                    }
                    className="h-[32px] w-[52px] border border-[#ddd] text-[#313131] bg-[#ebebeb] text-center font-bold text-[14px] rounded outline-none focus:border-[#2196f3] focus:bg-white transition-colors"
                  />
                  <span className="text-[13.5px] text-[#65656a]">
                    Max allowed per block
                  </span>
                  <span className="inline-block h-[21px] leading-[21px] rounded-full px-2 text-[12px] font-semibold text-[#4a4a4a] bg-[#e8e8e8]">
                    {maxBlockQuestions}
                  </span>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-2">
                  {[10, 20, 30, 40].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() =>
                        setQuestionCount(
                          Math.min(num, totalAvailable || num)
                        )
                      }
                      disabled={totalAvailable < num}
                      className={`px-3 py-1 text-xs font-semibold rounded border transition-colors ${
                        questionCount === num
                          ? "bg-[#2196f3] text-white border-[#2196f3]"
                          : "bg-white text-[#65656a] border-[#ddd] hover:bg-gray-50 disabled:opacity-40"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setQuestionCount(Math.min(40, totalAvailable))
                    }
                    disabled={totalAvailable === 0}
                    className="px-3 py-1 text-xs font-semibold rounded border bg-white text-[#65656a] border-[#ddd] hover:bg-gray-50 disabled:opacity-40"
                  >
                    Max
                  </button>
                </div>
              </div>

              <div className="text-xs text-[#828282]">
                Total available matching selections:{" "}
                <span className="font-semibold text-[#313131]">
                  {totalAvailable.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ==================================================== */}
        {/* Step 6: Generate Test Action (UWorld custom-button)  */}
        {/* ==================================================== */}
        <div className="flex items-center justify-between pt-2 pb-12">
          <div className="text-[13.5px] text-[#65656a]">
            Selected:{" "}
            <span className="font-bold text-[#2196f3]">
              {Math.min(questionCount, maxBlockQuestions)} Questions
            </span>
          </div>

          <button
            type="button"
            disabled={totalAvailable === 0 || questionCount <= 0}
            onClick={handleGenerate}
            className="bg-[#2196f3] hover:bg-[#1976d2] text-white font-semibold text-[14px] uppercase tracking-wide py-2.5 px-7 rounded border-none shadow-sm transition-all disabled:bg-[#88cee7] disabled:opacity-65 disabled:cursor-not-allowed"
          >
            GENERATE TEST
          </button>
        </div>
      </div>
    </div>
  );
};
