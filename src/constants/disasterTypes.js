export const DISASTER_TYPES = {
  flood: {
    id: 'flood',
    label: 'Inondation',
    icon: 'wave',
    description: 'Montée des eaux, débordement, ruissellement.',
  },
  landslide: {
    id: 'landslide',
    label: 'Glissement de terrain',
    icon: 'mountain',
    description: 'Affaissement de sol, éboulement, coulée de boue.',
  },
  fire: {
    id: 'fire',
    label: 'Incendie',
    icon: 'flame',
    description: 'Feu de bâtiment, de marché ou de végétation.',
  },
  storm: {
    id: 'storm',
    label: 'Tempête',
    icon: 'wind',
    description: 'Vents violents, tornade, dégâts matériels.',
  },
  other: {
    id: 'other',
    label: 'Autre',
    icon: 'alert',
    description: 'Tout événement urgent non listé ci-dessus.',
  },
};

export const DISASTER_TYPE_LIST = Object.values(DISASTER_TYPES);
