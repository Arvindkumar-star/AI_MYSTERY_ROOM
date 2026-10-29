import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { useUIStore } from '../store/uiStore.js';

// Evidence Viewers
import ChatViewer from '../components/evidence/ChatViewer.jsx';
import DocumentViewer from '../components/evidence/DocumentViewer.jsx';
import StatementViewer from '../components/evidence/StatementViewer.jsx';
import CctvViewer from '../components/evidence/CctvViewer.jsx';
import ForensicViewer from '../components/evidence/ForensicViewer.jsx';
import LogViewer from '../components/evidence/LogViewer.jsx';
import ImageViewer from '../components/evidence/ImageViewer.jsx';

// Sidebar Panels
import SuspectList from '../components/suspects/SuspectList.jsx';
import Notebook from '../components/notebook/Notebook.jsx';
import EvidenceBoard from '../components/board/EvidenceBoard.jsx';
import AccusationModal from '../components/ui/AccusationModal.jsx';

// Icons
import {
  MessageSquare,
  FileText,
  Quote,
  Video,
  Microscope,
  Database,
  Image as ImageIcon,
  Pin,
  Search,
  Users,
  BookOpen,
  HelpCircle,
  ShieldAlert,
  Loader2,
  Menu,
  X,
  Lightbulb,
} from 'lucide-react';

const TYPE_ICONS = {
  chat: MessageSquare,
  document: FileText,
  statement: Quote,
  cctv: Video,
  forensic: Microscope,
  log: Database,
  audio_transcript: Database,
  image: ImageIcon,
};

const ATTEMPTS_BY_DIFFICULTY = {
  easy: 3,
  medium: 2,
  hard: 1,
};

export default function InvestigationPage() {
  const { id: investigationId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    activeEvidenceId,
    setActiveEvidenceId,
    filterType,
    setFilterType,
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    isAccusationOpen,
    setAccusationOpen,
    isMobileDrawerOpen,
    setMobileDrawerOpen,
  } = useUIStore();

  const [selectedSuspectId, setSelectedSuspectId] = useState(null);
  const [mobileView, setMobileView] = useState('evidence'); // 'evidence' | 'suspects' | 'notebook' | 'board' | 'hints'

  // Fetch Investigation
  const { data: investigation, isLoading: invLoading } = useQuery({
    queryKey: ['investigation', investigationId],
    queryFn: () => api.getInvestigation(investigationId),
  });

  // Fetch Case
  const { data: caseDoc, isLoading: caseLoading } = useQuery({
    queryKey: ['case', investigation?.caseId],
    queryFn: () => api.getCase(investigation.caseId),
    enabled: Boolean(investigation?.caseId),
  });

  // Patch Investigation Mutation
  const patchMutation = useMutation({
    mutationFn: (updates) => api.updateInvestigation(investigationId, updates),
    onSuccess: (updated) => {
      queryClient.setQueryData(['investigation', investigationId], updated);
    },
  });

  // Hint Mutation
  const hintMutation = useMutation({
    mutationFn: () => api.getHint(investigationId),
    onSuccess: () => {
      queryClient.invalidateQueries(['investigation', investigationId]);
    },
  });

  // Accusation Mutation
  const accuseMutation = useMutation({
    mutationFn: (payload) => api.accuse(investigationId, payload),
    onSuccess: (result) => {
      setAccusationOpen(false);
      queryClient.invalidateQueries(['investigation', investigationId]);
      if (result.investigationStatus === 'solved' || result.investigationStatus === 'failed') {
        navigate(`/investigation/${investigationId}/verdict`);
      }
    },
  });

  // Ensure initial active evidence is selected
  useEffect(() => {
    if (caseDoc?.evidence?.length && !activeEvidenceId) {
      setActiveEvidenceId(caseDoc.evidence[0].evidenceId);
    }
  }, [caseDoc, activeEvidenceId, setActiveEvidenceId]);

  // Mark viewed evidence
  useEffect(() => {
    if (activeEvidenceId && investigation) {
      if (!investigation.viewedEvidenceIds?.includes(activeEvidenceId)) {
        patchMutation.mutate({ viewedEvidenceIds: [activeEvidenceId] });
      }
    }
  }, [activeEvidenceId]);

  if (invLoading || caseLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-amber" />
        <p className="text-xs font-mono text-zinc-500 mt-3">Loading Investigation Room...</p>
      </div>
    );
  }

  if (!investigation || !caseDoc) {
    return (
      <div className="p-12 text-center text-zinc-500">
        <p>Investigation could not be located.</p>
      </div>
    );
  }

  const { suspects = [], evidence = [] } = caseDoc;
  const maxAttempts = ATTEMPTS_BY_DIFFICULTY[caseDoc.difficulty] || 2;
  const wrongAttempts = investigation.accusations?.filter((a) => !a.correct).length || 0;
  const attemptsRemaining = Math.max(0, maxAttempts - wrongAttempts);
  const maxHints = caseDoc.difficulty === 'hard' ? 2 : 3;
  const hintsRemaining = Math.max(0, maxHints - (investigation.hintsUsed || 0));

  // Toggle pin
  const togglePin = (evidenceId) => {
    const current = investigation.pinnedEvidenceIds || [];
    const updated = current.includes(evidenceId)
      ? current.filter((id) => id !== evidenceId)
      : [...current, evidenceId];
    patchMutation.mutate({ pinnedEvidenceIds: updated });
  };

  // Link board clue
  const handleLinkBoard = (evidenceId, suspectId) => {
    const current = investigation.boardLinks || [];
    const filtered = current.filter((bl) => bl.evidenceId !== evidenceId);
    const updated = suspectId === 'unassigned' ? filtered : [...filtered, { evidenceId, suspectId }];
    patchMutation.mutate({ boardLinks: updated });
  };

  // Filter evidence
  const filteredEvidence = evidence.filter((item) => {
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesSearch =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const activeEvidence = evidence.find((e) => e.evidenceId === activeEvidenceId) || evidence[0];

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] bg-noir-950 overflow-hidden">
      {/* Top Bar */}
      <div className="h-14 bg-noir-900 border-b border-noir-800 px-3 sm:px-4 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={() => {
              setMobileView('evidence');
              setMobileDrawerOpen(!isMobileDrawerOpen);
            }}
            className="md:hidden text-zinc-400 hover:text-paper-100 p-1.5 rounded bg-noir-850 border border-noir-700 shrink-0"
            title="Toggle Clue Docket"
          >
            {isMobileDrawerOpen ? <X className="w-4 h-4 text-amber" /> : <Menu className="w-4 h-4" />}
          </button>
          <div className="min-w-0">
            <h2 className="font-serif font-bold text-xs sm:text-sm text-paper-100 truncate max-w-[130px] xs:max-w-[180px] sm:max-w-md">
              {caseDoc.title}
            </h2>
            <div className="flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] font-mono text-zinc-400">
              <span className="capitalize">{caseDoc.difficulty}</span>
              <span>•</span>
              <span className="text-amber">
                Tries: <strong className="font-bold">{attemptsRemaining}</strong>
              </span>
              <span>•</span>
              <span>
                Hints: <strong className="font-bold">{hintsRemaining}</strong>
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setAccusationOpen(true)}
          className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white font-mono font-bold text-[11px] sm:text-xs uppercase tracking-wider shadow-lg shadow-red-950/40 transition flex items-center gap-1.5 sm:gap-2 shrink-0"
        >
          <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Accuse <span className="hidden sm:inline">Culprit</span></span>
        </button>
      </div>

      {/* Main 3-Pane Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Backdrop Overlay */}
        {isMobileDrawerOpen && (
          <div
            onClick={() => setMobileDrawerOpen(false)}
            className="md:hidden fixed inset-0 bg-black/60 z-20 backdrop-blur-xs transition-opacity"
          />
        )}

        {/* Left Rail: Evidence Index (Desktop + Mobile Slide-out Drawer) */}
        <aside
          className={`absolute md:relative z-30 inset-y-0 left-0 w-80 max-w-[85vw] bg-noir-900 border-r border-noir-800 flex flex-col transition-transform duration-200 md:translate-x-0 ${
            isMobileDrawerOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
          }`}
        >
          {/* Mobile Drawer Title Bar */}
          <div className="md:hidden px-3 py-2 bg-noir-850 border-b border-noir-800 flex items-center justify-between text-xs font-mono text-zinc-400">
            <span className="font-bold text-amber uppercase tracking-wider">Evidence Docket</span>
            <button
              onClick={() => setMobileDrawerOpen(false)}
              className="text-zinc-500 hover:text-paper-100 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search & Filter */}
          <div className="p-3 border-b border-noir-800 space-y-2 bg-noir-850">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search clues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-noir-950 border border-noir-800 rounded pl-8 pr-3 py-1.5 text-xs text-paper-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber"
              />
            </div>
            <div className="flex gap-1 overflow-x-auto pb-1 text-[11px] font-mono no-scrollbar">
              {['all', 'chat', 'document', 'statement', 'cctv', 'forensic', 'image'].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-2 py-0.5 rounded capitalize whitespace-nowrap border transition ${
                    filterType === t
                      ? 'bg-amber-dim/30 border-amber text-amber font-bold'
                      : 'border-noir-800 bg-noir-950 text-zinc-500 hover:text-paper-100'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Evidence List */}
          <div className="flex-1 overflow-y-auto divide-y divide-noir-800/60 p-2 space-y-1">
            {filteredEvidence.map((item) => {
              const Icon = TYPE_ICONS[item.type] || FileText;
              const isActive = activeEvidenceId === item.evidenceId;
              const isViewed = investigation.viewedEvidenceIds?.includes(item.evidenceId);
              const isPinned = investigation.pinnedEvidenceIds?.includes(item.evidenceId);

              return (
                <div
                  key={item.evidenceId}
                  onClick={() => {
                    setActiveEvidenceId(item.evidenceId);
                    setMobileView('evidence');
                    setMobileDrawerOpen(false);
                  }}
                  className={`p-2.5 rounded-lg border transition cursor-pointer flex items-start gap-2.5 text-left relative ${
                    isActive
                      ? 'bg-noir-800 border-amber ring-1 ring-amber/50 shadow-md'
                      : 'bg-noir-950/40 border-transparent hover:bg-noir-850 hover:border-noir-800'
                  }`}
                >
                  <div className="w-8 h-8 rounded bg-noir-850 border border-noir-700/80 flex items-center justify-center text-amber shrink-0 mt-0.5">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-[10px] text-zinc-500 uppercase">
                        {item.type}
                      </span>
                      {!isViewed && (
                        <span className="w-2 h-2 rounded-full bg-amber animate-ping shrink-0" />
                      )}
                    </div>
                    <p className="font-serif font-bold text-xs text-paper-100 truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePin(item.evidenceId);
                    }}
                    className={`p-1 rounded transition shrink-0 ${
                      isPinned
                        ? 'text-amber bg-amber-dim/20'
                        : 'text-zinc-600 hover:text-zinc-300'
                    }`}
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Center: Main View (Responsive Evidence Viewer or Mobile Switched Panels) */}
        <main className="flex-1 overflow-hidden bg-noir-950 flex flex-col">
          {/* Mobile Switched Views (lg:hidden) */}
          <div className="lg:hidden flex-1 flex flex-col overflow-hidden">
            {mobileView === 'evidence' && (
              activeEvidence ? (
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  <div className="px-3 sm:px-6 py-2.5 sm:py-3 border-b border-noir-800 bg-noir-900/40 flex items-center justify-between shrink-0 gap-2">
                    <div className="min-w-0">
                      <h3 className="font-serif font-bold text-sm sm:text-base text-paper-50 truncate">
                        {activeEvidence.title}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-zinc-400 font-mono truncate">
                        {activeEvidence.discoveredAt}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setMobileDrawerOpen(true)}
                        className="md:hidden px-2 py-1 rounded text-[11px] font-mono border border-noir-700 bg-noir-850 text-amber"
                      >
                        Clues ({evidence.length})
                      </button>
                      <button
                        onClick={() => togglePin(activeEvidence.evidenceId)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-mono border transition ${
                          investigation.pinnedEvidenceIds?.includes(activeEvidence.evidenceId)
                            ? 'bg-amber text-noir-950 font-bold border-amber'
                            : 'border-noir-700 bg-noir-850 text-zinc-300 hover:border-amber'
                        }`}
                      >
                        <Pin className="w-3 h-3" />
                        <span>
                          {investigation.pinnedEvidenceIds?.includes(activeEvidence.evidenceId)
                            ? 'Pinned'
                            : 'Pin'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-hidden p-2 sm:p-4">
                    {activeEvidence.type === 'chat' && <ChatViewer payload={activeEvidence.payload} />}
                    {activeEvidence.type === 'document' && <DocumentViewer payload={activeEvidence.payload} />}
                    {activeEvidence.type === 'statement' && <StatementViewer payload={activeEvidence.payload} />}
                    {activeEvidence.type === 'cctv' && (
                      <CctvViewer
                        payload={activeEvidence.payload}
                        description={activeEvidence.description}
                      />
                    )}
                    {activeEvidence.type === 'forensic' && <ForensicViewer payload={activeEvidence.payload} />}
                    {(activeEvidence.type === 'log' || activeEvidence.type === 'audio_transcript') && (
                      <LogViewer payload={activeEvidence.payload} />
                    )}
                    {activeEvidence.type === 'image' && (
                      <ImageViewer
                        payload={activeEvidence.payload}
                        assetId={activeEvidence.assetId}
                        assetStatus={activeEvidence.assetStatus}
                        description={activeEvidence.description}
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-zinc-500">
                  <p className="text-xs">Select an evidence item from the docket to examine.</p>
                  <button
                    onClick={() => setMobileDrawerOpen(true)}
                    className="mt-3 px-3 py-1.5 rounded bg-amber text-noir-950 font-mono text-xs font-bold"
                  >
                    Open Clues Docket
                  </button>
                </div>
              )
            )}

            {mobileView === 'suspects' && (
              <div className="flex-1 overflow-y-auto p-3 sm:p-4">
                <SuspectList
                  suspects={suspects}
                  onSelectSuspect={(s) => setSelectedSuspectId(s.suspectId)}
                  selectedSuspectId={selectedSuspectId}
                />
              </div>
            )}

            {mobileView === 'notebook' && (
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 h-full">
                <Notebook
                  initialNotes={investigation.notes || ''}
                  onSave={(notes) => patchMutation.mutateAsync({ notes })}
                />
              </div>
            )}

            {mobileView === 'board' && (
              <div className="flex-1 overflow-hidden p-2 h-full">
                <EvidenceBoard
                  suspects={suspects}
                  evidence={evidence}
                  pinnedEvidenceIds={investigation.pinnedEvidenceIds || []}
                  boardLinks={investigation.boardLinks || []}
                  onLinkEvidence={handleLinkBoard}
                />
              </div>
            )}

            {mobileView === 'hints' && (
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
                <div className="p-4 rounded-lg bg-noir-950 border border-noir-800 text-xs space-y-2">
                  <div className="flex items-center justify-between text-zinc-400 font-mono">
                    <span>Hints Remaining:</span>
                    <span className="font-bold text-amber">{hintsRemaining}</span>
                  </div>
                  <p className="text-zinc-500 text-[11px] leading-relaxed">
                    Hints nudge you toward inconsistent records or timelines without spoiling the culprit.
                  </p>
                  <button
                    onClick={() => hintMutation.mutate()}
                    disabled={hintsRemaining <= 0 || hintMutation.isPending}
                    className="w-full mt-2 py-2 px-3 rounded bg-amber hover:bg-amber-glow disabled:opacity-40 text-noir-950 font-serif font-bold transition text-xs flex items-center justify-center gap-1.5"
                  >
                    {hintMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Lightbulb className="w-3.5 h-3.5" />
                    )}
                    <span>Request Deduction Nudge</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-mono uppercase text-zinc-400 font-bold">
                    Discovered Insights
                  </h4>
                  {investigation.hintLog?.length === 0 ? (
                    <p className="text-zinc-600 text-xs italic">No hints requested yet.</p>
                  ) : (
                    investigation.hintLog?.map((hint, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded bg-amber-dim/10 border border-amber/30 text-xs text-amber-glow font-serif leading-relaxed"
                      >
                        "{hint.text}"
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Desktop Center Evidence Viewer (Hidden on mobile < lg) */}
          <div className="hidden lg:flex flex-1 flex-col h-full overflow-hidden">
            {activeEvidence ? (
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="px-6 py-3 border-b border-noir-800 bg-noir-900/40 flex items-center justify-between shrink-0">
                  <div>
                    <h3 className="font-serif font-bold text-base text-paper-50">
                      {activeEvidence.title}
                    </h3>
                    <p className="text-xs text-zinc-400 font-mono">
                      Discovered: {activeEvidence.discoveredAt}
                    </p>
                  </div>
                  <button
                    onClick={() => togglePin(activeEvidence.evidenceId)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono border transition ${
                      investigation.pinnedEvidenceIds?.includes(activeEvidence.evidenceId)
                        ? 'bg-amber text-noir-950 font-bold border-amber'
                        : 'border-noir-700 bg-noir-850 text-zinc-300 hover:border-amber'
                    }`}
                  >
                    <Pin className="w-3.5 h-3.5" />
                    <span>
                      {investigation.pinnedEvidenceIds?.includes(activeEvidence.evidenceId)
                        ? 'Pinned to Board'
                        : 'Pin to Board'}
                    </span>
                  </button>
                </div>

                <div className="flex-1 overflow-hidden p-6">
                  {activeEvidence.type === 'chat' && <ChatViewer payload={activeEvidence.payload} />}
                  {activeEvidence.type === 'document' && <DocumentViewer payload={activeEvidence.payload} />}
                  {activeEvidence.type === 'statement' && <StatementViewer payload={activeEvidence.payload} />}
                  {activeEvidence.type === 'cctv' && (
                    <CctvViewer
                      payload={activeEvidence.payload}
                      description={activeEvidence.description}
                    />
                  )}
                  {activeEvidence.type === 'forensic' && <ForensicViewer payload={activeEvidence.payload} />}
                  {(activeEvidence.type === 'log' || activeEvidence.type === 'audio_transcript') && (
                    <LogViewer payload={activeEvidence.payload} />
                  )}
                  {activeEvidence.type === 'image' && (
                    <ImageViewer
                      payload={activeEvidence.payload}
                      assetId={activeEvidence.assetId}
                      assetStatus={activeEvidence.assetStatus}
                      description={activeEvidence.description}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-zinc-500">
                <p>Select an evidence item from the docket to examine.</p>
              </div>
            )}
          </div>
        </main>

        {/* Right Rail: Workspace Tabs (Desktop Only) */}
        <aside className="hidden lg:flex w-96 bg-noir-900 border-l border-noir-800 flex-col">
          {/* Tab Headers */}
          <div className="flex border-b border-noir-800 bg-noir-850 text-xs font-mono">
            {[
              { id: 'suspects', label: 'Suspects', icon: Users },
              { id: 'notebook', label: 'Notebook', icon: BookOpen },
              { id: 'board', label: 'Board', icon: Pin },
              { id: 'hints', label: 'Hints', icon: Lightbulb },
            ].map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-3 flex items-center justify-center gap-1.5 border-b-2 transition ${
                    activeTab === tab.id
                      ? 'border-amber text-amber font-bold bg-noir-900'
                      : 'border-transparent text-zinc-400 hover:text-paper-100'
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Contents */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'suspects' && (
              <SuspectList
                suspects={suspects}
                onSelectSuspect={(s) => setSelectedSuspectId(s.suspectId)}
                selectedSuspectId={selectedSuspectId}
              />
            )}
            {activeTab === 'notebook' && (
              <Notebook
                initialNotes={investigation.notes || ''}
                onSave={(notes) => patchMutation.mutateAsync({ notes })}
              />
            )}
            {activeTab === 'board' && (
              <EvidenceBoard
                suspects={suspects}
                evidence={evidence}
                pinnedEvidenceIds={investigation.pinnedEvidenceIds || []}
                boardLinks={investigation.boardLinks || []}
                onLinkEvidence={handleLinkBoard}
              />
            )}
            {activeTab === 'hints' && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-noir-950 border border-noir-800 text-xs space-y-2">
                  <div className="flex items-center justify-between text-zinc-400 font-mono">
                    <span>Hints Remaining:</span>
                    <span className="font-bold text-amber">{hintsRemaining}</span>
                  </div>
                  <p className="text-zinc-500 text-[11px] leading-relaxed">
                    Hints nudge you toward inconsistent records or timelines without spoiling the culprit.
                  </p>
                  <button
                    onClick={() => hintMutation.mutate()}
                    disabled={hintsRemaining <= 0 || hintMutation.isPending}
                    className="w-full mt-2 py-2 px-3 rounded bg-amber hover:bg-amber-glow disabled:opacity-40 text-noir-950 font-serif font-bold transition text-xs flex items-center justify-center gap-1.5"
                  >
                    {hintMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Lightbulb className="w-3.5 h-3.5" />
                    )}
                    <span>Request Deduction Nudge</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-mono uppercase text-zinc-400 font-bold">
                    Discovered Insights
                  </h4>
                  {investigation.hintLog?.length === 0 ? (
                    <p className="text-zinc-600 text-xs italic">No hints requested yet.</p>
                  ) : (
                    investigation.hintLog?.map((hint, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded bg-amber-dim/10 border border-amber/30 text-xs text-amber-glow font-serif leading-relaxed"
                      >
                        "{hint.text}"
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Mobile Bottom Navigation Bar (Hidden on desktop lg+) */}
      <div className="lg:hidden border-t border-noir-800 bg-noir-900/95 backdrop-blur flex items-center justify-around py-1.5 px-1 shrink-0 z-40 select-none">
        {[
          { id: 'evidence', label: 'Clues', icon: FileText },
          { id: 'suspects', label: 'Suspects', icon: Users },
          { id: 'notebook', label: 'Notes', icon: BookOpen },
          { id: 'board', label: 'Board', icon: Pin },
          { id: 'hints', label: 'Hints', icon: Lightbulb },
        ].map((tab) => {
          const TabIcon = tab.icon;
          const isActive = mobileView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setMobileView(tab.id);
                setMobileDrawerOpen(false);
              }}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded transition text-[11px] font-mono ${
                isActive
                  ? 'text-amber font-bold'
                  : 'text-zinc-400 hover:text-paper-100'
              }`}
            >
              <TabIcon className={`w-4 h-4 ${isActive ? 'text-amber' : 'text-zinc-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Accusation Modal */}
      <AccusationModal
        isOpen={isAccusationOpen}
        onClose={() => setAccusationOpen(false)}
        suspects={suspects}
        onSubmitAccusation={(data) => accuseMutation.mutate(data)}
        attemptsRemaining={attemptsRemaining}
        isLoading={accuseMutation.isPending}
      />
    </div>
  );
}

