const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChevronLeft } from 'lucide-react';
import { KIND_ORDER, kindOf } from '@/lib/blocks';
import { humanDuration } from '@/lib/format';
import { cn } from '@/lib/utils';

// One shade of the accent per entry, thinning down the list: the biggest time
// sink is the darkest thing on the chart.
const SHADES = [1, 0.8, 0.66, 0.55, 0.46, 0.38, 0.31, 0.26, 0.21, 0.17];

export default function Stats() {
  const [blocks, setBlocks] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState('all');
  const [shape, setShape] = useState('bars');

  useEffect(() => {
    (async () => {
      try {
        const [blockPage, stats] = await Promise.all([
          db.entities.Block.filter({ deleted: { $ne: true } }, { sort: 'created_date', limit: 300 }),
          db.entities.StudySession.aggregate({
            query: { deleted: { $ne: true } },
            groupBy: 'block_id',
            sum: ['duration_seconds'],
          }),
        ]);
        setBlocks(blockPage.items || []);
        setRows(stats?.rows || []);
      } catch (err) {
        setRows([]);
      }
      setLoading(false);
    })();
  }, []);

  const entries = useMemo(() => {
    // one row per block: untagged time all lands on the same "free study" entry
    const merged = new Map();
    rows.forEach((row) => {
      const key = row.block_id || 'free';
      const block = blocks.find((b) => b.id === row.block_id);
      const before = merged.get(key);
      merged.set(key, {
        id: key,
        label: block?.title || (row.block_id ? 'untitled' : 'free study'),
        kind: block?.kind || 'free',
        seconds: (before?.seconds || 0) + (row.sum_duration_seconds || 0),
      });
    });
    return [...merged.values()].filter((entry) => entry.seconds > 0).sort((a, b) => b.seconds - a.seconds);
  }, [rows, blocks]);

  const kinds = ['free', ...KIND_ORDER].filter((k) => entries.some((e) => e.kind === k));
  const shown = kind === 'all' ? entries : entries.filter((e) => e.kind === kind);
  const total = shown.reduce((sum, entry) => sum + entry.seconds, 0);
  const top = shown[0];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link to="/sessions" className="flex items-center gap-1 text-[12px] text-muted-foreground">
        <ChevronLeft className="h-4 w-4" /> log
      </Link>

      <div>
        <h1 className="font-heading text-2xl font-black">stats</h1>
        <p className="text-[12px] text-muted-foreground">
          {humanDuration(total)} logged{top ? ` · most: ${top.label}` : ''}
        </p>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        <Chip active={kind === 'all'} onClick={() => setKind('all')}>
          all
        </Chip>
        {kinds.map((k) => (
          <Chip key={k} active={kind === k} onClick={() => setKind(k)}>
            {k === 'free' ? 'free study' : kindOf(k).label.toLowerCase()}
          </Chip>
        ))}
      </div>

      <div className="flex gap-2">
        <Chip active={shape === 'bars'} onClick={() => setShape('bars')}>
          bars
        </Chip>
        <Chip active={shape === 'wheel'} onClick={() => setShape('wheel')}>
          wheel
        </Chip>
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-[1.6rem] bg-secondary/70" />
      ) : shown.length === 0 ? (
        <div className="rounded-[1.6rem] border-2 border-dashed border-border p-10 text-center text-[12px] font-bold text-muted-foreground">
          nothing logged yet.
        </div>
      ) : (
        <div className="surface p-4">
          {shape === 'bars' ? (
            <div style={{ height: Math.max(200, shown.length * 46) }} className="w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={shown} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={140}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 700 }}
                  />
                  <Tooltip cursor={{ fill: 'hsl(var(--secondary))' }} content={<TimeTip />} />
                  <Bar dataKey="seconds" barSize={18} radius={9}>
                    {shown.map((entry, i) => (
                      <Cell key={entry.id} fill="hsl(var(--brand-ink))" fillOpacity={SHADES[i % SHADES.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <>
              <div className="mx-auto h-[240px] w-full max-w-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={shown}
                      dataKey="seconds"
                      nameKey="label"
                      innerRadius="55%"
                      outerRadius="90%"
                      paddingAngle={2}
                      stroke="none"
                    >
                      {shown.map((entry, i) => (
                        <Cell key={entry.id} fill="hsl(var(--brand-ink))" fillOpacity={SHADES[i % SHADES.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<TimeTip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <ul className="mt-3 space-y-2">
                {shown.map((entry, i) => (
                  <li key={entry.id} className="flex items-center gap-2.5 text-[12px] font-bold">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full bg-brand-ink"
                      style={{ opacity: SHADES[i % SHADES.length] }}
                    />
                    <span className="min-w-0 flex-1 truncate">{entry.label}</span>
                    <span className="shrink-0 tabular-nums">{humanDuration(entry.seconds)}</span>
                    <span className="w-9 shrink-0 text-right tabular-nums text-muted-foreground">
                      {Math.round((entry.seconds / total) * 100)}%
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function TimeTip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const entry = payload[0].payload;
  return (
    <div className="rounded-[0.9rem] border border-border bg-card px-3 py-2 text-[11px] font-bold shadow-lift">
      <p>{entry.label}</p>
      <p className="text-muted-foreground">{humanDuration(entry.seconds)}</p>
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-extrabold transition-colors',
        active ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground hover:text-foreground'
      )}
    >
      {children}
    </button>
  );
}