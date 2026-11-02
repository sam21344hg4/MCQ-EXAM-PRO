import React, { useState } from "react";
import { X, BookOpen, Plus, Trash2, Edit3, Search } from "lucide-react";

export interface NotebookEntry {
  id: string;
  qid?: number | string;
  questionNumber: number;
  title: string;
  content: string;
  updatedAt: number;
}

interface NotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentQid?: number | string;
  currentQuestionNumber: number;
  entries: NotebookEntry[];
  onSaveEntry: (entry: Omit<NotebookEntry, "id" | "updatedAt"> & { id?: string }) => void;
  onDeleteEntry: (id: string) => void;
  prefillContent?: string;
}

export const NotebookModal: React.FC<NotebookModalProps> = ({
  isOpen,
  onClose,
  currentQid,
  currentQuestionNumber,
  entries,
  onSaveEntry,
  onDeleteEntry,
  prefillContent = "",
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(!!prefillContent);
  const [title, setTitle] = useState(currentQid ? `QID ${currentQid} Notes` : `Item #${currentQuestionNumber} Notes`);
  const [content, setContent] = useState(prefillContent);
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const filteredEntries = entries.filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.content.toLowerCase().includes(search.toLowerCase())
  );

  const handleStartNew = () => {
    setSelectedId(null);
    setTitle(currentQid ? `QID ${currentQid} Notes` : `Item #${currentQuestionNumber} Notes`);
    setContent("");
    setIsEditing(true);
  };

  const handleSelect = (entry: NotebookEntry) => {
    setSelectedId(entry.id);
    setTitle(entry.title);
    setContent(entry.content);
    setIsEditing(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSaveEntry({
      id: selectedId || undefined,
      qid: currentQid,
      questionNumber: currentQuestionNumber,
      title: title.trim() || `Item #${currentQuestionNumber}`,
      content: content.trim(),
    });
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl flex flex-col h-[85vh] border border-[#ddd] overflow-hidden text-[#333]">
        {/* Header */}
        <div className="bg-[#004976] text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-[15px]">
            <BookOpen className="h-5 w-5 text-[#88cee7]" />
            <span>My Notebook</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded transition-colors"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 2-Pane Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Index */}
          <div className="w-1/3 border-r border-[#e0e0e0] flex flex-col bg-[#fbfbfb]">
            <div className="p-3 border-b border-[#eee] flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-[#999]" />
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-2 py-1 text-xs border border-[#ddd] rounded outline-none focus:border-[#2196f3]"
                />
              </div>
              <button
                type="button"
                onClick={handleStartNew}
                className="p-1.5 bg-[#2196f3] text-white rounded hover:bg-[#1976d2]"
                title="New Note"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[#eee]">
              {filteredEntries.length === 0 ? (
                <div className="text-center py-10 px-3 text-xs text-[#999]">
                  No notebook entries found.
                </div>
              ) : (
                filteredEntries.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => handleSelect(e)}
                    className={`w-full text-left p-3 hover:bg-[#f0f4f8] transition-colors ${
                      selectedId === e.id ? "bg-[#e3f2fd] border-l-4 border-l-[#2196f3]" : ""
                    }`}
                  >
                    <div className="font-semibold text-xs text-[#333] truncate">
                      {e.title}
                    </div>
                    <div className="text-[11px] text-[#777] truncate mt-0.5">
                      {e.content}
                    </div>
                    <div className="text-[10px] text-[#aaa] mt-1">
                      {e.qid ? `QID: ${e.qid}` : `Item #${e.questionNumber}`}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right Editor / Reader */}
          <div className="flex-1 flex flex-col bg-white p-5 overflow-y-auto">
            {isEditing ? (
              <form onSubmit={handleSave} className="flex-1 flex flex-col space-y-3">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Note Title"
                  className="text-base font-bold border-b border-[#ccc] pb-1 outline-none focus:border-[#2196f3]"
                  required
                />
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type notes or copy question highlights here..."
                  className="flex-1 border border-[#e0e0e0] rounded p-3 text-sm outline-none focus:border-[#2196f3] resize-none"
                  required
                />
                <div className="flex justify-end gap-2 pt-2">
                  {selectedId && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-1.5 text-xs text-[#666] border border-[#ddd] rounded hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-5 py-1.5 text-xs font-semibold bg-[#2196f3] text-white rounded hover:bg-[#1976d2]"
                  >
                    Save Note
                  </button>
                </div>
              </form>
            ) : selectedId ? (
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-[#eee]">
                    <h2 className="text-base font-bold text-[#222]">{title}</h2>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-1 text-xs text-[#2196f3] hover:underline"
                      >
                        <Edit3 className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteEntry(selectedId);
                          setSelectedId(null);
                        }}
                        className="text-xs text-[#e53935] hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-[#444] whitespace-pre-wrap leading-relaxed">
                    {content}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-[#999] space-y-2">
                <BookOpen className="h-12 w-12 text-[#ddd]" />
                <p className="text-sm">Select a note to read or create a new one.</p>
                <button
                  type="button"
                  onClick={handleStartNew}
                  className="px-4 py-1.5 text-xs font-semibold bg-[#2196f3] text-white rounded hover:bg-[#1976d2] mt-2 inline-flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Note
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
