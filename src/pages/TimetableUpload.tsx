import React, { useState, useRef, useEffect } from 'react';
import { useTimetable } from '../context/TimetableContext';
import { dataService } from '../services/dataService';
import { parseTimetableFile } from '../services/timetableParser';
import type { ExtractedLectureEntry } from '../types';
import { useNavigate, Link } from 'react-router-dom';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  Image,
  CheckCircle2,
  Plus,
  Trash2,
  Edit2,
  ArrowRight,
  Layers
} from 'lucide-react';

export const TimetableUpload: React.FC = () => {
  const { departments, selectedSection, refreshTimetable } = useTimetable();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [detectedSections, setDetectedSections] = useState<string[]>([]);
  const [sheetsFound, setSheetsFound] = useState<string[]>([]);

  const [title, setTitle] = useState('Academic Master Timetable');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [semester, setSemester] = useState<number>(selectedSection?.semester || 5);
  const [departmentCode, setDepartmentCode] = useState<string>('CSE');
  const [targetSection, setTargetSection] = useState<string>(selectedSection?.section_name || 'CSE-11');
  const [onlyTargetSection, setOnlyTargetSection] = useState<boolean>(true);

  const [extractedLectures, setExtractedLectures] = useState<ExtractedLectureEntry[]>([]);
  const [isReviewed, setIsReviewed] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [publishSuccess, setPublishSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (selectedSection) {
      setSemester(selectedSection.semester);
      setTargetSection(selectedSection.section_name);
      const dept = departments.find((d) => d.id === selectedSection.department_id);
      if (dept) setDepartmentCode(dept.code);
    }
  }, [selectedSection, departments]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const runExtraction = async (file: File, secOverride?: string, onlyTargetOverride?: boolean) => {
    setIsExtracting(true);
    setUploadProgress(30);

    const progressInterval = setInterval(() => {
      setUploadProgress((p) => (p < 85 ? p + 20 : p));
    }, 150);

    try {
      const result = await parseTimetableFile(file, {
        department: departmentCode,
        semester,
        section: secOverride ?? targetSection,
        onlyTargetSection: onlyTargetOverride ?? onlyTargetSection
      });
      clearInterval(progressInterval);
      setUploadProgress(100);
      setExtractedLectures(result.lectures);
      setDetectedSections(result.sections_found);
      setSheetsFound(result.sheets_found || []);
      setWarnings(result.warnings);
      setIsReviewed(true);
    } catch (err: any) {
      clearInterval(progressInterval);
      setWarnings([`Failed to parse file: ${err.message}`]);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileSelected = async (file: File) => {
    setCurrentFile(file);
    await runExtraction(file);
  };

  const handleUpdateEntry = (id: string, field: keyof ExtractedLectureEntry, value: any) => {
    setExtractedLectures((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, [field]: value } : entry))
    );
  };

  const handleRemoveEntry = (id: string) => {
    setExtractedLectures((prev) => prev.filter((entry) => entry.id !== id));
  };

  const handleAddEntry = () => {
    const newEntry: ExtractedLectureEntry = {
      id: `manual_${Date.now()}`,
      department: departmentCode,
      semester,
      section: targetSection || detectedSections[0] || `${departmentCode}-11`,
      day_of_week: 1,
      day_name: 'Monday',
      subject_name: 'New Subject',
      subject_code: 'BCS501',
      faculty_name: 'Faculty',
      classroom: 'Room 304',
      start_time: '08:50',
      end_time: '09:40',
      confidence: 1.0
    };
    setExtractedLectures([newEntry, ...extractedLectures]);
  };

  const handlePublish = async () => {
    if (!extractedLectures.length) return;
    setIsPublishing(true);
    try {
      await dataService.publishTimetable({ title, academic_year: academicYear, semester }, extractedLectures);
      await refreshTimetable();
      setPublishSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1200);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1F2937]">
        <div>
          <div className="flex items-center space-x-2 text-[#9CA3AF] text-xs font-semibold uppercase tracking-wider mb-1">
            <Upload className="w-4 h-4 text-[#60A5FA]" />
            <span>Timetable Import</span>
          </div>
          <h1 className="text-2xl font-bold text-[#F9FAFB]">Upload &amp; Extract Timetable (.xlsx)</h1>
          <p className="text-xs text-[#9CA3AF] mt-0.5">
            Supports multi-sheet Excel workbooks (e.g. tabs CSE-11, CSE-12, CSE-13...) with merged cells and legends.
          </p>
        </div>

        <Link
          to="/select-section"
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-[#1F2937] bg-[#111827] text-xs font-semibold text-[#F9FAFB] hover:bg-[#111827] self-start sm:self-center"
        >
          <Layers className="w-3.5 h-3.5 text-[#60A5FA]" />
          <span>Saved Section: {targetSection} (Sem {semester})</span>
        </Link>
      </div>

      {publishSuccess && (
        <div className="p-4 rounded-xl border border-[#166534] bg-[#166534] text-[#60A5FA] flex items-center space-x-3 text-sm">
          <CheckCircle2 className="w-5 h-5 text-[#60A5FA] shrink-0" />
          <span>Timetable published successfully! Redirecting to Today Schedule...</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[#111827] rounded-2xl border border-[#1F2937] p-5 space-y-4">
          <h2 className="text-xs font-bold text-[#F9FAFB] uppercase tracking-wider">1. Target Section &amp; Details</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-brand-text mb-1">Department</label>
              <select
                value={departmentCode}
                onChange={(e) => setDepartmentCode(e.target.value)}
                className="w-full px-3 py-2 border border-[#1F2937] rounded-xl text-xs bg-brand-bg"
              >
                {departments.map((d) => (
                  <option key={d.code} value={d.code}>{d.code}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-text mb-1">Semester (1–8)</label>
              <select
                value={semester}
                onChange={(e) => setSemester(Number(e.target.value))}
                className="w-full px-3 py-2 border border-[#1F2937] rounded-xl text-xs bg-brand-bg"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>Sem {s}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-text mb-1">
              Target Section Sheet ({departmentCode}-11 to {departmentCode}-29)
            </label>
            <select
              value={
                Array.from({ length: 19 }, (_, i) => `${departmentCode}-${i + 11}`).includes(targetSection)
                  ? targetSection
                  : '__CUSTOM__'
              }
              onChange={(e) => {
                if (e.target.value === '__CUSTOM__') {
                  setTargetSection(`${departmentCode}-`);
                } else {
                  setTargetSection(e.target.value);
                  if (currentFile && onlyTargetSection) {
                    runExtraction(currentFile, e.target.value, true);
                  }
                }
              }}
              className="w-full px-3 py-2 border border-[#1F2937] rounded-xl text-xs bg-brand-bg focus:bg-[#111827] focus:outline-none font-semibold text-[#F9FAFB]"
            >
              {Array.from({ length: 19 }, (_, i) => `${departmentCode}-${i + 11}`).map((sec) => (
                <option key={sec} value={sec}>{sec}</option>
              ))}
              <option value="__CUSTOM__">{departmentCode}-Any Number (Custom...)</option>
            </select>
            {!Array.from({ length: 19 }, (_, i) => `${departmentCode}-${i + 11}`).includes(targetSection) && (
              <input
                type="text"
                value={targetSection}
                onChange={(e) => setTargetSection(e.target.value.toUpperCase())}
                placeholder={`e.g. ${departmentCode}-30`}
                className="mt-2 w-full px-3 py-2 border border-[#1F2937] rounded-xl text-xs bg-brand-bg focus:bg-[#111827] focus:outline-none font-semibold text-[#F9FAFB]"
              />
            )}
          </div>

          <label className="flex items-start space-x-2.5 p-3 rounded-xl border border-[#1F2937] bg-brand-bg cursor-pointer">
            <input
              type="checkbox"
              checked={onlyTargetSection}
              onChange={(e) => {
                const checked = e.target.checked;
                setOnlyTargetSection(checked);
                if (currentFile) runExtraction(currentFile, targetSection, checked);
              }}
              className="w-4 h-4 mt-0.5 accent-[#2563EB] rounded"
            />
            <span className="text-xs text-brand-text leading-snug">
              Extract <strong>only {targetSection || 'my section'}</strong> from multi-section .xlsx file
            </span>
          </label>

          <div>
            <label className="block text-xs font-semibold text-brand-text mb-1">Timetable Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-[#1F2937] rounded-xl text-xs bg-brand-bg focus:bg-[#111827] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-text mb-1">Academic Year</label>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full px-3 py-2 border border-[#1F2937] rounded-xl text-xs bg-brand-bg focus:bg-[#111827] focus:outline-none"
            />
          </div>
        </div>

        <div className="lg:col-span-2 bg-[#111827] rounded-2xl border border-[#1F2937] p-5 flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-xs font-bold text-[#F9FAFB] uppercase tracking-wider mb-3">2. Upload Timetable File</h2>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
                dragActive ? 'border-brand-secondary bg-[#111827]' : 'border-[#1F2937] hover:border-brand-secondary'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="space-y-2.5">
                <div className="w-11 h-11 rounded-xl bg-brand-bg text-[#F9FAFB] border border-[#1F2937] flex items-center justify-center mx-auto">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-sm font-bold text-[#F9FAFB]">
                  {currentFile ? `Selected: ${currentFile.name}` : 'Click to browse or drop .xlsx timetable file'}
                </p>
                <div className="flex items-center justify-center space-x-4 text-[#9CA3AF] text-xs">
                  <span className="flex items-center space-x-1"><FileSpreadsheet className="w-3.5 h-3.5 text-[#60A5FA]" /><span>XLSX / CSV</span></span>
                  <span className="flex items-center space-x-1"><FileText className="w-3.5 h-3.5 text-[#60A5FA]" /><span>PDF</span></span>
                  <span className="flex items-center space-x-1"><Image className="w-3.5 h-3.5 text-[#F9FAFB]" /><span>Image</span></span>
                </div>
              </div>
            </div>

            {isExtracting && (
              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-xs text-[#9CA3AF]">
                  <span>Extracting schedule entries...</span>
                  <span className="font-semibold text-[#F9FAFB]">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-[#111827] rounded-full h-1.5 overflow-hidden">
                  <div className="bg-brand-primary h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            {/* Workbook Sheet Tabs Preview */}
            {sheetsFound.length > 0 && currentFile && (
              <div className="mt-4 p-3 rounded-xl bg-brand-bg border border-[#1F2937] space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF] block">
                  Sheets Detected in Workbook (click to extract a specific sheet):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {sheetsFound.map((sName) => {
                    const isActive = targetSection.toUpperCase() === sName.toUpperCase() && onlyTargetSection;
                    return (
                      <button
                        key={sName}
                        type="button"
                        onClick={() => {
                          setTargetSection(sName);
                          setOnlyTargetSection(true);
                          runExtraction(currentFile, sName, true);
                        }}
                        className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold border transition-colors ${
                          isActive
                            ? 'bg-[#2563EB] text-white border-brand-primary'
                            : 'bg-[#111827] text-[#F9FAFB] border-[#1F2937] hover:border-brand-secondary'
                        }`}
                      >
                        {sName}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {warnings.length > 0 && (
              <div className="mt-3 p-3 rounded-xl bg-brand-bg border border-[#1F2937] text-xs text-[#9CA3AF] space-y-1">
                {warnings.map((w, idx) => <p key={idx}>&bull; {w}</p>)}
              </div>
            )}
          </div>
        </div>
      </div>

      {isReviewed && (
        <div className="bg-[#111827] rounded-2xl border border-[#1F2937] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1F2937]">
            <div className="flex items-center space-x-2">
              <Edit2 className="w-4 h-4 text-[#60A5FA]" />
              <h2 className="text-base font-bold text-[#F9FAFB]">
                Review Extracted Entries ({extractedLectures.length})
              </h2>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleAddEntry}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-[#1F2937] bg-brand-bg text-xs font-semibold text-[#F9FAFB] hover:bg-[#111827]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Entry</span>
              </button>
              <button
                onClick={handlePublish}
                disabled={isPublishing || extractedLectures.length === 0}
                className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8]"
              >
                <span>{isPublishing ? 'Publishing...' : 'Confirm & Publish'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-[#1F2937] rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-bg text-[#9CA3AF] border-b border-[#1F2937]">
                <tr>
                  <th className="p-2.5">Day</th>
                  <th className="p-2.5">Time</th>
                  <th className="p-2.5">Section</th>
                  <th className="p-2.5">Subject</th>
                  <th className="p-2.5">Code</th>
                  <th className="p-2.5">Room</th>
                  <th className="p-2.5">Faculty</th>
                  <th className="p-2.5 text-right">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {extractedLectures.map((entry) => (
                  <tr key={entry.id}>
                    <td className="p-2">
                      <select
                        value={entry.day_of_week}
                        onChange={(e) => handleUpdateEntry(entry.id, 'day_of_week', Number(e.target.value))}
                        className="px-2 py-1 border border-[#1F2937] rounded bg-[#111827] text-xs"
                      >
                        <option value={1}>Mon</option>
                        <option value={2}>Tue</option>
                        <option value={3}>Wed</option>
                        <option value={4}>Thu</option>
                        <option value={5}>Fri</option>
                        <option value={6}>Sat</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center space-x-1">
                        <input
                          type="time"
                          value={entry.start_time}
                          onChange={(e) => handleUpdateEntry(entry.id, 'start_time', e.target.value)}
                          className="px-1.5 py-1 border border-[#1F2937] rounded text-[11px] font-mono"
                        />
                        <span>-</span>
                        <input
                          type="time"
                          value={entry.end_time}
                          onChange={(e) => handleUpdateEntry(entry.id, 'end_time', e.target.value)}
                          className="px-1.5 py-1 border border-[#1F2937] rounded text-[11px] font-mono"
                        />
                      </div>
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={entry.section}
                        onChange={(e) => handleUpdateEntry(entry.id, 'section', e.target.value)}
                        className="px-2 py-1 border border-[#1F2937] rounded text-xs font-mono w-20"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={entry.subject_name}
                        onChange={(e) => handleUpdateEntry(entry.id, 'subject_name', e.target.value)}
                        className="px-2 py-1 border border-[#1F2937] rounded text-xs font-medium min-w-[160px] w-full"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={entry.subject_code || ''}
                        onChange={(e) => handleUpdateEntry(entry.id, 'subject_code', e.target.value)}
                        className="px-2 py-1 border border-[#1F2937] rounded text-xs font-mono w-20"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={entry.classroom || ''}
                        onChange={(e) => handleUpdateEntry(entry.id, 'classroom', e.target.value)}
                        className="px-2 py-1 border border-[#1F2937] rounded text-xs w-24"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={entry.faculty_name || ''}
                        onChange={(e) => handleUpdateEntry(entry.id, 'faculty_name', e.target.value)}
                        className="px-2 py-1 border border-[#1F2937] rounded text-xs min-w-[120px]"
                      />
                    </td>
                    <td className="p-2 text-right">
                      <button
                        onClick={() => handleRemoveEntry(entry.id)}
                        className="p-1 rounded text-[#9CA3AF] hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
