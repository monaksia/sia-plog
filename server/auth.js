import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import db from './db.js';

const secret = process.env.JWT_SECRET;
if (!secret || Buffer.byteLength(secret) < 43 || secret === 'sia-plog-secret-change-me') {
  throw new Error('JWT_SECRET must be set to a strong random secret of at least 43 characters');
}
const options = { algorithm: 'HS256', issuer: 'sia-plog', audience: 'sia-plog-admin', expiresIn: '8h' };

export function signToken(user) {
  const jti = randomUUID();
  const now = Math.floor(Date.now() / 1000);
  db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(now);
  db.prepare('INSERT INTO sessions(jti, user_id, expires_at) VALUES (?, ?, ?)').run(jti, user.id, now + 8 * 3600);
  return jwt.sign({ id: user.id, version: user.token_version }, secret, { ...options, jwtid: jti });
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: '未登录' });
  try {
    const claims = jwt.verify(header.slice(7), secret, {
      algorithms: ['HS256'], issuer: options.issuer, audience: options.audience,
    });
    if (!Number.isSafeInteger(claims.id) || typeof claims.jti !== 'string') throw new Error('Invalid identity');
    const user = db.prepare(`SELECT u.id, u.username, u.token_version FROM users u
      JOIN sessions s ON s.user_id = u.id WHERE u.id = ? AND u.active = 1
      AND s.jti = ? AND s.expires_at > ?`).get(claims.id, claims.jti, Math.floor(Date.now() / 1000));
    if (!user || user.token_version !== claims.version) throw new Error('Revoked session');
    req.user = { ...user, jti: claims.jti };
  } catch {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
  next();
}
