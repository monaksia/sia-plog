/**
 * 摄影作品示例数据
 * 添加新照片：把 WebP 放入 public/photos/ 然后在此数组新增条目
 *
 * 图片优化命令：
 *   node scripts/optimize-images.mjs
 *   或：npx sharp -i public/photos/raw/xxx.png -o public/photos/xxx.webp --webp -q 80 --resize 1200
 */
const photos = [
  {
    src: '/img/138900663_p0.png',
    alt: 'my life style',
    width: 1805,
    height: 1205,
    camera: '',
    location: '',
    date_taken: '',
    notes: '',
  },
  // 示例（替换为你的真实照片）：
  // {
  //   src: '/photos/street-01.webp',
  //   alt: '东京街头黄昏',
  //   width: 1200,
  //   height: 800,
  //   camera: 'Fujifilm X-T5 · f/2.8 · 1/250s · ISO 800',
  // },
  // {
  //   src: '/photos/landscape-01.webp',
  //   alt: '日落富士山',
  //   width: 1200,
  //   height: 800,
  //   camera: 'Sony A7M4 · f/8 · 1/500s · ISO 100',
  // },
  // {
  //   src: '/photos/portrait-01.webp',
  //   alt: '咖啡馆窗边',
  //   width: 800,
  //   height: 1200,
  //   camera: 'Fujifilm X-T5 · f/1.4 · 1/500s · ISO 400',
  // },
  // {
  //   src: '/photos/night-01.webp',
  //   alt: '涩谷十字路口',
  //   width: 1200,
  //   height: 800,
  //   camera: 'Sony A7M4 · f/2 · 1/60s · ISO 3200',
  // },
];

export default photos;
