import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Background } from './Background';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export function PageShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div className="flex min-h-screen flex-col bg-ink-950 font-body text-slate-200 antialiased">
      <Background />
      <Navbar />
      <motion.main
        key={pathname}
        initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex-1 pt-16"
      >
        {children}
      </motion.main>
      <Footer />
    </div>
  );
}