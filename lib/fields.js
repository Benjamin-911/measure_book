// Groups measurement fields by which garment types actually need them.
// The profile page uses this to organize the display instead of showing
// one long flat list.

export const FIELD_GROUPS = [
  {
    label: 'For dresses and tops',
    fields: [
      { key: 'bust', label: 'Bust' },
      { key: 'waist', label: 'Waist' },
      { key: 'hip', label: 'Hip' },
      { key: 'shoulder_width', label: 'Shoulder' },
      { key: 'sleeve_length', label: 'Sleeve' },
      { key: 'bodice_length', label: 'Bodice length' },
      { key: 'neck', label: 'Neck' },
      { key: 'arm_hole', label: 'Arm hole' },
    ],
  },
  {
    label: 'For trousers and skirts',
    fields: [
      { key: 'waist', label: 'Waist' },
      { key: 'hip', label: 'Hip' },
      { key: 'inseam', label: 'Inseam' },
      { key: 'trouser_length', label: 'Trouser length' },
      { key: 'skirt_length', label: 'Skirt length' },
    ],
  },
];

export const ALL_MEASUREMENT_KEYS = [
  'bust', 'waist', 'hip', 'shoulder_width', 'sleeve_length',
  'bodice_length', 'neck', 'arm_hole', 'inseam', 'trouser_length',
  'skirt_length',
];

export const ALL_FIELDS = Array.from(
  new Map(
    FIELD_GROUPS.flatMap((g) => g.fields).map((f) => [f.key, f])
  ).values()
);
