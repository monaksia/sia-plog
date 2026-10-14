import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { signToken, requireAuth } from '../auth.js';
import { rateLimit } from '../lib/rate-limit.js';
import { badRequest } from '../lib/errors.js';

const router = Router();
const dummyHash = bcrypt.hashSync('invalid-account-timing-placeholder', 10);
router.post('/login', rateLimit(), async (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== 'string' || !username.trim() || username.length > 64 ||
      typeof password !== 'string' || !password || password.length > 256) {
    throw badRequest('请输入有效的用户名和密码');
  }
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND active = 1').get(username);
  const matches = await bcrypt.compare(password, user?.password_hash || dummyHash);
  if (!user || !matches) return res.status(401).json({ error: '用户名或密码错误' });
  res.set('Cache-Control', 'no-store').json({ token: signToken(user), username: user.username });
});
router.get('/me', requireAuth, (req, res) => res.json({ username: req.user.username }));
router.post('/logout', requireAuth, (req, res) => {
  db.prepare('DELETE FROM sessions WHERE jti = ?').run(req.user.jti);
  res.json({ ok: true });
});
router.post('/logout-all', requireAuth, (req, res) => {
  db.transaction(() => {
    db.prepare('UPDATE users SET token_version = token_version + 1 WHERE id = ?').run(req.user.id);
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(req.user.id);
  })();
  res.json({ ok: true });
});
export default router;
