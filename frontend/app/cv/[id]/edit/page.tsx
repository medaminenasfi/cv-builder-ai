'use client';

import { AppShell } from '@/components/layout/AppShell';
import { RichTextSummary } from '@/components/cv/RichTextSummary';
import {
  DEFAULT_SECTIONS,
  emptyCVData,
  newId,
  normalizeCVData,
  parseLanguagesInput,
  parseSkillsInput,
  parseTechnologiesInput,
  parseCertificationsInput,
  parseProjectsInput,
  skillsToInput,
  languagesToInput,
  technologiesToInput,
  certificationsToInput,
  projectsToInput,
} from '@/lib/cv-data-utils';
import {
  applyEnhancement,
  enhanceCV,
  exportCVPdf,
  getCV,
  importCVFileIntoExisting,
  updateCV,
  updateCVData,
} from '@/lib/cvs-api';
import { listActiveTemplates, type Template } from '@/lib/templates-api';
import type { CVData, CVExperience, CVEducation } from '@/lib/types/cv-data';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Plus, Trash2, Save, Download, ChevronDown, Briefcase, Eye, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { EditorShell } from '@/components/cv/editor/EditorShell';
import { EditorHeader } from '@/components/cv/editor/EditorHeader';
import { EditorAiSidePanel } from '@/components/cv/editor/EditorAiSidePanel';
import { EditorInlineParseWizard } from '@/components/cv/editor/EditorInlineParseWizard';
import type { EditorPanelMode } from '@/components/cv/editor/EditorModeSwitch';
import { EditorAiPanel, AI_ACTIONS, type AiActionId } from '@/components/cv/editor/EditorAiPanel';
import { SectionPanel } from '@/components/cv/editor/SectionPanel';
import { SortableList } from '@/components/cv/editor/SortableList';
import type { EditorSectionId } from '@/components/cv/editor/EditorSidebar';
import type { EnhanceResult, ParseMeta } from '@/lib/cvs-api';
import { computeResumeHealth } from '@/lib/resume-health';
import { useAutoSave } from '@/lib/use-auto-save';

const CVLivePreview = dynamic(
  () => import('@/components/cv/CVLivePreview').then((m) => m.CVLivePreview),
  { ssr: false, loading: () => <div className="h-96 bg-purple-50 rounded-xl animate-pulse" /> },
);

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white border border-purple-100 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left bg-purple-50/50 hover:bg-purple-50"
      >
        <span className="text-xs font-semibold uppercase tracking-widest text-purple-600">
          {title}
        </span>
        <ChevronDown size={16} className={`text-purple-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="p-4 space-y-3">{children}</div>}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-500">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

const inputCls =
  'w-full border border-purple-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200';

export default function CVEditorPageWrapper() {
  return (
    <Suspense
      fallback={
        <AppShell title="Edit CV">
          <p className="text-gray-500 text-sm">Loading editor…</p>
        </AppShell>
      }
    >
      <CVEditorPage />
    </Suspense>
  );
}

function CVEditorPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const { user } = useAuth();
  const importFileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [cvData, setCvData] = useState<CVData>(() => emptyCVData('en'));
  const [skillsText, setSkillsText] = useState('');
  const [languagesText, setLanguagesText] = useState('');
  const [technologiesText, setTechnologiesText] = useState('');
  const [certificationsText, setCertificationsText] = useState('');
  const [projectsText, setProjectsText] = useState('');
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enhancing, setEnhancing] = useState(false);
  const [enhancePreview, setEnhancePreview] = useState<EnhanceResult | null>(null);
  const [undoSnapshot, setUndoSnapshot] = useState<CVData | null>(null);
  const [aiActionId, setAiActionId] = useState<AiActionId | null>(null);
  const [activeSection, setActiveSection] = useState<EditorSectionId>('personal');
  const [editorMode, setEditorMode] = useState<EditorPanelMode>('manual');
  const [parseWizardOpen, setParseWizardOpen] = useState(false);
  const [parseWizardStep, setParseWizardStep] = useState(0);
  const [parseMeta, setParseMeta] = useState<ParseMeta | null>(null);
  const [importStep, setImportStep] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const applyServerCv = useCallback(
    (cv: Awaited<ReturnType<typeof getCV>>) => {
      const locale = (cv.locale ?? 'en') as CVData['meta']['locale'];
      const normalized = normalizeCVData(cv.data, locale);

      if (!normalized.personal.email && user?.email) {
        normalized.personal.email = user.email;
      }
      if (!normalized.personal.fullName && cv.title && cv.title !== 'Untitled Resume') {
        normalized.personal.fullName = cv.title;
      }

      setTitle(cv.title);
      setTemplateId(cv.templateId);
      setCvData(normalized);
      setSkillsText(skillsToInput(normalized.skills));
      setLanguagesText(languagesToInput(normalized.languages));
      setTechnologiesText(technologiesToInput(normalized.technologies));
      setCertificationsText(certificationsToInput(normalized.certifications));
      setProjectsText(projectsToInput(normalized.projects));

      const pm = normalized.meta?.parseMeta as ParseMeta | undefined;
      if (pm?.overall != null) setParseMeta(pm);

      return JSON.stringify({
        title: cv.title,
        templateId: cv.templateId,
        data: normalized,
      });
    },
    [user?.email],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cv, tpls] = await Promise.all([getCV(id), listActiveTemplates()]);
      setTemplates(tpls);
      applyServerCv(cv);
      const normalized = normalizeCVData(cv.data, (cv.locale ?? 'en') as CVData['meta']['locale']);
      const loadedHealth = computeResumeHealth(normalized);
      if (loadedHealth.score >= 25 || normalized.experience.length > 0 || normalized.personal.fullName?.trim()) {
        setEditorMode('manual');
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load CV');
    } finally {
      setLoading(false);
    }
  }, [id, applyServerCv]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (searchParams.get('ai') === '1' && !loading) {
      setEditorMode('ai');
    }
    if (searchParams.get('parse') === '1' && !loading) {
      setEditorMode('ai');
      const stored = sessionStorage.getItem(`parseMeta-${id}`);
      if (stored) {
        try {
          setParseMeta(JSON.parse(stored) as ParseMeta);
        } catch {
          /* ignore */
        }
      }
      setParseWizardOpen(true);
      setParseWizardStep(0);
    }
    const kw = searchParams.get('keywords');
    if (kw && !loading) {
      const existing = skillsText.trim();
      const added = kw.split(',').map((k) => k.trim()).filter(Boolean);
      const merged = [...new Set([...existing.split(',').map((s) => s.trim()).filter(Boolean), ...added])];
      setSkillsText(merged.join(', '));
      setActiveSection('skills');
      setMessage(`Added ${added.length} keyword(s) from job match`);
      toast.success(`Added ${added.length} keyword(s) from job match`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, searchParams]);

  const patchData = (patch: Partial<CVData>) => {
    setCvData((prev) => ({ ...prev, ...patch }));
  };

  const patchPersonal = (patch: Partial<CVData['personal']>) => {
    setCvData((prev) => ({ ...prev, personal: { ...prev.personal, ...patch } }));
  };

  const buildDataToSave = (): CVData => ({
    ...cvData,
    skills: parseSkillsInput(skillsText),
    languages: parseLanguagesInput(languagesText),
    technologies: parseTechnologiesInput(technologiesText),
    certifications: parseCertificationsInput(certificationsText),
    projects: parseProjectsInput(projectsText),
  });

  const saveSnapshot = useMemo(
    () =>
      JSON.stringify({
        title,
        templateId,
        data: buildDataToSave(),
      }),
    [title, templateId, cvData, skillsText, languagesText, technologiesText, certificationsText, projectsText],
  );

  const autoSavePayload = useCallback(async () => {
    const dataToSave = buildDataToSave();
    await updateCV(id, { title, templateId: templateId ?? undefined });
    await updateCVData(id, dataToSave as unknown as Record<string, unknown>);
    setCvData(dataToSave);
  }, [id, title, templateId, cvData, skillsText, languagesText, technologiesText, certificationsText, projectsText]);

  const { status: autoSaveStatus, markSaved, flushOnBlur } = useAutoSave({
    enabled: !loading && !importing,
    snapshot: saveSnapshot,
    debounceMs: 5000,
    onSave: autoSavePayload,
  });

  const didInitialMark = useRef(false);
  useEffect(() => {
    if (!loading && !didInitialMark.current) {
      didInitialMark.current = true;
      markSaved(saveSnapshot);
    }
  }, [loading, saveSnapshot, markSaved]);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const dataToSave = buildDataToSave();
      await updateCV(id, { title, templateId: templateId ?? undefined });
      await updateCVData(id, dataToSave as unknown as Record<string, unknown>);
      setCvData(dataToSave);
      markSaved(saveSnapshot);
      setMessage('Saved successfully');
      toast.success('Saved successfully');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const runAiAction = async (action: (typeof AI_ACTIONS)[number]) => {
    setEnhancing(true);
    setAiActionId(action.id);
    setError(null);
    try {
      await save();
      setUndoSnapshot(buildDataToSave());
      const result = await enhanceCV(id, action.sections, action.tone);
      setEnhancePreview(result);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Enhance failed');
    } finally {
      setEnhancing(false);
      setAiActionId(null);
    }
  };

  const applyEnhancePreview = async () => {
    if (!enhancePreview) return;
    setEnhancing(true);
    try {
      await applyEnhancement(id, enhancePreview.after as unknown as Record<string, unknown>);
      setCvData(enhancePreview.after);
      setSkillsText(skillsToInput(enhancePreview.after.skills));
      setLanguagesText(languagesToInput(enhancePreview.after.languages));
      setTechnologiesText(technologiesToInput(enhancePreview.after.technologies));
      setCertificationsText(certificationsToInput(enhancePreview.after.certifications));
      setProjectsText(projectsToInput(enhancePreview.after.projects));
      setEnhancePreview(null);
      setMessage('AI changes applied');
      toast.success('AI changes applied');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Apply failed');
    } finally {
      setEnhancing(false);
    }
  };

  const undoEnhance = () => {
    if (!undoSnapshot) return;
    setCvData(undoSnapshot);
    setSkillsText(skillsToInput(undoSnapshot.skills));
    setLanguagesText(languagesToInput(undoSnapshot.languages));
    setTechnologiesText(technologiesToInput(undoSnapshot.technologies));
    setCertificationsText(certificationsToInput(undoSnapshot.certifications));
    setProjectsText(projectsToInput(undoSnapshot.projects));
    setUndoSnapshot(null);
    setEnhancePreview(null);
    setMessage('Changes reverted');
  };

  const openPreview = async () => {
    try {
      await save();
      router.push(`/cv/${id}/preview`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not open preview');
    }
  };

  const printPdf = async () => {
    try {
      await save();
      await exportCVPdf(id);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Export failed');
    }
  };

  const downloadPdf = async () => {
    setDownloadingPdf(true);
    setError(null);
    try {
      await save();
      const safeName = (title || 'resume').replace(/[^\w\-]+/g, '_').slice(0, 60);
      await exportCVPdf(id, `${safeName}.pdf`);
      setMessage('PDF downloaded');
      toast.success('PDF downloaded');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'PDF download failed');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleImportFile = async (file: File | undefined) => {
    if (!file) return;
    setImporting(true);
    setImportStep('Uploading…');
    setError(null);
    setMessage(null);
    setEditorMode('ai');
    try {
      setImportStep('Extracting text…');
      await new Promise((r) => setTimeout(r, 200));
      setImportStep('AI parsing sections…');
      const result = await importCVFileIntoExisting(id, file);
      const cv = await getCV(id);
      const snap = applyServerCv(cv);
      markSaved(snap);

      if (result.parseMeta) {
        setParseMeta(result.parseMeta);
        sessionStorage.setItem(`parseMeta-${id}`, JSON.stringify(result.parseMeta));
      }

      setParseWizardStep(0);
      setParseWizardOpen(true);

      const normalized = normalizeCVData(cv.data, (cv.locale ?? 'en') as CVData['meta']['locale']);
      const expCount = normalized.experience.length;
      const eduCount = normalized.education.length;
      const hasSummary = (normalized.summary?.trim().length ?? 0) >= 20;
      const hasLocation = Boolean(normalized.personal.location?.trim());

      if (result.parseMeta && !result.parseMeta.usedAi) {
        toast.warning('Basic parse mode — set OPENROUTER_API_KEY for full AI extraction', { duration: 5000 });
      }

      const parts: string[] = [];
      if (expCount) parts.push(`${expCount} job${expCount > 1 ? 's' : ''}`);
      if (eduCount) parts.push(`${eduCount} education`);
      if (hasSummary) parts.push('summary');
      if (hasLocation) parts.push('location');

      if (parts.length) {
        toast.success(`Imported: ${parts.join(', ')} — review on the left`, { duration: 5000 });
      } else {
        toast.warning('Import done — fill in missing fields in the review panel', { duration: 4000 });
      }
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Import failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setImporting(false);
      setImportStep(null);
      if (importFileRef.current) importFileRef.current.value = '';
    }
  };

  const finishParseWizard = async () => {
    setSaving(true);
    try {
      await save();
      setParseWizardOpen(false);
      setEditorMode('manual');
      toast.success('Imported data saved — edit manually anytime');
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const addExperience = () => {
    const entry: CVExperience = {
      id: newId(),
      role: '',
      company: '',
      startDate: '',
      endDate: 'present',
      bullets: [''],
    };
    patchData({ experience: [...cvData.experience, entry] });
  };

  const updateExperience = (index: number, patch: Partial<CVExperience>) => {
    const experience = cvData.experience.map((exp, i) =>
      i === index ? { ...exp, ...patch } : exp,
    );
    patchData({ experience });
  };

  const removeExperience = (index: number) => {
    patchData({ experience: cvData.experience.filter((_, i) => i !== index) });
  };

  const addEducation = () => {
    const entry: CVEducation = {
      id: newId(),
      institution: '',
      degree: '',
      startDate: '',
      endDate: '',
    };
    patchData({ education: [...cvData.education, entry] });
  };

  const updateEducation = (index: number, patch: Partial<CVEducation>) => {
    const education = cvData.education.map((edu, i) =>
      i === index ? { ...edu, ...patch } : edu,
    );
    patchData({ education });
  };

  const removeEducation = (index: number) => {
    patchData({ education: cvData.education.filter((_, i) => i !== index) });
  };

  const previewData = useMemo(
    () => buildDataToSave(),
    [cvData, skillsText, languagesText, technologiesText, certificationsText, projectsText],
  );

  const previewRevision = useMemo(
    () => JSON.stringify(previewData) || '{}',
    [previewData],
  );
  const health = useMemo(() => computeResumeHealth(previewData), [previewData]);

  const parseImportStats = useMemo(
    () => ({
      experienceCount: cvData.experience.length,
      educationCount: cvData.education.length,
      hasSummary: (cvData.summary?.trim().length ?? 0) >= 20,
      hasLocation: Boolean(cvData.personal.location?.trim()),
      skillsCount: cvData.skills.length,
      languagesCount: cvData.languages.length,
    }),
    [cvData],
  );

  const toggleSection = (key: string) => {
    setCvData((prev) => {
      const current = prev.meta.sections ?? [...DEFAULT_SECTIONS];
      const next = current.includes(key)
        ? current.filter((s) => s !== key)
        : [...current, key];
      return { ...prev, meta: { ...prev.meta, sections: next } };
    });
  };

  const selectedTemplate = templates.find((t) => t.id === templateId);

  if (loading) {
    return (
      <AppShell title="Edit CV">
        <p className="text-gray-500 text-sm">Loading editor…</p>
      </AppShell>
    );
  }

  return (
    <AppShell title="" hideTopBar fullBleed>
      <EditorHeader
        title={title}
        health={health}
        autoSaveStatus={autoSaveStatus}
        downloadingPdf={downloadingPdf}
        onDownloadPdf={() => void downloadPdf()}
      />

      <div className="px-4 sm:px-6 py-4 max-w-[1800px] mx-auto w-full">
      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {message && (
        <p className="mb-4 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
          {message}
        </p>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-purple-200 text-purple-700 text-xs rounded-lg disabled:opacity-50"
        >
          <Save size={14} />
          {saving ? 'Saving…' : 'Save now'}
        </button>
        <Link
          href={`/cv/${id}/review`}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-purple-200 text-purple-700 text-xs rounded-lg"
        >
          Review wizard
        </Link>
        <Link
          href={`/job-match?cvId=${id}`}
          className="flex items-center gap-1.5 px-3 py-1.5 text-white text-xs rounded-lg font-medium"
          style={{ background: 'linear-gradient(to right, #7c3aed, #a855f7)' }}
        >
          <Briefcase size={14} />
          Job Match
        </Link>
        <div className="relative">
          <button
            type="button"
            onClick={() => setExportOpen((o) => !o)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-purple-200 text-purple-700 text-xs rounded-lg"
          >
            <Download size={14} />
            More exports
            <ChevronDown size={12} />
          </button>
          {exportOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} aria-hidden />
              <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-purple-100 rounded-lg shadow-lg py-1 min-w-[160px]">
                <button type="button" onClick={() => { setExportOpen(false); openPreview(); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-purple-50 text-left">
                  <Eye size={12} /> A4 preview
                </button>
                <button type="button" onClick={() => { setExportOpen(false); printPdf(); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-purple-50 text-left">
                  <Printer size={12} /> Browser print
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {enhancePreview && editorMode === 'ai' && !parseWizardOpen && (
        <div className="mb-4 xl:hidden">
          <EditorAiPanel
            loading={enhancing}
            activeAction={aiActionId}
            preview={enhancePreview}
            onRun={runAiAction}
            onApply={applyEnhancePreview}
            onDiscard={() => setEnhancePreview(null)}
            onUndo={undoEnhance}
            canUndo={Boolean(undoSnapshot)}
          />
        </div>
      )}

      <EditorShell
        mode={editorMode}
        onModeChange={setEditorMode}
        sidebarActive={activeSection}
        onSectionSelect={setActiveSection}
        preview={
          <CVLivePreview
            cvId={id}
            data={previewData as unknown as Record<string, unknown>}
            dataRevision={previewRevision}
            templateId={templateId}
            templateName={selectedTemplate?.name}
          />
        }
        manualPanel={
        <div className="space-y-4 pb-8" onBlur={() => void flushOnBlur()}>
          <SectionPanel sectionId="settings">
          <Section title="Resume & Template">
            <Field label="CV title">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputCls}
                placeholder="My Resume"
              />
            </Field>
            <Field label="Template">
              <select
                value={templateId ?? ''}
                onChange={(e) => setTemplateId(e.target.value || null)}
                className={inputCls}
              >
                <option value="">Default (no template)</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              {!templates.length && (
                <p className="text-xs text-gray-400 mt-1">
                  <Link href="/templates" className="text-purple-600 hover:underline">
                    Browse templates
                  </Link>{' '}
                  to assign a design
                </p>
              )}
            </Field>
            <Field label="Visible sections">
              <div className="flex flex-wrap gap-2 mt-1">
                {DEFAULT_SECTIONS.map((key) => {
                  const active = cvData.meta.sections?.includes(key) ?? true;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleSection(key)}
                      className={`text-[10px] px-2 py-1 rounded-full border capitalize ${
                        active
                          ? 'bg-purple-100 border-purple-200 text-purple-700'
                          : 'bg-gray-50 border-gray-200 text-gray-400'
                      }`}
                    >
                      {key}
                    </button>
                  );
                })}
              </div>
            </Field>
          </Section>
          </SectionPanel>

          <SectionPanel sectionId="personal">
          <Section title="Personal Info">
            <Field label="Full name">
              <input
                value={cvData.personal.fullName}
                onChange={(e) => patchPersonal({ fullName: e.target.value })}
                className={inputCls}
                placeholder="Mohamed Amine Nasfi"
              />
            </Field>
            <Field label="Job title">
              <input
                value={cvData.personal.title}
                onChange={(e) => patchPersonal({ title: e.target.value })}
                className={inputCls}
                placeholder="Full-Stack Developer"
              />
            </Field>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Email">
                <input
                  type="email"
                  value={cvData.personal.email}
                  onChange={(e) => patchPersonal({ email: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Phone">
                <input
                  value={cvData.personal.phone ?? ''}
                  onChange={(e) => patchPersonal({ phone: e.target.value })}
                  className={inputCls}
                  placeholder="+216 …"
                />
              </Field>
            </div>
            <Field label="Location">
              <input
                value={cvData.personal.location ?? ''}
                onChange={(e) => patchPersonal({ location: e.target.value })}
                className={inputCls}
                placeholder="Gabès, Tunisia"
              />
            </Field>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="LinkedIn URL">
                <input
                  value={cvData.personal.linkedin ?? ''}
                  onChange={(e) => patchPersonal({ linkedin: e.target.value })}
                  className={inputCls}
                  placeholder="https://linkedin.com/in/…"
                />
              </Field>
              <Field label="Portfolio / Website">
                <input
                  value={cvData.personal.website ?? ''}
                  onChange={(e) => patchPersonal({ website: e.target.value })}
                  className={inputCls}
                  placeholder="https://…"
                />
              </Field>
            </div>
          </Section>
          </SectionPanel>

          <SectionPanel sectionId="summary">
          <Section title="Summary / Profil">
            <RichTextSummary
              value={cvData.summary ?? ''}
              onChange={(text) => patchData({ summary: text })}
              placeholder="Professional summary…"
            />
          </Section>
          </SectionPanel>

          <SectionPanel sectionId="experience">
          <Section title="Experience">
            {cvData.experience.length === 0 && (
              <p className="text-xs text-gray-400">No experience yet — add your first role.</p>
            )}
            <SortableList
              items={cvData.experience}
              onReorder={(experience) => patchData({ experience })}
              renderItem={(exp, index) => (
              <div className="border border-purple-50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-purple-600">Role #{index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeExperience(index)}
                    className="text-red-400 hover:text-red-600 p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <input
                  value={exp.role}
                  onChange={(e) => updateExperience(index, { role: e.target.value })}
                  className={inputCls}
                  placeholder="Job title"
                />
                <input
                  value={exp.company}
                  onChange={(e) => updateExperience(index, { company: e.target.value })}
                  className={inputCls}
                  placeholder="Company · Location"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={exp.startDate}
                    onChange={(e) => updateExperience(index, { startDate: e.target.value })}
                    className={inputCls}
                    placeholder="Start (e.g. Jan 2026)"
                  />
                  <input
                    value={exp.endDate === 'present' ? 'Present' : (exp.endDate ?? '')}
                    onChange={(e) =>
                      updateExperience(index, {
                        endDate: e.target.value.toLowerCase() === 'present' ? 'present' : e.target.value,
                      })
                    }
                    className={inputCls}
                    placeholder="End or Present"
                  />
                </div>
                <textarea
                  value={(exp.bullets ?? []).join('\n')}
                  onChange={(e) =>
                    updateExperience(index, {
                      bullets: e.target.value.split('\n').filter((b) => b.trim()),
                    })
                  }
                  rows={4}
                  className={inputCls}
                  placeholder="One achievement per line"
                />
              </div>
              )}
            />
            <button
              type="button"
              onClick={addExperience}
              className="flex items-center gap-1 text-xs text-purple-600 hover:underline"
            >
              <Plus size={14} /> Add experience
            </button>
          </Section>
          </SectionPanel>

          <SectionPanel sectionId="education">
          <Section title="Education">
            {cvData.education.length === 0 && (
              <p className="text-xs text-gray-400">No education entries yet.</p>
            )}
            <SortableList
              items={cvData.education}
              onReorder={(education) => patchData({ education })}
              renderItem={(edu, index) => (
              <div className="border border-purple-50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs font-medium text-purple-600">School #{index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeEducation(index)}
                    className="text-red-400 hover:text-red-600 p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <input
                  value={edu.institution}
                  onChange={(e) => updateEducation(index, { institution: e.target.value })}
                  className={inputCls}
                  placeholder="University name"
                />
                <input
                  value={edu.degree}
                  onChange={(e) => updateEducation(index, { degree: e.target.value })}
                  className={inputCls}
                  placeholder="Degree & mention"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={edu.startDate}
                    onChange={(e) => updateEducation(index, { startDate: e.target.value })}
                    className={inputCls}
                    placeholder="Start year"
                  />
                  <input
                    value={edu.endDate ?? ''}
                    onChange={(e) => updateEducation(index, { endDate: e.target.value })}
                    className={inputCls}
                    placeholder="End year"
                  />
                </div>
              </div>
              )}
            />
            <button
              type="button"
              onClick={addEducation}
              className="flex items-center gap-1 text-xs text-purple-600 hover:underline"
            >
              <Plus size={14} /> Add education
            </button>
          </Section>
          </SectionPanel>

          <SectionPanel sectionId="skills">
          <Section title="Skills">
            <textarea
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              rows={3}
              className={inputCls}
              placeholder="Communication, teamwork, problem solving…"
            />
            <p className="text-[10px] text-gray-400">Soft skills — separate with commas</p>
          </Section>
          </SectionPanel>

          <SectionPanel sectionId="languages">
          <Section title="Languages">
            <textarea
              value={languagesText}
              onChange={(e) => setLanguagesText(e.target.value)}
              rows={4}
              className={inputCls}
              placeholder={'Français — Courant\nEnglish — Fluent\nالعربية — Intermédiaire'}
            />
            <p className="text-[10px] text-gray-400">One per line: Language — Level</p>
          </Section>
          </SectionPanel>

          <SectionPanel sectionId="technologies">
          <Section title="Technologies">
            <textarea
              value={technologiesText}
              onChange={(e) => setTechnologiesText(e.target.value)}
              rows={4}
              className={inputCls}
              placeholder="React, Node.js, Docker, PostgreSQL, Python…"
            />
            <p className="text-[10px] text-gray-400">Tools & frameworks — separate with commas</p>
          </Section>
          </SectionPanel>

          <SectionPanel sectionId="certifications">
          <Section title="Certifications" defaultOpen={false}>
            <textarea
              value={certificationsText}
              onChange={(e) => setCertificationsText(e.target.value)}
              rows={4}
              className={inputCls}
              placeholder={'AWS Solutions Architect — Amazon — 2023\nPMP — PMI — 2022'}
            />
            <p className="text-[10px] text-gray-400">One per line: Name — Issuer — Date</p>
          </Section>
          </SectionPanel>

          <SectionPanel sectionId="projects">
          <Section title="Projects" defaultOpen={false}>
            <textarea
              value={projectsText}
              onChange={(e) => setProjectsText(e.target.value)}
              rows={6}
              className={inputCls}
              placeholder={'E-commerce Platform — Built with React\n- Increased conversion 20%\n- Integrated Stripe'}
            />
            <p className="text-[10px] text-gray-400">Project blocks: title line, then bullet lines starting with -</p>
          </Section>
          </SectionPanel>
        </div>
        }
        aiPanel={
          <EditorAiSidePanel
            cvId={id}
            importing={importing}
            importStep={importStep}
            fileInputRef={importFileRef}
            onImportClick={() => importFileRef.current?.click()}
            onFileSelect={handleImportFile}
            parseWizard={
              parseWizardOpen ? (
                <EditorInlineParseWizard
                  step={parseWizardStep}
                  onStepChange={setParseWizardStep}
                  parseMeta={parseMeta}
                  importStats={parseImportStats}
                  saving={saving}
                  onFinish={() => void finishParseWizard()}
                  onCancel={() => {
                    setParseWizardOpen(false);
                    setEditorMode('manual');
                  }}
                >
                  {parseWizardStep === 0 && (
                    <div className="space-y-3">
                      <Field label="CV title">
                        <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
                      </Field>
                      <Field label="Template">
                        <select value={templateId ?? ''} onChange={(e) => setTemplateId(e.target.value || null)} className={inputCls}>
                          <option value="">Default</option>
                          {templates.map((t) => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Full name">
                        <input value={cvData.personal.fullName} onChange={(e) => patchPersonal({ fullName: e.target.value })} className={inputCls} />
                      </Field>
                      <Field label="Job title">
                        <input value={cvData.personal.title} onChange={(e) => patchPersonal({ title: e.target.value })} className={inputCls} />
                      </Field>
                      <div className="grid grid-cols-2 gap-2">
                        <Field label="Email">
                          <input type="email" value={cvData.personal.email} onChange={(e) => patchPersonal({ email: e.target.value })} className={inputCls} />
                        </Field>
                        <Field label="Phone">
                          <input value={cvData.personal.phone ?? ''} onChange={(e) => patchPersonal({ phone: e.target.value })} className={inputCls} />
                        </Field>
                      </div>
                      <Field label="Location">
                        <input value={cvData.personal.location ?? ''} onChange={(e) => patchPersonal({ location: e.target.value })} className={inputCls} />
                      </Field>
                      <div className="grid grid-cols-2 gap-2">
                        <Field label="LinkedIn">
                          <input value={cvData.personal.linkedin ?? ''} onChange={(e) => patchPersonal({ linkedin: e.target.value })} className={inputCls} />
                        </Field>
                        <Field label="Website">
                          <input value={cvData.personal.website ?? ''} onChange={(e) => patchPersonal({ website: e.target.value })} className={inputCls} />
                        </Field>
                      </div>
                    </div>
                  )}
                  {parseWizardStep === 1 && (
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-medium text-gray-700 mb-1.5">Professional summary</p>
                        <RichTextSummary value={cvData.summary ?? ''} onChange={(text) => patchData({ summary: text })} placeholder="Profile summary — who you are and what you offer…" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-700 mb-1.5">Experience ({cvData.experience.length})</p>
                        {cvData.experience.length === 0 && (
                          <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5 mb-2">
                            No jobs detected — add them below or re-import your CV.
                          </p>
                        )}
                        <div className="space-y-3">
                          {cvData.experience.map((exp, index) => (
                            <div key={exp.id} className="border border-purple-50 rounded-lg p-3 space-y-2">
                              <input value={exp.role} onChange={(e) => updateExperience(index, { role: e.target.value })} className={inputCls} placeholder="Job title" />
                              <input value={exp.company} onChange={(e) => updateExperience(index, { company: e.target.value })} className={inputCls} placeholder="Company" />
                              <div className="grid grid-cols-2 gap-2">
                                <input value={exp.startDate} onChange={(e) => updateExperience(index, { startDate: e.target.value })} className={inputCls} placeholder="Start" />
                                <input
                                  value={exp.endDate === 'present' ? 'Present' : (exp.endDate ?? '')}
                                  onChange={(e) => updateExperience(index, { endDate: e.target.value.toLowerCase() === 'present' ? 'present' : e.target.value })}
                                  className={inputCls}
                                  placeholder="End"
                                />
                              </div>
                              <textarea
                                value={(exp.bullets ?? []).join('\n')}
                                onChange={(e) => updateExperience(index, { bullets: e.target.value.split('\n').filter(Boolean) })}
                                rows={3}
                                className={inputCls}
                                placeholder="Achievements, one per line"
                              />
                            </div>
                          ))}
                          <button type="button" onClick={addExperience} className="text-xs text-purple-600 hover:underline flex items-center gap-1">
                            <Plus size={14} /> Add job
                          </button>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-700 mb-1.5">Education ({cvData.education.length})</p>
                        <div className="space-y-3">
                          {cvData.education.map((edu, index) => (
                            <div key={edu.id} className="border border-purple-50 rounded-lg p-3 space-y-2">
                              <input value={edu.institution} onChange={(e) => updateEducation(index, { institution: e.target.value })} className={inputCls} placeholder="School" />
                              <input value={edu.degree} onChange={(e) => updateEducation(index, { degree: e.target.value })} className={inputCls} placeholder="Degree" />
                              <div className="grid grid-cols-2 gap-2">
                                <input value={edu.startDate} onChange={(e) => updateEducation(index, { startDate: e.target.value })} className={inputCls} placeholder="Start" />
                                <input value={edu.endDate ?? ''} onChange={(e) => updateEducation(index, { endDate: e.target.value })} className={inputCls} placeholder="End" />
                              </div>
                            </div>
                          ))}
                          <button type="button" onClick={addEducation} className="text-xs text-purple-600 hover:underline flex items-center gap-1">
                            <Plus size={14} /> Add education
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  {parseWizardStep === 2 && (
                    <div className="space-y-3">
                      <Field label="Skills">
                        <textarea value={skillsText} onChange={(e) => setSkillsText(e.target.value)} rows={2} className={inputCls} />
                      </Field>
                      <Field label="Languages">
                        <textarea value={languagesText} onChange={(e) => setLanguagesText(e.target.value)} rows={2} className={inputCls} />
                      </Field>
                      <Field label="Technologies">
                        <textarea value={technologiesText} onChange={(e) => setTechnologiesText(e.target.value)} rows={2} className={inputCls} />
                      </Field>
                      <Field label="Certifications">
                        <textarea value={certificationsText} onChange={(e) => setCertificationsText(e.target.value)} rows={2} className={inputCls} placeholder="Name — Issuer — Year" />
                      </Field>
                      <Field label="Projects">
                        <textarea value={projectsText} onChange={(e) => setProjectsText(e.target.value)} rows={3} className={inputCls} placeholder="Project title, then bullet lines" />
                      </Field>
                    </div>
                  )}
                </EditorInlineParseWizard>
              ) : null
            }
            aiPanel={
              <EditorAiPanel
                loading={enhancing}
                activeAction={aiActionId}
                preview={enhancePreview}
                onRun={runAiAction}
                onApply={applyEnhancePreview}
                onDiscard={() => setEnhancePreview(null)}
                onUndo={undoEnhance}
                canUndo={Boolean(undoSnapshot)}
              />
            }
          />
        }
      />
      </div>
    </AppShell>
  );
}
