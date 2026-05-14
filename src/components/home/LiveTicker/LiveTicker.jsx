import { useEffect, useState } from 'react';
import { getPublicTicker } from '@/services/api';
import { disasterLabel } from '@/utils/labels';
import { formatTime } from '@/utils/dates';
import styles from './LiveTicker.module.css';

function Item({ item }) {
  return (
    <span className={styles.item}>
      <span className={styles.time}>{formatTime(item.time)}</span>
      <span className={styles.kind}>{disasterLabel(item.kind)}</span>
      <span className={styles.zone}>· {item.zone}</span>
      <span className={styles.sep} aria-hidden="true">
        ◆
      </span>
    </span>
  );
}

export default function LiveTicker() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let cancelled = false;
    function load() {
      getPublicTicker(6)
        .then((rows) => {
          if (!cancelled) setItems(rows);
        })
        .catch(() => {
          if (!cancelled) setItems([]);
        });
    }
    load();
    const interval = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (items.length === 0) {
    return (
      <div className={styles.ticker} aria-label="Fil des dernières alertes">
        <div className={styles.label}>
          <span className={styles.dot} aria-hidden="true" />
          Fil direct
        </div>
        <div className={styles.track}>
          <div className={styles.row}>
            <span className={styles.item}>
              <span className={styles.kind}>Aucune alerte récente.</span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Doublé pour l'effet de défilement infini.
  const doubled = [...items, ...items];
  return (
    <div className={styles.ticker} aria-label="Fil des dernières alertes">
      <div className={styles.label}>
        <span className={styles.dot} aria-hidden="true" />
        Fil direct
      </div>
      <div className={styles.track}>
        <div className={styles.row}>
          {doubled.map((item, i) => (
            <Item key={`${item.id}-${i}`} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
