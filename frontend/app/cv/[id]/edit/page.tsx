'use client';

import { AppShell } from '@/components/layout/AppShell';
import { CVLivePreview } from '@/components/cv/CVLivePreview';
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
  exportCVHtml,
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
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Trash2, Save, Sparkles, Download, ChevronDown, Briefcase, FileUp, Eye, Printer } from 'lucide-react';
import { useAutoSave } from '@/lib/use-auto-save';

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

export default function CVEditorPage() {
  const params = useParams();
  const router = useRouter();
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
  const [tone, setTone] = useState<'professional' | 'creative' | 'technical' | 'academic'>('professional');
  const [enhancing, setEnhancing] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cv, tpls] = await Promise.all([
        getCV(id),
        listActiveTemplates(),
      ]);
      setTitle(cv.title);
      setTemplateId(cv.templateId);
      setTemplates(tpls);

      const locale = (cv.locale ?? 'en') as CVData['meta']['locale'];
      const normalized = normalizeCVData(cv.data, locale);

      if (!normalized.personal.email && user?.email) {
        normalized.personal.email = user.email;
      }
      if (!normalized.personal.fullName && cv.title && cv.title !== 'Untitled Resume') {
        normalized.personal.fullName = cv.title;
      }

      setCvData(normalized);
      setSkillsText(skillsToInput(normalized.skills));
      setLanguagesText(languagesToInput(normalized.languages));
      setTechnologiesText(technologiesToInput(normalized.technologies));
      setCertificationsText(certificationsToInput(normalized.certifications));
      setProjectsText(projectsToInput(normalized.projects));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load CV');
    } finally {
      setLoading(false);
    }
  }, [id, user?.email]);

  useEffect(() => {
    load();
  }, [load]);

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
    await updateCVData(id, dataToSave);
    setCvData(dataToSave);
  }, [id, title, templateId, cvData, skillsText, languagesText, technologiesText, certificationsText, projectsText]);

  const { status: autoSaveStatus, markSaved } = useAutoSave({
    enabled: !loading,
    snapshot: saveSnapshot,
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
      await updateCVData(id, dataToSave);
      setCvData(dataToSave);
      markSaved(saveSnapshot);
      setMessage('Saved successfully');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const enhance = async () => {
    setEnhancing(true);
    setError(null);
    try {
      await save();
      const result = await enhanceCV(id, ['summary', 'experience', 'skills'], tone);
      await applyEnhancement(id, result.after as unknown as Record<string, unknown>);
      setCvData(result.after);
      setSkillsText(skillsToInput(result.after.skills));
      setLanguagesText(languagesToInput(result.after.languages));
      setTechnologiesText(technologiesToInput(result.after.technologies));
      setCertificationsText(certificationsToInput(result.after.certifications));
      setProjectsText(projectsToInput(result.after.projects));
      setMessage(`CV enhanced (${tone} tone) — review changes`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Enhance failed');
    } finally {
      setEnhancing(false);
    }
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
      const { html } = await exportCVHtml(id);
      const w = window.open('', '_blank');
      if (!w) {
        setError('Allow pop-ups to export PDF');
        return;
      }
      w.document.write(html);
      w.document.close();
      w.onload = () => {
        w.focus();
        w.print();
      };
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
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'PDF download failed');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleImportFile = async (file: File | undefined) => {
    if (!file) return;
    const ok = window.confirm(
      'Import will replace all current CV fields with parsed data from your file. Continue?',
    );
    if (!ok) {
      if (importFileRef.current) importFileRef.current.value = '';
      return;
    }
    setImporting(true);
    setError(null);
    setMessage(null);
    try {
      await importCVFileIntoExisting(id, file);
      await load();
      setMessage('CV imported — pick a template and review your fields');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Import failed');
    } finally {
      setImporting(false);
      if (importFileRef.current) importFileRef.current.value = '';
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

  const previewData: CVData = buildDataToSave();

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
    <AppShell
      title="Edit CV"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500 hidden sm:inline">
            {autoSaveStatus === 'saving' && 'Saving…'}
            {autoSaveStatus === 'dirty' && 'Unsaved changes'}
            {autoSaveStatus === 'saved' && 'All saved'}
            {autoSaveStatus === 'error' && 'Auto-save failed'}
          </span>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white text-sm rounded-lg disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Saving…' : 'Save'}
          </button>
          <Link
            href={`/job-match?cvId=${id}`}
            className="flex items-center gap-1.5 px-4 py-2 border border-purple-200 text-purple-700 text-sm rounded-lg"
          >
            <Briefcase size={16} />
            Job Match
          </Link>
          <select
            value={tone}
            onChange={(e) =>
              setTone(e.target.value as typeof tone)
            }
            className="border border-purple-100 rounded-lg px-2 py-2 text-sm text-gray-700"
            aria-label="Enhance tone"
          >
            <option value="professional">Professional</option>
            <option value="creative">Creative</option>
            <option value="technical">Technical</option>
            <option value="academic">Academic</option>
          </select>
          <button
            type="button"
            onClick={enhance}
            disabled={enhancing}
            className="flex items-center gap-1.5 px-4 py-2 border border-purple-200 text-purple-700 text-sm rounded-lg disabled:opacity-50"
          >
            <Sparkles size={16} />
            {enhancing ? 'Enhancing…' : 'AI Enhance'}
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setExportOpen((o) => !o)}
              className="flex items-center gap-1.5 px-4 py-2 border border-purple-200 text-purple-700 text-sm rounded-lg"
            >
              <Download size={16} />
              Export
              <ChevronDown size={14} />
            </button>
            {exportOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setExportOpen(false)}
                  aria-hidden
                />
                <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-purple-100 rounded-lg shadow-lg py-1 min-w-[180px]">
                  <button
                    type="button"
                    onClick={() => {
                      setExportOpen(false);
                      openPreview();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 text-left"
                  >
                    <Eye size={14} />
                    A4 preview
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setExportOpen(false);
                      void downloadPdf();
                    }}
                    disabled={downloadingPdf}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 text-left disabled:opacity-50"
                  >
                    <Download size={14} />
                    {downloadingPdf ? 'Generating PDF…' : 'Download PDF'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setExportOpen(false);
                      printPdf();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 text-left"
                  >
                    <Printer size={14} />
                    Browser print
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      }
    >
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

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-4 pb-8">
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
            <div className="pt-2 border-t border-purple-50">
              <p className="text-xs font-medium text-gray-500 mb-2">Import resume</p>
              <button
                type="button"
                onClick={() => importFileRef.current?.click()}
                disabled={importing}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-dashed border-purple-200 rounded-lg text-purple-700 hover:bg-purple-50 disabled:opacity-50 w-full justify-center"
              >
                <FileUp size={16} />
                {importing ? 'Parsing PDF/Word…' : 'Import PDF or Word (AI parse)'}
              </button>
              <p className="text-[10px] text-gray-400 mt-1.5">
                Replaces current fields. Choose a template above to apply a design after import.
              </p>
              <input
                ref={importFileRef}
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={(e) => handleImportFile(e.target.files?.[0])}
              />
            </div>
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

          <Section title="Summary / Profil">
            <RichTextSummary
              value={cvData.summary ?? ''}
              onChange={(text) => patchData({ summary: text })}
              placeholder="Professional summary…"
            />
          </Section>

          <Section title="Experience">
            {cvData.experience.length === 0 && (
              <p className="text-xs text-gray-400">No experience yet — add your first role.</p>
            )}
            {cvData.experience.map((exp, index) => (
              <div key={exp.id} className="border border-purple-50 rounded-lg p-3 space-y-2">
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
            ))}
            <button
              type="button"
              onClick={addExperience}
              className="flex items-center gap-1 text-xs text-purple-600 hover:underline"
            >
              <Plus size={14} /> Add experience
            </button>
          </Section>

          <Section title="Education">
            {cvData.education.length === 0 && (
              <p className="text-xs text-gray-400">No education entries yet.</p>
            )}
            {cvData.education.map((edu, index) => (
              <div key={edu.id} className="border border-purple-50 rounded-lg p-3 space-y-2">
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
            ))}
            <button
              type="button"
              onClick={addEducation}
              className="flex items-center gap-1 text-xs text-purple-600 hover:underline"
            >
              <Plus size={14} /> Add education
            </button>
          </Section>

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
        </div>

        <CVLivePreview
          cvId={id}
          data={previewData}
          templateId={templateId}
          templateName={selectedTemplate?.name}
        />
      </div>
    </AppShell>
  );
}
