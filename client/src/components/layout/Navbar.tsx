import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Menu, X, ShieldCheck, ChevronDown, LogOut, LayoutDashboard } from 'lucide-react';
import { cx } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

const PUBLIC_LINKS: { to: string; label: string; icon?: typeof LayoutDashboard }[] = [
  { to: '/analyze', label: 'Analyze' },
  { to: '/learn', label: 'Learn' },
  { to: '/about', label: 'About' },
];

const MEMBER_LINKS: { to: string; label: string; icon?: typeof LayoutDashboard }[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

function Avatar({ name, src }: { name: string; src?: string | null }) {
  const initials = name
    .split(/[\s]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
  if (src) {
    return <img src={src} alt="" className="size-8 rounded-full object-cover ring-1 ring-white/20" referrerPolicy="no-referrer" />;
  }
  return (
    <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-accent/30 to-violet/30 font-mono text-xs font-bold text-white ring-1 ring-white/20">
      {initials || 'U'}
    </span>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userOpen) return;
    const onClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setUserOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [userOpen]);

  useEffect(() => {
    setOpen(false);
    setUserOpen(false);
  }, [location.pathname]);

  const links = user ? [...PUBLIC_LINKS, ...MEMBER_LINKS] : PUBLIC_LINKS;

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-ink-950/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="group flex items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          aria-label="ScamShield AI home"
        >
          <span className="grid size-9 place-items-center rounded-lg border border-accent/30 bg-accent/10 text-accent shadow-glow transition-all duration-300 group-hover:scale-105 group-hover:bg-accent/20">
            <Shield className="size-5" strokeWidth={2} aria-hidden="true" />
          </span>
          <span className="font-display text-sm font-bold tracking-widest text-white uppercase">
            ScamShield<span className="text-accent"> AI</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                cx(
                  'relative rounded-full px-4 py-2 text-xs font-medium tracking-widest uppercase transition-colors',
                  isActive ? 'text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-white/10"
                      transition={{ type: 'spring', bounce: 0.3, duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10 inline-flex items-center gap-1.5">
                    {l.icon && <l.icon className="size-3.5" aria-hidden="true" />}
                    {l.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1.5 pl-1.5 pr-3 text-left transition-all duration-300 hover:bg-white/10 hover:border-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                aria-haspopup="menu"
                aria-expanded={userOpen}
                onClick={() => setUserOpen((v) => !v)}
              >
                <Avatar name={user.name} src={user.avatar} />
                <span className="hidden max-w-28 truncate text-xs font-semibold text-white lg:block">{user.name}</span>
                <ChevronDown className={cx('size-3.5 text-slate-500 transition-transform duration-300', userOpen && 'rotate-180')} aria-hidden="true" />
              </button>
              <AnimatePresence>
                {userOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.96 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    role="menu"
                    className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-ink-900/95 shadow-panel backdrop-blur-xl"
                  >
                    <div className="border-b border-white/5 px-4 py-3">
                      <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                      <p className="truncate text-xs text-slate-500">{user.email}</p>
                    </div>
                    <NavLink
                      role="menuitem"
                      to="/dashboard"
                      onClick={() => setUserOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                    >
                      <LayoutDashboard className="size-4" aria-hidden="true" />
                      My dashboard
                    </NavLink>
                    <button
                      role="menuitem"
                      onClick={() => {
                        setUserOpen(false);
                        logout();
                        navigate('/');
                      }}
                      className="flex w-full items-center gap-2 px-4 py-3 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                    >
                      <LogOut className="size-4" aria-hidden="true" />
                      Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-5 py-2 text-xs font-semibold uppercase tracking-widest text-white transition-all duration-300 hover:bg-white/10 hover:border-white/25"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent-deep via-cyan-500 to-accent px-5 py-2 font-mono text-xs font-semibold uppercase tracking-widest text-ink-950 shadow-glow transition-all duration-300 hover:brightness-110 hover:shadow-glow active:scale-[0.98]"
              >
                <ShieldCheck className="size-4" aria-hidden="true" />
                Sign up
              </Link>
            </>
          )}
        </div>

        <button
          className="grid size-10 place-items-center rounded-lg text-white/80 transition-colors hover:bg-white/5 md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden border-t border-white/5 bg-ink-950/95 backdrop-blur-xl md:hidden"
            aria-label="Mobile"
          >
            <div className="space-y-1 px-4 py-3">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cx(
                      'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5',
                      isActive && 'bg-white/10',
                    )
                  }
                >
                  {l.icon && <l.icon className="size-4 text-accent" aria-hidden="true" />}
                  {l.label}
                </NavLink>
              ))}
              <div className="mt-2 border-t border-white/10 pt-3">
                {user ? (
                  <div className="flex items-center justify-between gap-2 rounded-lg bg-white/5 px-3 py-2.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Avatar name={user.name} src={user.avatar} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                        <p className="truncate text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setOpen(false);
                        logout();
                        navigate('/');
                      }}
                      aria-label="Sign out"
                      className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white"
                    >
                      <LogOut className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to="/login"
                      onClick={() => setOpen(false)}
                      className="block rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-center text-sm font-semibold uppercase tracking-widest text-white transition hover:bg-white/10"
                    >
                      Sign in
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setOpen(false)}
                      className="block rounded-lg bg-gradient-to-r from-accent-deep via-cyan-500 to-accent px-3 py-2.5 text-center text-sm font-semibold uppercase tracking-widest text-ink-950 transition hover:brightness-110"
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}