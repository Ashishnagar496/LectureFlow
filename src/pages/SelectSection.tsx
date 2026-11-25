import React, { useState, useEffect } from 'react';
import { useTimetable } from '../context/TimetableContext';
import { dataService } from '../services/dataService';
import { useNavigate } from 'react-router-dom';
import { Layers, CheckCircle2, Save, School, BookOpen, Upload, ArrowRight } from 'lucide-react';

const SECTION_NUMBERS = Array.from({ length: 19 }, (_, i) => i + 11); // 11 to 29

export const SelectSection: React.FC = () => {
  const { departments, sections, selectedSection, setSelectedSectionId, refreshTimetable } = useTimetable();
  const navigate = useNavigate();

  const [selectedDeptId, setSelectedDeptId] = useState<string>(
    selectedSection?.department_id || (departments[0]?.id || '11111111-1111-1111-1111-111111111111')
  );
  const [selectedSemester, setSelectedSemester] = useState<number>(
    selectedSection?.semester || 5
  );
  const [stagedSectionName, setStagedSectionName] = useState<string>(
    selectedSection?.section_name || 'CSE-11'
  );
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [customNumber, setCustomNumber] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [savedNotice, setSavedNotice] = useState<string>('');

  const selectedDept = departments.find((d) => d.id === selectedDeptId);
  const deptCode = selectedDept?.code || 'CSE';

  // Standard sections 11..29 for selected dept
  const standardSections = SECTION_NUMBERS.map((num) => `${deptCode}-${num}`);
  // Include any extra DB sections for this dept/sem
  const extraDbSections = sections
    .filter((s) => s.department_id === selectedDeptId && s.semester === selectedSemester)
    .map((s) => s.section_name)
    .filter((name) => !standardSections.includes(name));

  const dropdownSections = [...standardSections, ...extraDbSections];

  useEffect(() => {
    if (selectedSection) {
      setSelectedDeptId(selectedSection.department_id);
      setSelectedSemester(selectedSection.semester);
      setStagedSectionName(selectedSection.section_name);
      const isStandard = SECTION_NUMBERS.some(
        (n) => `${deptCode}-${n}` === selectedSection.section_name.toUpperCase()
      );
      if (!isStandard) {
        setIsCustomMode(true);
        const numPart = selectedSection.section_name.replace(/^[A-Z]+-?/i, '');
        setCustomNumber(numPart);
      } else {
        setIsCustomMode(false);
      }
    }
  }, [selectedSection, deptCode]);

  const handleDropdownChange = (val: string) => {
    if (val === '__CUSTOM__') {
      setIsCustomMode(true);
      const num = customNumber.trim();
      setStagedSectionName(num ? `${deptCode}-${num}` : `${deptCode}-`);
    } else {
      setIsCustomMode(false);
      setStagedSectionName(val);
    }
  };

  const handleCustomNumberChange = (val: string) => {
    const cleanNum = val.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
    setCustomNumber(cleanNum);
    setStagedSectionName(cleanNum ? `${deptCode}-${cleanNum}` : `${deptCode}-`);
  };

  const handleSaveSection = async () => {
    const finalName = stagedSectionName.trim().toUpperCase();
    if (!finalName || finalName.endsWith('-')) return;
    setSaving(true);
    setSavedNotice('');
    try {
      const sec = await dataService.ensureSectionExists(selectedDeptId, selectedSemester, finalName);
      await setSelectedSectionId(sec.id);
      await refreshTimetable();
      setSavedNotice(
        `Saved ${sec.section_name} (Semester ${sec.semester}). Timetable extraction will now target only ${sec.section_name}.`
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      <div className="pb-3 border-b border-[#1F2937]">
        <div className="flex items-center space-x-2 text-[#9CA3AF] text-xs font-semibold uppercase tracking-wider mb-1">
          <Layers className="w-4 h-4 text-[#60A5FA]" />
          <span>Academic Cohort</span>
        </div>
        <h1 className="text-2xl font-bold text-[#F9FAFB]">Select Department, Semester &amp; Section</h1>
        <p className="text-xs text-[#9CA3AF] mt-0.5">
          Select your semester (Sem 1–8) and section ({deptCode}-11 to {deptCode}-29 or any custom number), then click <strong>Save Section</strong>.
        </p>
      </div>

      {savedNotice && (
        <div className="p-4 rounded-xl border border-[#166534] bg-[#166534] text-[#60A5FA] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-[#60A5FA] shrink-0" />
            <span className="font-medium">{savedNotice}</span>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => navigate('/admin/upload')}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#111827] border border-[#166534] text-[#60A5FA] text-xs font-semibold hover:bg-[#166534]"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload .xlsx</span>
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8]"
            >
              <span>Schedule</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 1. Department + Sem 1 to Sem 8 */}
      <div className="bg-[#111827] rounded-2xl border border-[#1F2937] p-5 sm:p-6 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-brand-text mb-1.5 flex items-center space-x-1.5">
            <School className="w-3.5 h-3.5 text-[#60A5FA]" />
            <span>1. Department</span>
          </label>
          <select
            value={selectedDeptId}
            onChange={(e) => {
              const newDeptId = e.target.value;
              setSelectedDeptId(newDeptId);
              const d = departments.find((x) => x.id === newDeptId);
              if (d) {
                setIsCustomMode(false);
                setStagedSectionName(`${d.code}-11`);
              }
            }}
            className="w-full sm:max-w-md px-3 py-2 border border-[#1F2937] rounded-xl text-sm bg-brand-bg focus:bg-[#111827] focus:outline-none"
          >
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.department_name} ({dept.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-brand-text mb-2 flex items-center space-x-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[#60A5FA]" />
            <span>2. Select Semester (Sem 1 – Sem 8)</span>
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => {
              const isSelected = selectedSemester === sem;
              return (
                <button
                  key={sem}
                  type="button"
                  onClick={() => setSelectedSemester(sem)}
                  className={`py-2 px-2 rounded-xl border text-xs font-semibold transition-colors ${
                    isSelected
                      ? 'bg-[#2563EB] text-white border-brand-primary'
                      : 'bg-brand-bg text-brand-text border-[#1F2937] hover:bg-[#111827]'
                  }`}
                >
                  Sem {sem}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Section Dropdown (CSE-11 to CSE-29 + Default Any Number) & Save */}
      <div className="bg-[#111827] rounded-2xl border border-[#1F2937] p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-[#F9FAFB]">
              3. Choose Section (Sem {selectedSemester})
            </h2>
            <p className="text-xs text-[#9CA3AF]">
              Select from {deptCode}-11 to {deptCode}-29, or choose &ldquo;{deptCode}-Any Number&rdquo; for a custom section.
            </p>
          </div>
          <span className="text-xs font-semibold text-[#60A5FA]">
            Current Saved: <strong className="text-[#F9FAFB]">{selectedSection?.section_name || 'None'}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-brand-text mb-1.5">
              Section List ({deptCode}-11 to {deptCode}-29)
            </label>
            <select
              value={isCustomMode ? '__CUSTOM__' : stagedSectionName}
              onChange={(e) => handleDropdownChange(e.target.value)}
              className="w-full px-3 py-2.5 border border-[#1F2937] rounded-xl text-sm font-semibold text-[#F9FAFB] bg-brand-bg focus:bg-[#111827] focus:outline-none"
            >
              {dropdownSections.map((secName) => (
                <option key={secName} value={secName}>
                  {secName} (Sem {selectedSemester})
                </option>
              ))}
              <option value="__CUSTOM__">
                {deptCode}-Any Number (Custom...)
              </option>
            </select>
          </div>

          {isCustomMode && (
            <div>
              <label className="block text-xs font-semibold text-brand-text mb-1.5">
                Enter Section Number ({deptCode}-___)
              </label>
              <div className="flex items-center border border-[#1F2937] rounded-xl overflow-hidden bg-brand-bg focus-within:bg-[#111827] focus-within:ring-2 focus-within:ring-brand-primary/20">
                <span className="px-3 py-2.5 text-sm font-bold text-[#F9FAFB] bg-[#111827] border-r border-[#1F2937]">
                  {deptCode}-
                </span>
                <input
                  type="text"
                  placeholder="e.g. 30 or 05"
                  value={customNumber}
                  onChange={(e) => handleCustomNumberChange(e.target.value)}
                  className="flex-1 px-3 py-2.5 text-sm font-semibold text-[#F9FAFB] bg-transparent focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-[#1F2937] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-[#9CA3AF]">
            Extraction target: <strong className="text-[#F9FAFB] font-mono">{stagedSectionName}</strong>
          </div>

          <button
            type="button"
            onClick={handleSaveSection}
            disabled={saving || !stagedSectionName || stagedSectionName.endsWith('-')}
            className="inline-flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl bg-[#2563EB] text-white text-xs font-bold hover:bg-[#1D4ED8] disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : `Save Section (${stagedSectionName})`}</span>
          </button>
        </div>
      </div>

    </div>
  );
};
