import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, MoreVertical, Phone, Video, ChevronLeft, Link2 } from 'lucide-react';
import { cx } from '../../lib/utils';

function highlightMessage(text: string) {
  const urlRe = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
  const urgent = /\b(urgent|immediately|hurry|asap|act now|last chance|tonight|limited)\b/gi;
  const money = /(?:rs\.?\s?\d[\d,.]*|\$\s?\d+|\d+% profit|double your money|garantised|guaranteed)/gi;

  const parts: { text: string; kind: 'text' | 'url' | 'urgent' | 'money' }[] = [];
  let last = 0;
  const re = new RegExp(
    `(${urlRe.source})|(${urgent.source})|(${money.source})`,
    'gi',
  );
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index), kind: 'text' });
    const val = m[0];
    if (urlRe.test(val)) parts.push({ text: val, kind: 'url' });
    else if (money.test(val)) parts.push({ text: val, kind: 'money' });
    else parts.push({ text: val, kind: 'urgent' });
    last = m.index + val.length;
    if (m.index === re.lastIndex) re.lastIndex++;
  }
  if (last < text.length) parts.push({ text: text.slice(last), kind: 'text' });

  return parts.map((p, i) => {
    if (p.kind === 'url') {
      return (
        <a
          key={i}
          href="#"
          onClick={(e) => e.preventDefault()}
          aria-label={`Suspicious link ${p.text}`}
          className="inline-flex items-center gap-1 underline decoration-wavy decoration-risk-orange/70 underline-offset-2 text-amber-200 hover:text-amber-100"
        >
          <Link2 className="size-3" aria-hidden="true" /> {p.text}
        </a>
      );
    }
    return (
      <span
        key={i}
        className={cx(
          p.kind === 'urgent' && 'font-semibold text-red-300',
          p.kind === 'money' && 'font-semibold text-yellow-200',
        )}
      >
        {p.text}
      </span>
    );
  });
}

export function PhoneMockup({ message, name = 'Unknown Sender', pending = true }: { message: string; name?: string; pending?: boolean }) {
  const [muted, setMuted] = useState(false);
  return (
    <div
      className="relative mx-auto w-[300px] overflow-hidden rounded-[2.2rem] border border-white/15 bg-ink-900/80 shadow-panel backdrop-blur"
      role="img"
      aria-label="Simulated message preview"
    >
      {/* notch */}
      <div className="relative flex items-center justify-between border-b border-white/8 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-full bg-risk-red/20 text-risk-red">
            <ShieldAlert className="size-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">ScamShield Demo</p>
            <p className="text-[10px] text-slate-500">{muted ? 'Notifications off' : 'New message'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-slate-400">
          <button
            aria-label="Unmute"
            onClick={() => setMuted((v) => !v)}
            className="transition hover:text-white"
          >
            <Phone className="size-4" aria-hidden="true" />
          </button>
          <button
            aria-label="Video call"
            className="transition hover:text-white"
          >
            <Video className="size-4" aria-hidden="true" />
          </button>
          <button aria-label="More options" className="transition hover:text-white">
            <MoreVertical className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* body */}
      <div className="flex flex-col gap-2 p-4" style={{ minHeight: 200 }}>
        <div className="mx-auto rounded-full bg-white/5 px-3 py-1 text-[10px] text-slate-500">
          {new Date().toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
        </div>

        <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-accent-deep/20 px-3.5 py-2 text-sm text-cyan-50">
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-accent">You</p>
          <p>Hi, is this offer real? Should I share my details?</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-[85%] rounded-2xl rounded-tl-sm border border-white/10 bg-zinc-800/90 px-3.5 py-2.5 text-[13px] leading-relaxed text-slate-200"
        >
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-risk-red">Suspicious sender</p>
          {highlightMessage(message)}
        </motion.div>

        {pending && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="flex items-center gap-2 text-[11px] text-slate-500"
          >
            <ChevronLeft className="size-3 rotate-180" aria-hidden="true" />
            Message flagged by ScamShield AI
          </motion.div>
        )}
      </div>
    </div>
  );
}