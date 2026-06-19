'use client';

import { AppShell } from '@/components/layout/AppShell';
import { CVLivePreview } from '@/components/cv/CVLivePreview';
import {
  emptyCVData,
  newId,
  normalizeCVData,
  parseSkillsInput,
  skillsToInput,
} from '@/lib/cv-data-utils';
import {
  enhanceCV,
  exportCVHtml,
  getCV,
  getVersions,
  importCV,
  updateCV,
  updateCVData,
} from '@/lib/cvs-api';
import { listActiveTemplates, type Template } from '@/lib/templates-api';
import type { CVData, CVExperience, CVEducation } from '@/lib/types/cv-data';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, Save, Sparkles, Download, ChevronDown } from 'lucide-react';

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
  const id = params.id as string;
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [cvData, setCvData] = useState<CVData>(() => emptyCVData('en'));
  const [skillsText, setSkillsText] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importText, setImportText] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cv, versions, tpls] = await Promise.all([
        getCV(id),
        getVersions(id),
        listActiveTemplates(),
      ]);
      setTitle(cv.title);
      setTemplateId(cv.templateId);
      setTemplates(tpls);

      const locale = (cv.locale ?? 'en') as CVData['meta']['locale'];
      const latest = versions[0];
      const normalized = normalizeCVData(latest?.data, locale);

      if (!normalized.personal.email && user?.email) {
        normalized.personal.email = user.email;
      }
      if (!normalized.personal.fullName && cv.title && cv.title !== 'Untitled Resume') {
        normalized.personal.fullName = cv.title;
      }

      setCvData(normalized);
      setSkillsText(skillsToInput(normalized.skills));
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

  const save = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const dataToSave: CVData = {
        ...cvData,
        skills: parseSkillsInput(skillsText),
      };
      await updateCV(id, { title, templateId: templateId ?? undefined });
      await updateCVData(id, dataToSave);
      setCvData(dataToSave);
      setMessage('Saved successfully');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const enhance = async () => {
    try {
      await save();
      const result = (await enhanceCV(id, ['summary'], 'professional')) as { summary?: string };
      if (result.summary) {
        patchData({ summary: result.summary });
        setMessage('Summary enhanced with AI');
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Enhance failed');
    }
  };

  const exportHtml = async () => {
    try {
      await save();
      const { html } = await exportCVHtml(id);
      const w = window.open('', '_blank');
      if (w) {
        w.document.write(html);
        w.document.close();
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Export failed');
    }
  };

  const handleImport = async () => {
    if (!importText.trim()) return;
    try {
      await importCV(title || 'Imported Resume', importText);
      setMessage('Import started — reload to see parsed data');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Import failed');
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

  const previewData: CVData = {
    ...cvData,
    skills: parseSkillsInput(skillsText),
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
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white text-sm rounded-lg disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={enhance}
            className="flex items-center gap-1.5 px-4 py-2 border border-purple-200 text-purple-700 text-sm rounded-lg"
          >
            <Sparkles size={16} />
            AI Enhance
          </button>
          <button
            type="button"
            onClick={exportHtml}
            className="flex items-center gap-1.5 px-4 py-2 border border-purple-200 text-purple-700 text-sm rounded-lg"
          >
            <Download size={16} />
            Export
          </button>
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
            <textarea
              value={cvData.summary ?? ''}
              onChange={(e) => patchData({ summary: e.target.value })}
              rows={5}
              className={inputCls}
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
                  value={exp.bullets.join('\n')}
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
              placeholder="React, Node.js, PostgreSQL, Docker…"
            />
            <p className="text-[10px] text-gray-400">Separate with commas or new lines</p>
          </Section>

          <Section title="Import text" defaultOpen={false}>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={3}
              className={inputCls}
              placeholder="Paste resume text to import…"
            />
            <button
              type="button"
              onClick={handleImport}
              className="mt-2 px-4 py-2 border rounded-lg text-sm"
            >
              Import
            </button>
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
