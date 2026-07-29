import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/reset.css';
import './styles/variables.css';
import './styles/main.css';
import './pages/Admin/Admin.css';

// Global scroll-reveal observer — automatically adds .visible to .reveal elements
function initGlobalReveal() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -30px 0px' }
  );

  // Observe existing .reveal elements
  const observeAll = () => {
    document.querySelectorAll('.reveal:not(.visible)').forEach((el) => observer.observe(el));
  };

  // Initial scan
  observeAll();

  // Watch for dynamically added .reveal elements
  new MutationObserver(observeAll).observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// Run after first paint
requestAnimationFrame(() => {
  requestAnimationFrame(initGlobalReveal);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
