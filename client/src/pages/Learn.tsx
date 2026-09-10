import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fish, UserCog, Briefcase, KeyRound, Gift, Link2, Check, X, BookOpen, GraduationCap } from 'lucide-react';
import { GlassCard, SectionLabel, Badge } from '../components/ui/primitives';
import { cx } from '../lib/utils';
import { useToast } from '../components/ui/Feedback';

const TOPICS = [
  { icon: Fish, title: 'How phishing works', desc: 'Fake login pages and urgent emails that steal credentials. Always type official addresses yourself.', tone: 'text-cyan-300 bg-cyan-500/10' },
  { icon: UserCog, title: 'How social engineering works', desc: 'Attackers sell you a believable story — urgency, fear, authority and trust — to bypass your reasoning.', tone: 'text-violet-300 bg-violet-500/10' },
  { icon: Briefcase, title: 'How fake job scams work', desc: 'Ridiculously good salaries, WhatsApp interviews and "registration fees". Real employers don\'t charge to hire you.', tone: 'text-orange-300 bg-orange-500/10' },
  { icon: KeyRound, title: 'How OTP scams work', desc: 'Codes that unlock your accounts. A bank never asks you to forward an OTP — never share one.', tone: 'text-red-300 bg-red-500/10' },
  { icon: Gift, title: 'How fake prize scams work', desc: 'A reward you never entered for, unlocked by "processing fees". Free money that needs a fee is a contradiction.', tone: 'text-yellow-300 bg-yellow-500/10' },
  { icon: Link2, title: 'How to verify suspicious links', desc: 'Hover before you click. Check for http://, weird domains, IP hosting and spelling. Verify by retyping official URLs.', tone: 'text-emerald-300 bg-emerald-500/10' },
];

const QUIZ = [
  {
    message: '"Your electricity will be disconnected in 2 hours unless you pay ₹3,400 on this link. Act immediately."',
    verdict: 'suspicious',
    why: 'Legitimate utilities don\'t threaten disconnection over an SMS with a random link — that\'s fear plus urgency to force a hasty payment.',
  },
  {
    message: '"Hi, your order has shipped. Updates will appear in your account order history."',
    verdict: 'safe',
    why: 'Points to your own account rather than demanding action — a common mark of a genuine message. Still, log in directly, never via a link.',
  },
  {
    message: '"Congratulations! You\'ve won a free iPhone. Reply with your bank details to claim it today."',
    verdict: 'suspicious',
    why: 'Reward bait plus a request for financial details. Legitimate prizes never need your bank details to be "claimed".',
  },
  {
    message: '"Job opening: Earn ₹50,000/week from home. No experience. Pay ₹999 to confirm your seat and message us on Telegram."',
    verdict: 'suspicious',
    why: 'Too-good pay, no experience needed, a fee to apply, and a move to unmonitored channels are classic fake-job patterns.',
  },
];

type Choice = 'safe' | 'suspicious' | null;

export function Learn() {
  const [answers, setAnswers] = useState<Record<number, Choice>>({});
  const [openTopic, setOpenTopic] = useState<number | null>(null);
  const toast = useToast();

  const answered = Object.keys(answers).length;

  const choose = (i: number, c: Choice) => {
    setAnswers((prev) => ({ ...prev, [i]: c }));
    const q = QUIZ[i];
    if (c === q.verdict) toast.push(`Correct! ${q.why.slice(0, 90)}…`, 'success');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-10">
        <SectionLabel>Scam education center</SectionLabel>
        <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">Learn to spot the patterns</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Scams repeat the same psychological tricks. Learn to recognize them, practise with a quick quiz, and you will
          become considerably harder to trick.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {TOPICS.map((topic, i) => (
          <motion.div
            key={topic.title}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 * i }}
          >
            <button
              onClick={() => setOpenTopic(openTopic === i ? null : i)}
              aria-expanded={openTopic === i}
              className="w-full rounded-2xl border border-white/8 bg-white/[0.03] p-6 text-left backdrop-blur transition-all hover:-translate-y-0.5 hover:border-white/20"
            >
              <span className={cx('grid size-11 place-items-center rounded-xl', topic.tone)}>
                <topic.icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-display text-base font-semibold text-white">{topic.title}</h3>
              <AnimatePresence initial={false}>
                {openTopic === i && (
                  <motion.p
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden text-sm leading-relaxed text-slate-400"
                  >
                    {topic.desc}
                  </motion.p>
                )}
              </AnimatePresence>
              {openTopic !== i && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-500">{topic.desc}</p>}
            </button>
          </motion.div>
        ))}
      </div>

      <div className="mt-16">
        <GlassCard className="p-6 sm:p-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <GraduationCap className="size-6 text-accent" aria-hidden="true" />
              <div>
                <h2 className="font-display text-xl font-bold text-white sm:text-2xl">Would you trust this message?</h2>
                <p className="text-xs text-slate-500">A quick judgement quiz — {answered}/{QUIZ.length} answered</p>
              </div>
            </div>
            {answered === QUIZ.length && (
              <Badge tone="green">
                <BookOpen className="size-3.5" aria-hidden="true" /> Quiz complete
              </Badge>
            )}
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {QUIZ.map((q, i) => {
              const choice = answers[i];
              const correct = choice === q.verdict;
              return (
                <div key={i} className="rounded-2xl border border-white/8 bg-ink-900/60 p-5">
                  <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3.5 font-mono text-xs leading-relaxed text-slate-300">
                    {q.message}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {(['safe', 'suspicious'] as const).map((option) => {
                      const selected = choice === option;
                      const reveal = !!choice;
                      const isVerdict = q.verdict === option;
                      return (
                        <button
                          key={option}
                          disabled={!!choice}
                          onClick={() => choose(i, option)}
                          className={cx(
                            'rounded-xl border px-4 py-2.5 text-xs font-semibold uppercase tracking-widest transition-all',
                            !reveal && 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10',
                            reveal && isVerdict && 'border-risk-green/40 bg-risk-green/15 text-risk-green',
                            reveal && !isVerdict && selected && 'border-risk-red/40 bg-risk-red/15 text-risk-red',
                            reveal && !isVerdict && !selected && 'border-white/5 bg-white/[0.02] text-slate-600',
                          )}
                        >
                          {option === 'safe' ? 'Safe' : 'Suspicious'}
                        </button>
                      );
                    })}
                  </div>
                  <AnimatePresence>
                    {choice && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-3"
                      >
                        <div
                          className={cx(
                            'flex items-start gap-2 rounded-xl border p-3 text-xs leading-relaxed',
                            correct ? 'border-risk-green/25 bg-risk-green/5 text-emerald-100' : 'border-risk-red/25 bg-risk-red/5 text-red-100',
                          )}
                        >
                          {correct ? <Check className="mt-0.5 size-4 shrink-0 text-risk-green" aria-hidden="true" /> : <X className="mt-0.5 size-4 shrink-0 text-risk-red" aria-hidden="true" />}
                          <span>
                            {correct ? (
                              <>Correct! </>
                            ) : (
                              <>Not quite — the pattern here is “{q.verdict}”. </>
                            )}
                            {q.why}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}