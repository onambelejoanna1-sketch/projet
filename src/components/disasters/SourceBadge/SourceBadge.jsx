import Badge from '@/components/common/Badge/Badge';

const CONFIG = {
  user: { tone: 'clay', label: 'Communauté', icon: '◇' },
  sensor: { tone: 'validated', label: 'Capteur IoT', icon: '⏚' },
  'sensor-live': { tone: 'live', label: 'Capteur en direct', icon: '⏚' },
};

export default function SourceBadge({ source, className }) {
  const cfg = CONFIG[source] ?? CONFIG.user;
  return (
    <Badge tone={cfg.tone} dot={source === 'sensor-live'} className={className}>
      <span aria-hidden="true">{cfg.icon}</span>
      {cfg.label}
    </Badge>
  );
}
