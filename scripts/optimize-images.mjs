import sharp from 'sharp';
import { readdirSync } from 'fs';

const INPUT = 'public/img/138900663_p0.png';
const OUTPUT_DIR = 'public/img/optimized';

// 生成多尺寸 WebP + 缩略图占位符
async function optimize() {
  // 确保输出目录
  const { mkdirSync } = await import('fs');
  mkdirSync(OUTPUT_DIR, { recursive: true });

  // 目标宽度（移动端 / 平板 / 桌面）
  const sizes = [
    { width: 400,  suffix: 'sm' },
    { width: 800,  suffix: 'md' },
    { width: 1200, suffix: 'lg' },
  ];

  for (const { width, suffix } of sizes) {
    await sharp(INPUT)
      .resize(width, null, { withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(`${OUTPUT_DIR}/lifestyle-${suffix}.webp`);
    console.log(`✅ ${width}w WebP done`);
  }

  // 极小模糊占位符（10px，用于懒加载 blur-up 效果）
  await sharp(INPUT)
    .resize(10, null, { withoutEnlargement: true })
    .webp({ quality: 20 })
    .toFile(`${OUTPUT_DIR}/lifestyle-placeholder.webp`);
  console.log('✅ Placeholder done');

  // 输出体积对比
  const original = (await import('fs')).statSync(INPUT);
  console.log(`\n📦 原始 PNG: ${(original.size / 1024 / 1024).toFixed(1)} MB`);

  const files = readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.webp'));
  let total = 0;
  for (const f of files) {
    const s = (await import('fs')).statSync(`${OUTPUT_DIR}/${f}`);
    total += s.size;
    console.log(`   ${f}: ${(s.size / 1024).toFixed(1)} KB`);
  }
  console.log(`   所有 WebP 合计: ${(total / 1024).toFixed(1)} KB（压缩至 ${((total / original.size) * 100).toFixed(1)}%）`);
}

optimize();
