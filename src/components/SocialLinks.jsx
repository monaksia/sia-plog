const LINKS = [
  {
    id: 'github',
    label: 'GitHub',
    handle: 'github.com/monaksia',
    url: 'https://github.com/monaksia',
    brand: '#f0f6fc',
    glow: 'rgba(240, 246, 252, 0.15)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 22v-4a4.8 4.8 0 00-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 004 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
        <path d="M9 18c-4.51 2-5-2-7-2" />
      </svg>
    ),
  },
  {
    id: 'weibo',
    label: '微博',
    handle: 'weibo.com/siaaaa',
    url: 'https://weibo.com/siaaaa',
    brand: '#ff8200',
    glow: 'rgba(255, 130, 0, 0.15)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="8.5" cy="10.5" r="3" />
        <circle cx="14" cy="11" r="2.5" />
        <path d="M8.5 13c1.5 2 4 2.5 5 2" />
        <path d="M15 14.5c1.5.5 2.5 0 2.5 0" />
        <circle cx="17" cy="10" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    id: 'bilibili',
    label: 'Bilibili',
    handle: 'space.bilibili.com',
    url: 'https://space.bilibili.com/329907805?spm_id_from=333.1365.0.0',
    brand: '#00a1d6',
    glow: 'rgba(0, 161, 214, 0.15)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="15" rx="2" />
        <path d="M8 4V2" />
        <path d="M16 4V2" />
        <path d="M7 10l3 2.5L7 15V10z" />
        <path d="M12 12.5V15" />
        <path d="M16 10l-3 2.5 3 2.5V10z" />
      </svg>
    ),
  },
];

function SocialLinks() {
  return (
    <div className="social-beacons">
      {LINKS.map((link) => (
        <a
          key={link.id}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="social-beacon"
          style={{ '--sb-brand': link.brand, '--sb-glow': link.glow }}
        >
          <span className="sb-icon-ring">
            <span className="sb-icon">{link.icon}</span>
          </span>
          <span className="sb-meta">
            <span className="sb-label">{link.label}</span>
            <span className="sb-handle">{link.handle}</span>
          </span>
          <span className="sb-cursor" aria-hidden="true" />
        </a>
      ))}
    </div>
  );
}

export default SocialLinks;
