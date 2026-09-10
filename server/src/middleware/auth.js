import { verifyToken } from '../auth/token.js';

function readToken(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  return verifyToken(token);
}

export function requireAuth(req, res, next) {
  const payload = readToken(req);
  if (!payload || !payload.userId) {
    return res.status(401).json({ error: 'You need to sign in to continue.' });
  }
  req.user = { id: payload.userId, email: payload.email, name: payload.name };
  next();
}

export function optionalAuth(req, _res, next) {
  const payload = readToken(req);
  if (payload && payload.userId) {
    req.user = { id: payload.userId, email: payload.email, name: payload.name };
  }
  next();
}