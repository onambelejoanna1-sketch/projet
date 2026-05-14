export const SEVERITY_LEVELS = {
  low: { id: 'low', label: 'Faible', color: '#6B7166' },
  medium: { id: 'medium', label: 'Modérée', color: '#B8860B' },
  high: { id: 'high', label: 'Élevée', color: '#E5572E' },
  critical: { id: 'critical', label: 'Critique', color: '#C8102E' },
};

export const SEVERITY_LIST = Object.values(SEVERITY_LEVELS);

export const SEVERITY_LABEL = Object.fromEntries(
  Object.entries(SEVERITY_LEVELS).map(([id, def]) => [id, def.label]),
);

export const SEVERITY_RANK = { low: 1, medium: 2, high: 3, critical: 4 };
