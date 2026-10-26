const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Home as HomeIcon, Timer, CalendarDays, History, Settings, Coffee, LayoutList, X, LogOut, Pencil } from 'lucide-react';

import SessionPill from '@/components/SessionPill';
import { applyAccent, rememberAccent } from '@/lib/accents';
import { flushQueue } from '@/lib/offline';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/', label: 'home', icon: HomeIcon },
  { to: '/timer', label: 'timer', icon: Timer },
  { to: '/calendar', label: 'calendar', icon: CalendarDays },
  { to: '/whiteboard', label: 'whiteboard', icon: Pencil },
  { to: '/sessions', label: 'log', icon: History },
  { to: '/cafe', label: 'café', icon: Coffee },
  { to: '/settings', label: 'settings', icon: Settings },
];

export default function Layout() {
  const [me, setMe] = useState(null);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    rememberAccent();
    flushQueue();
    const onOnline = () => flushQueue();
    window.addEventListener('online', onOnline);
    db.auth
      .me()
      .then((user) => {
        setMe(user);
        if (user?.accent) applyAccent(user.accent);
      })
      .catch(() => {});
    return () => window.removeEventListener('online', onOnline);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const initial = (me?.username || me?.full_name || me?.email || 'n').charAt(0).toLowerCase();

  const signOut = async () => {
    await db.auth.logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="sticky top-0 z-40 border-b border-brand-soft bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-[0.9rem] bg-brand pb-0.5 font-heading text-lg font-black text-brand-foreground">
              n
            </span>
            <span className="font-heading text-xl font-black tracking-tight">nook</span>
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Pages"
            aria-expanded={open}
            className={cn(
              'press grid h-10 w-10 place-items-center rounded-full transition-colors',
              open ? 'bg-brand text-brand-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
            )}
            data-testid="page-panel-toggle"
          >
            {open ? <X className="h-[18px] w-[18px]" /> : <LayoutList className="h-[18px] w-[18px]" />}
          </button>
        </div>
      </header>

      {open && <div className="fixed inset-0 z-30 bg-foreground/10 backdrop-blur-[2px]" onClick={() => setOpen(false)} />}

      {open && (
        <div
          className="fixed right-4 top-[4.4rem] z-40 w-[264px] animate-fade-up rounded-[1.8rem] border border-border/70 bg-card p-3 shadow-lift md:right-8"
          data-testid="page-panel"
        >
          <nav className="space-y-1">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-[1.1rem] px-3.5 py-2.5 text-[13px] font-medium transition-colors',
                    isActive ? 'bg-brand-soft text-brand-ink' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )
                }
              >
                <Icon className="h-[17px] w-[17px]" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-2 flex items-center gap-2.5 border-t border-border/70 px-2 pt-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-[13px] font-medium text-muted-foreground">
              {initial}
            </span>
            <span className="min-w-0 flex-1 truncate text-[12px] text-muted-foreground">
              {me?.username ? `@${me.username}` : me?.email || ''}
            </span>
            <button
              type="button"
              onClick={signOut}
              aria-label="Log out"
              className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <SessionPill />

      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-7 md:px-8">
        <Outlet />
      </main>
    </div>
  );
}