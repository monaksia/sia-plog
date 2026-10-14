import { badRequest } from './errors.js';

export function objectBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw badRequest('请求内容必须是对象');
  return body;
}
export function text(value, name, { max = 1000, required = false } = {}) {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) {
    throw badRequest(`${name}格式无效`);
  }
  return value;
}
export function number(value, name, { min, max, integer = false, nullable = false }) {
  if (value === null && nullable) return null;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max ||
      (integer && !Number.isInteger(value))) throw badRequest(`${name}格式无效`);
  return value;
}
export function imageUrl(value, name) {
  text(value, name, { max: 2000 });
  if (!value) return value;
  if (/^\/(uploads|img|covers)\/(?!.*(?:\.\.|[\\\s?#]))[\w./-]+$/.test(value)) return value;
  try {
    const url = new URL(value);
    if (['http:', 'https:'].includes(url.protocol) && !url.username && !url.password) return value;
  } catch { /* invalid URL */ }
  throw badRequest(`${name}必须是图片路径或 HTTP(S) 地址`);
}
export function positiveId(value) {
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < 1) throw badRequest('无效的 ID');
  return Number(value);
}
export function reviewInput(body, fields, existing = null) {
  objectBody(body);
  const result = {};
  for (const field of fields) {
    let value = Object.hasOwn(body, field) ? body[field] : existing?.[field];
    if (value === undefined) value = field === 'year' ? null : field === 'rating' ? 0 : '';
    if (field === 'rating') result[field] = number(value, '评分', { min: 0, max: 5 });
    else if (field === 'year') result[field] = number(value, '年份', { min: 1000, max: 3000, integer: true, nullable: true });
    else if (field === 'cover' || field === 'poster') result[field] = imageUrl(value, field);
    else {
      if (['genre', 'cast', 'tags'].includes(field) && Array.isArray(value)) {
        value = value.map(item => text(item, field, { max: 100 })).join(', ');
      }
      result[field] = text(value, field, { required: field === 'title', max: field === 'review' ? 200_000 : field === 'excerpt' ? 2000 : 1000 });
    }
  }
  let slug = body.slug ?? existing?.slug ?? result.title.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\p{L}\p{N}_-]/gu, '');
  if (!slug) slug = Date.now().toString(36);
  if (typeof slug !== 'string' || !/^[\p{L}\p{N}_-]{1,120}$/u.test(slug) || slug === 'new') throw badRequest('slug 格式无效');
  if (existing && slug !== existing.slug) throw badRequest('已发布内容的 slug 不可修改');
  return { ...result, slug };
}
export function photoInput(body, existing = null) {
  objectBody(body);
  const result = {};
  for (const field of ['alt', 'camera', 'location', 'date_taken', 'notes']) {
    result[field] = text(Object.hasOwn(body, field) ? body[field] : existing?.[field] ?? '', field, { max: field === 'notes' ? 5000 : 500 });
  }
  let sort = Object.hasOwn(body, 'sort_order') ? body.sort_order : existing?.sort_order ?? 0;
  if (typeof sort === 'string' && /^-?\d+$/.test(sort)) sort = Number(sort);
  result.sort_order = number(sort, '排序', { min: -1_000_000, max: 1_000_000, integer: true });
  return result;
}
