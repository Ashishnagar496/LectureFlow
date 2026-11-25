import * as XLSX from 'xlsx';
import type { ExtractedLectureEntry } from '../types';

export interface ParseResult {
  success: boolean;
  filename: string;
  file_type: string;
  sections_found: string[];
  sheets_found: string[];
  departments_found: string[];
  lectures: ExtractedLectureEntry[];
  warnings: string[];
}

const PARSER_API_URL = import.meta.env.VITE_PARSER_API_URL || 'http://localhost:8000';

const DAY_MAP: Record<string, { num: number; name: string }> = {
  mon: { num: 1, name: 'Monday' },
  monday: { num: 1, name: 'Monday' },
  tue: { num: 2, name: 'Tuesday' },
  tues: { num: 2, name: 'Tuesday' },
  tuesday: { num: 2, name: 'Tuesday' },
  wed: { num: 3, name: 'Wednesday' },
  wednesday: { num: 3, name: 'Wednesday' },
  thu: { num: 4, name: 'Thursday' },
  thursday: { num: 4, name: 'Thursday' },
  fri: { num: 5, name: 'Friday' },
  friday: { num: 5, name: 'Friday' },
  sat: { num: 6, name: 'Saturday' },
  saturday: { num: 6, name: 'Saturday' }
};

function normalizeCollegeTime(raw: string): string {
  const clean = raw.trim().replace('.', ':');
  const [hStr, mStr] = clean.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr || '0', 10);
  if (isNaN(h)) return '09:00';
  // College hours 1..7 are afternoon (13:00..19:00)
  if (h >= 1 && h <= 7) {
    h += 12;
  }
  return `${h < 10 ? '0' : ''}${h}:${m < 10 ? '0' : ''}${m}`;
}

interface LegendEntry {
  code?: string;
  subject: string;
  faculty: string;
}

function parseLegendFromRows(rows: any[][], startRow: number): Record<string, LegendEntry> {
  const legend: Record<string, LegendEntry> = {};

  for (let r = startRow; r < rows.length; r++) {
    for (let c = 0; c < (rows[r]?.length || 0); c++) {
      const cell = String(rows[r][c] || '').replace(/\s+/g, ' ').trim();
      if (!cell || (!cell.includes('-') && !cell.includes('–') && !cell.includes(':'))) continue;

      // Skip metadata rows like "Program Leader:" or "Class Mentor"
      if (/^(?:Program\s*Leader|Class\s*Mentor|HOD|Time\s*Table)/i.test(cell)) continue;

      // Normalize en-dashes / em-dashes to standard hyphen for splitting
      const norm = cell.replace(/[–—]/g, '-');

      // Match pattern: [CODE -] Subject Name - Teacher Name (e.g. Mr./Ms./Dr./Prof./XXX)
      const teacherSplit = norm.match(/^(.*?)\s*[-:]\s*((?:Mr\.?|Ms\.?|Mrs\.?|Dr\.?|Prof\.?|XXX|Faculty).*)$/i);
      let leftPart = norm;
      let faculty = '';

      if (teacherSplit) {
        leftPart = teacherSplit[1].trim();
        faculty = teacherSplit[2].trim();
      } else {
        const parts = norm.split('-').map((p) => p.trim()).filter(Boolean);
        if (parts.length >= 2) {
          faculty = parts[parts.length - 1];
          leftPart = parts.slice(0, -1).join(' - ');
        }
      }

      // Check if leftPart starts with a subject code like "BCS 501"
      const codeMatch = leftPart.match(/^([A-Z]{2,4}\s*\d{3}[A-Z]?)\s*[-:]?\s*(.*)$/i);
      if (codeMatch) {
        const codeNorm = codeMatch[1].replace(/\s+/g, '').toUpperCase();
        const subjName = codeMatch[2].trim() || codeNorm;
        legend[codeNorm] = { code: codeNorm, subject: subjName, faculty };
      } else if (leftPart) {
        const upperLeft = leftPart.toUpperCase();
        const entry: LegendEntry = { subject: leftPart, faculty };
        legend[upperLeft] = entry;

        // Add convenient short-key aliases matching grid cell labels
        if (upperLeft.includes('FSD')) legend['FSD'] = entry;
        if (upperLeft.includes('DSA')) legend['DSA'] = entry;
        if (upperLeft.includes('SOFT SKILL')) legend['SOFT SKILL'] = entry;
        if (upperLeft.includes('QUANTITATIVE') || upperLeft.includes('LOGICAL')) legend['QA/ LR'] = entry;
        if (upperLeft.includes('APPLIED AI')) legend['APPLIED AI'] = entry;
        if (upperLeft.includes('DOMAIN TRAINING')) {
          if (!legend['DOMAIN TRAINING']) {
            legend['DOMAIN TRAINING'] = { subject: 'Domain Training', faculty: 'Domain Faculty' };
          }
        }
      }
    }
  }
  return legend;
}

function cleanRoomNumber(rawRoom: string): string {
  let room = rawRoom.trim().toUpperCase();
  // Remove floor codes like FF, SF, TF, GF (e.g. KC-FF-402 -> KC-402, KC FF 402 -> KC-402)
  room = room.replace(/[-\s]+(?:FF|SF|TF|GF)[-\s]+/gi, '-');
  room = room.replace(/[-\s]+(?:FF|SF|TF|GF)$/gi, '');
  room = room.replace(/^(?:FF|SF|TF|GF)[-\s]+/gi, '');
  // Normalize spaces to hyphen for block-number format (e.g. KC 402 -> KC-402)
  room = room.replace(/^([A-Z]+)\s+(\d+)$/, '$1-$2');
  return room.trim();
}

function parseCollegeSheet(
  sheet: XLSX.WorkSheet,
  sheetName: string,
  deptHint: string,
  semHint: number
): ExtractedLectureEntry[] {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
  if (!rows || rows.length < 4) return [];

  const merges = sheet['!merges'] || [];
  let defaultRoom = 'Room 304';
  let detectedSem = semHint;
  const sectionName = sheetName.trim();

  // 1. Scan top rows for Class Room No and Semester/Section
  for (let r = 0; r < Math.min(8, rows.length); r++) {
    const rowText = rows[r].map((v) => String(v || '')).join(' ');
    const roomMatch = rowText.match(/Class\s*Room\s*No\s*[:\-]?\s*([A-Z0-9\-]+(?:\s+[A-Z0-9\-]+)?)/i);
    if (roomMatch) {
      const candidate = roomMatch[1].split(/\s+(?:Session|w\.e\.f|Department|Course)/i)[0];
      defaultRoom = cleanRoomNumber(candidate);
    }
    const semMatch = rowText.match(/Semester\s*\/?\s*Section\s*[:\-]?\s*(\d+)/i);
    if (semMatch) {
      detectedSem = parseInt(semMatch[1], 10) || semHint;
    }
  }

  // 2. Locate Time Header Row (row with multiple HH.MM-HH.MM or HH:MM-HH:MM patterns)
  const timeSlotRegex = /(\d{1,2}[:.]\d{2})\s*[-–to]+\s*(\d{1,2}[:.]\d{2})/i;
  let timeRowIdx = -1;
  const colTimes: Record<number, { start: string; end: string }> = {};

  for (let r = 0; r < Math.min(12, rows.length); r++) {
    let matchesInRow = 0;
    const tempCols: Record<number, { start: string; end: string }> = {};
    for (let c = 0; c < rows[r].length; c++) {
      const cellStr = String(rows[r][c] || '').replace(/\n/g, ' ').trim();
      const m = cellStr.match(timeSlotRegex);
      if (m) {
        matchesInRow++;
        tempCols[c] = {
          start: normalizeCollegeTime(m[1]),
          end: normalizeCollegeTime(m[2])
        };
      }
    }
    if (matchesInRow >= 3) {
      timeRowIdx = r;
      Object.assign(colTimes, tempCols);
      break;
    }
  }

  if (timeRowIdx === -1) return [];

  // 3. Dynamically detect Day column (col 0..3) and strictly bound Day rows to the colourful table
  let dayColIdx = 0;
  let firstDayRow = -1;
  let lastDayRow = -1;

  for (let colCandidate = 0; colCandidate < 4; colCandidate++) {
    for (let r = timeRowIdx + 1; r < rows.length; r++) {
      const val = String(rows[r]?.[colCandidate] || '').trim().toLowerCase();
      if (DAY_MAP[val]) {
        dayColIdx = colCandidate;
        firstDayRow = r;
        break;
      }
    }
    if (firstDayRow !== -1) break;
  }

  if (firstDayRow === -1) return [];

  for (let r = firstDayRow; r < rows.length; r++) {
    const rowText = rows[r].map((v) => String(v || '')).join(' ');
    // Stop immediately if we reach the legend / footer section below the table
    if (/^(?:[A-Z]{2,4}\s*\d{3}\s*[-–]|Program\s*Leader|Class\s*Mentor|HOD)/i.test(rowText.trim())) {
      break;
    }
    const dayVal = String(rows[r][dayColIdx] || '').trim().toLowerCase();
    if (DAY_MAP[dayVal]) {
      lastDayRow = r;
    }
  }

  // Expand lastDayRow only for the vertical merge of the final day (e.g. Friday split G1/G2)
  for (const merge of merges) {
    if (merge.s.c === dayColIdx && merge.s.r >= firstDayRow && merge.s.r <= lastDayRow && merge.e.r > lastDayRow) {
      const dayVal = String(rows[merge.s.r]?.[dayColIdx] || '').trim().toLowerCase();
      if (DAY_MAP[dayVal]) {
        lastDayRow = merge.e.r;
      }
    }
  }

  // 4. Parse Legend below the grid
  const legend = parseLegendFromRows(rows, lastDayRow + 1);

  // 5. Build merge lookup map for lecture cells
  const mergeMap = new Map<string, { endCol: number; endRow: number }>();
  const skipCells = new Set<string>();

  for (const merge of merges) {
    if (merge.s.r > timeRowIdx && merge.s.r <= lastDayRow) {
      mergeMap.set(`${merge.s.r},${merge.s.c}`, { endCol: merge.e.c, endRow: merge.e.r });
      for (let rr = merge.s.r; rr <= merge.e.r; rr++) {
        for (let cc = merge.s.c; cc <= merge.e.c; cc++) {
          if (rr !== merge.s.r || cc !== merge.s.c) {
            skipCells.add(`${rr},${cc}`);
          }
        }
      }
    }
  }

  // 6. Iterate ONLY day rows inside the colourful table (firstDayRow..lastDayRow)
  const extracted: ExtractedLectureEntry[] = [];
  let currentDay = { num: 1, name: 'Monday' };

  for (let r = firstDayRow; r <= lastDayRow; r++) {
    const dayCell = String(rows[r][dayColIdx] || '').trim().toLowerCase();
    if (DAY_MAP[dayCell]) {
      currentDay = DAY_MAP[dayCell];
    }

    for (const colKey of Object.keys(colTimes)) {
      const c = Number(colKey);
      if (skipCells.has(`${r},${c}`)) continue;

      const rawCell = String(rows[r][c] || '').replace(/\s+/g, ' ').trim();
      if (!rawCell) continue;

      // Skip LUNCH or BREAK columns
      if (/^l\s*u\s*n\s*c\s*h$/i.test(rawCell) || rawCell.toLowerCase() === 'lunch' || rawCell.toLowerCase() === 'break') {
        continue;
      }

      const mergeInfo = mergeMap.get(`${r},${c}`);
      const endCol = mergeInfo ? mergeInfo.endCol : c;
      const startTime = colTimes[c].start;
      const endTime = colTimes[endCol]?.end || colTimes[c].end;

      // Resolve code, subject, faculty, lab room from cell + legend
      let subjectName = rawCell;
      let subjectCode = '';
      let facultyName = '';
      let classroom = defaultRoom;

      const codeMatch = rawCell.match(/\b([A-Z]{2,4}\s*\d{3}[A-Z]?)\b/i);
      if (codeMatch) {
        subjectCode = codeMatch[1].replace(/\s+/g, '').toUpperCase();
        const legendHit = legend[subjectCode];
        if (legendHit) {
          subjectName = legendHit.subject;
          facultyName = legendHit.faculty;
        }
      } else {
        // Check training / non-code legend matches (e.g. FSD, DSA, QA/ LR, Soft Skill)
        const upperCell = rawCell.toUpperCase();
        for (const [k, v] of Object.entries(legend)) {
          if (upperCell.includes(k) || (k.includes('FSD') && upperCell.includes('FSD')) || (k.includes('DSA') && upperCell.includes('DSA')) || (k.includes('SOFT') && upperCell.includes('SOFT'))) {
            subjectName = v.subject;
            facultyName = v.faculty;
            break;
          }
        }
      }

      // Extract specific Lab room if present (e.g. LAB 20, LAB 23)
      const labRoomMatch = rawCell.match(/LAB\s*\d+/i);
      if (labRoomMatch) {
        classroom = labRoomMatch[0].toUpperCase();
      }

      // Preserve batch tag (G1) / (G2) if present
      const batchMatch = rawCell.match(/\((G\d)\)/i);
      if (batchMatch && !subjectName.includes(batchMatch[1])) {
        subjectName = `${subjectName} (${batchMatch[1]})`;
      }

      extracted.push({
        id: `ext_${sheetName}_${r}_${c}_${Date.now()}`,
        department: deptHint,
        semester: detectedSem,
        section: sectionName,
        day_of_week: currentDay.num,
        day_name: currentDay.name,
        subject_name: subjectName,
        subject_code: subjectCode || undefined,
        faculty_name: facultyName || undefined,
        classroom,
        start_time: startTime,
        end_time: endTime,
        confidence: subjectCode ? 0.96 : 0.88
      });
    }
  }

  return extracted;
}

export async function parseTimetableFile(
  file: File,
  metadata?: {
    department?: string;
    section?: string;
    semester?: number;
    onlyTargetSection?: boolean;
  }
): Promise<ParseResult> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const dept = metadata?.department || 'CSE';
  const targetSection = metadata?.section?.trim() || '';
  const sem = metadata?.semester || 5;
  const onlyTarget = metadata?.onlyTargetSection ?? Boolean(targetSection);
  const warnings: string[] = [];

  // 1. Native multi-sheet Excel / CSV parsing first (preserves !merges and sheet tabs!)
  if (['xlsx', 'xls', 'csv'].includes(ext)) {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const allSheets = workbook.SheetNames;

      let sheetsToParse = allSheets;
      if (onlyTarget && targetSection) {
        // Parse prefix and number from targetSection (e.g. "CSE-25" -> prefix="cse", num="25")
        const cleanTarget = targetSection.trim();
        const normTarget = cleanTarget.replace(/[\s\-_]/g, '').toLowerCase();
        const numMatch = cleanTarget.match(/(\d+[A-Z]?)$/i);
        const targetNum = numMatch ? numMatch[1].toLowerCase() : '';

        const matchingSheets = allSheets.filter((name) => {
          const normSheet = name.replace(/[\s\-_]/g, '').toLowerCase();
          if (normSheet === normTarget) return true;
          if (targetNum && normSheet === targetNum) return true;
          // Exact token match e.g. "CSE-25 (Sem 5)" or "Sec 25" without partial "CSE-2" matching "CSE-25"
          if (targetNum) {
            const sheetNumMatch = name.trim().match(/(?:^|[\s\-_\/])(\d+[A-Z]?)(?:$|[\s\-_\(])/i);
            if (sheetNumMatch && sheetNumMatch[1].toLowerCase() === targetNum) {
              // Ensure department prefix doesn't conflict if both have prefixes
              const targetPrefix = cleanTarget.replace(/[\s\-_\d].*$/, '').toLowerCase();
              const sheetPrefix = name.replace(/[\s\-_\d].*$/, '').toLowerCase();
              if (!targetPrefix || !sheetPrefix || targetPrefix === sheetPrefix) {
                return true;
              }
            }
          }
          return false;
        });

        if (matchingSheets.length > 0) {
          sheetsToParse = matchingSheets;
        } else {
          // Strict extraction rule: do not silently pull other sections when target section is missing
          warnings.push(
            `Section "${cleanTarget}" was not found in this workbook. Available sheet tabs: ${allSheets.join(', ')}. Click any sheet tab below or uncheck "Extract only ${cleanTarget}".`
          );
          return {
            success: true,
            filename: file.name,
            file_type: ext.toUpperCase(),
            sections_found: [],
            sheets_found: allSheets,
            departments_found: [dept],
            lectures: [],
            warnings
          };
        }
      }

      const allExtracted: ExtractedLectureEntry[] = [];
      for (const sName of sheetsToParse) {
        const sheet = workbook.Sheets[sName];
        const parsed = parseCollegeSheet(sheet, sName, dept, sem);
        allExtracted.push(...parsed);
      }

      if (allExtracted.length > 0) {
        const sectionsFound = Array.from(new Set(allExtracted.map((l) => l.section)));
        if (onlyTarget && targetSection && sheetsToParse.length === 1) {
          warnings.push(`Extracted ${allExtracted.length} sessions strictly from sheet "${sheetsToParse[0]}" (found ${allSheets.length} sheets in workbook).`);
        } else {
          warnings.push(`Extracted ${allExtracted.length} sessions across ${sheetsToParse.length} sheet(s).`);
        }

        return {
          success: true,
          filename: file.name,
          file_type: ext.toUpperCase(),
          sections_found: sectionsFound,
          sheets_found: allSheets,
          departments_found: [dept],
          lectures: allExtracted,
          warnings
        };
      }
    } catch (e: any) {
      warnings.push(`Excel parser note: ${e.message}`);
    }
  }

  // 2. Fallback to Python FastAPI parser service for PDF / Image OCR
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata?.department) formData.append('department_hint', metadata.department);
    if (metadata?.section) formData.append('section_hint', metadata.section);
    if (metadata?.semester) formData.append('semester_hint', String(metadata.semester));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${PARSER_API_URL}/parse-timetable`, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        filename: file.name,
        file_type: ext.toUpperCase(),
        sections_found: data.sections_found,
        sheets_found: data.sections_found || [],
        departments_found: data.departments_found,
        lectures: data.lectures.map((l: any, idx: number) => ({
          id: `entry_${idx}_${Date.now()}`,
          department: l.department || dept,
          semester: l.semester || sem,
          section: l.section || targetSection || `${dept}-15`,
          day_of_week: l.day_of_week || 1,
          day_name: l.day_name || 'Monday',
          subject_name: l.subject_name,
          subject_code: l.subject_code || '',
          faculty_name: l.faculty_name || '',
          classroom: l.classroom || '',
          start_time: l.start_time,
          end_time: l.end_time,
          confidence: l.confidence || 0.9,
          notes: l.notes
        })),
        warnings: data.warnings || []
      };
    }
  } catch {
    // FastAPI service offline
  }

  const fallbackSec = targetSection || `${dept}-15`;
  warnings.push(`Could not detect standard table columns in "${file.name}". Loaded template entries for ${fallbackSec} — please review and edit before publishing.`);
  return {
    success: true,
    filename: file.name,
    file_type: ext.toUpperCase(),
    sections_found: [fallbackSec],
    sheets_found: [fallbackSec],
    departments_found: [dept],
    lectures: [
      { id: 'ext_1', department: dept, semester: sem, section: fallbackSec, day_of_week: 1, day_name: 'Monday', subject_name: 'Database Management Systems', subject_code: 'CS601', faculty_name: 'Dr. Ramesh Sharma', classroom: 'Room 301', start_time: '09:00', end_time: '10:00', confidence: 0.85 }
    ],
    warnings
  };
}
