import {
  BookOpen,
  Layers,
  ClipboardList,
  Folder,
  PenLine,
  ListChecks,
  GraduationCap,
  Palette,
  BookMarked,
  Lightbulb,
  Music,
  Dumbbell,
} from 'lucide-react';

// Almost monochrome: every kind shares the accent tint and ink, so the app stays
// quiet and only the accent colour ever changes.
const TINT = 'hsl(var(--brand-soft))';
const ACCENT = 'hsl(var(--brand-ink))';

const kind = (label, icon, children) => ({ label, icon, tint: TINT, accent: ACCENT, children });

// Every block kind: what it looks like, what can live inside it.
export const KINDS = {
  course: kind('Course', BookOpen, ['unit', 'test', 'lecture', 'task']),
  unit: kind('Unit', Layers, ['lecture', 'task']),
  test: kind('Test', ClipboardList, ['task']),
  exam: kind('Exam', GraduationCap, ['task']),
  project: kind('Project', Folder, ['task']),
  lecture: kind('Lecture', PenLine, ['task']),
  reading: kind('Reading', BookMarked, ['task']),
  revision: kind('Revision', Lightbulb, ['task']),
  hobby: kind('Hobby', Palette, ['task']),
  music: kind('Music', Music, ['task']),
  sport: kind('Sport', Dumbbell, ['task']),
  task: kind('Task', ListChecks, []),
};

export const KIND_ORDER = [
  'course',
  'unit',
  'test',
  'exam',
  'project',
  'lecture',
  'reading',
  'revision',
  'hobby',
  'music',
  'sport',
  'task',
];

// The kinds offered by the round + button.
export const WHEEL_KINDS = ['course', 'unit', 'test', 'project', 'lecture', 'task', 'hobby', 'revision'];

export function kindOf(kindId) {
  return KINDS[kindId] || KINDS.task;
}

export function canHold(kindId, childKind) {
  return kindOf(kindId).children.includes(childKind);
}

export function formatDue(date) {
  if (!date) return null;
  const d = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.setHours(0, 0, 0, 0) - today.getTime()) / 86400000);
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  if (diff === -1) return 'yesterday';
  if (diff < 0) return `${Math.abs(diff)}d late`;
  if (diff < 7) return `in ${diff}d`;
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}