/**
 * 创建管理员账户
 * 用法: node server/setup.js <用户名> <密码>
 * 示例: node server/setup.js admin mypassword123
 */
import bcrypt from 'bcryptjs';
import db from './db.js';

const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('用法: node server/setup.js <用户名> <密码>');
  console.log('示例: node server/setup.js admin mypassword123');
  process.exit(1);
}

const [username, password] = args;
if (password.length < 6) {
  console.error('错误: 密码至少 6 个字符');
  process.exit(1);
}

const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
if (existing) {
  // 更新密码
  const hash = bcrypt.hashSync(password, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE username = ?').run(hash, username);
  console.log(`✅ 管理员 "${username}" 密码已更新`);
} else {
  const hash = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, hash);
  console.log(`✅ 管理员 "${username}" 创建成功`);
}

process.exit(0);
