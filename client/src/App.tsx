import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { PageShell } from './components/layout/PageShell';
import { Spinner } from './components/ui/primitives';
import { AuthProvider } from './context/AuthContext';
import { Protected } from './components/auth/Protected';

const Landing = lazy(() => import('./pages/Landing').then((m) => ({ default: m.Landing })));
const Analyze = lazy(() => import('./pages/Analyze').then((m) => ({ default: m.Analyze })));
const Results = lazy(() => import('./pages/Results').then((m) => ({ default: m.Results })));
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const HistoryPage = lazy(() => import('./pages/History').then((m) => ({ default: m.HistoryPage })));
const Learn = lazy(() => import('./pages/Learn').then((m) => ({ default: m.Learn })));
const About = lazy(() => import('./pages/About').then((m) => ({ default: m.About })));
const Privacy = lazy(() => import('./pages/Privacy').then((m) => ({ default: m.Privacy })));
const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })));
const Signup = lazy(() => import('./pages/Signup').then((m) => ({ default: m.Signup })));
const AuthCallback = lazy(() => import('./pages/AuthCallback').then((m) => ({ default: m.AuthCallback })));

function Fallback() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <Spinner className="size-6" />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PageShell>
        <Suspense fallback={<Fallback />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/analyze" element={<Analyze />} />
            <Route path="/results/:id" element={<Results />} />
            <Route
              path="/dashboard"
              element={
                <Protected>
                  <Dashboard />
                </Protected>
              }
            />
            <Route
              path="/history"
              element={
                <Protected>
                  <HistoryPage />
                </Protected>
              }
            />
            <Route path="/learn" element={<Learn />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="*" element={<Landing />} />
          </Routes>
        </Suspense>
      </PageShell>
    </AuthProvider>
  );
}