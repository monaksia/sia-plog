import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * 打字机效果组件
 * @param {string} as - 渲染的 HTML 标签，默认 'span'
 * @param {number} speed - 每个字符间隔 ms
 * @param {boolean} cursor - 是否显示光标
 * @param {boolean} loop - 是否循环
 * @param {string} className - 额外 CSS 类名
 * @param {React.ReactNode} children - 要逐字显示的文字内容
 */
function Typewriter({
  as: Tag = 'span',
  speed = 80,
  cursor: showCursor = true,
  loop = false,
  className = '',
  children,
  ...rest
}) {
  const fullText = typeof children === 'string' ? children : '';
  const [displayText, setDisplayText] = useState('');
  const charIndexRef = useRef(0);

  const type = useCallback(() => {
    if (charIndexRef.current < fullText.length) {
      setDisplayText(fullText.slice(0, charIndexRef.current + 1));
      charIndexRef.current++;
    } else if (loop) {
      setTimeout(() => {
        charIndexRef.current = 0;
        setDisplayText('');
        // 递归重新开始
      }, 2000);
    }
  }, [fullText, loop]);

  useEffect(() => {
    if (!fullText) return;

    charIndexRef.current = 0;
    setDisplayText('');

    const timer = setInterval(() => {
      if (charIndexRef.current < fullText.length) {
        setDisplayText(fullText.slice(0, charIndexRef.current + 1));
        charIndexRef.current++;
      } else {
        clearInterval(timer);
        if (loop) {
          setTimeout(() => {
            charIndexRef.current = 0;
            setDisplayText('');
          }, 2000);
        }
      }
    }, speed);

    return () => clearInterval(timer);
  }, [fullText, speed, loop]);

  return (
    <>
      <Tag className={className} {...rest}>
        {displayText || ' '}
      </Tag>
      {showCursor && <span className="typewriter-cursor" />}
    </>
  );
}

export default Typewriter;
