import React, { useEffect } from 'react';
import styles from './NeonPopup.module.css';

const NeonPopup = ({ open, title = 'Details', items = [], sections = [], actions = null, onClose }) => {
  // Support keyboard nav between sections (if provided)
  const sectionCount = Array.isArray(sections) ? sections.length : 0;
  const [index, setIndex] = React.useState(0);

  useEffect(() => { setIndex(0); }, [open]);

  const goPrev = () => setIndex(i => Math.max(0, i - 1));
  const goNext = () => setIndex(i => Math.min(sectionCount - 1, i + 1));

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') { onClose && onClose(); }
      if (sectionCount > 1) {
        if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
        if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, sectionCount]);
  useEffect(() => {
    if (open) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const onKey = (e) => { if (e.key === 'Escape') onClose && onClose(); };
      window.addEventListener('keydown', onKey);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', onKey);
      };
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.container} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.title}>{title}</div>
          <button className={styles.closeBtn} aria-label="Close" onClick={onClose}>×</button>
        </div>
        <div className={styles.content}>
          {sections && sections.length > 0 && (
            <div>
              {/* Pager */}
              {sectionCount > 1 && (
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
                  <button className={styles.clearBtn}
                          onClick={goPrev}
                          disabled={index===0}
                          aria-label="Previous">
                    ◀
                  </button>
                  <div style={{fontSize:12, opacity:0.8}}>{index+1} / {sectionCount}</div>
                  <button className={styles.clearBtn}
                          onClick={goNext}
                          disabled={index===sectionCount-1}
                          aria-label="Next">
                    ▶
                  </button>
                </div>
              )}
              <div className={styles.sections}>
                <div className={styles.section}>
                  {sections[index]?.title && <div className={styles.sectionTitle}>{sections[index].title}</div>}
                  {sections[index]?.content && <div className={styles.sectionBody}>{sections[index].content}</div>}
                </div>
              </div>
            </div>
          )}
          {items && items.length > 0 && (
            <div className={styles.items}>
              {items.map((it, idx) => (
                <div key={idx} className={styles.itemRow}>
                  <div className={styles.itemLeft}>
                    <div className={styles.dot + ' ' + (it.status === 'good' ? styles.green : it.status === 'bad' ? styles.red : styles.neutral)} />
                    <div className={styles.itemLabel}>{it.label}</div>
                  </div>
                  <div className={styles.itemRight}>
                    {it.metrics && Object.entries(it.metrics).map(([k,v]) => (
                      <div key={k} className={styles.metric}><span className={styles.metricKey}>{k}:</span> <span className={styles.metricVal}>{v}</span></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {actions && (
            <div className={styles.footer}>
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NeonPopup;