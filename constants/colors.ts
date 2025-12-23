import { ColorPalette, Theme } from '../types';

// 15 Color Palettes for task customization
export const colorPalettes: ColorPalette[] = [
  {
    id: 'ocean_breeze',
    name: 'Ocean Breeze',
    colors: [
      '#0077B6', // Deep Ocean Blue
      '#00B4D8', // Bright Cyan
      '#48CAE4', // Light Cyan
      '#90E0EF', // Pale Blue
      '#023E8A', // Navy Blue
      '#0096C7', // Medium Blue
      '#ADE8F4', // Ice Blue
      '#CAF0F8', // Lightest Blue
    ],
    preview: ['#0077B6', '#00B4D8', '#48CAE4', '#90E0EF', '#023E8A'],
  },
  {
    id: 'sunset_vibes',
    name: 'Sunset Vibes',
    colors: [
      '#FF6B6B', // Coral Red
      '#FF8E72', // Salmon
      '#FFA07A', // Light Salmon
      '#FFB347', // Pastel Orange
      '#FF6F61', // Living Coral
      '#C9184A', // Ruby Red
      '#FF758F', // Rose
      '#FF9A8B', // Peach
    ],
    preview: ['#FF6B6B', '#FF8E72', '#FFA07A', '#FFB347', '#FF6F61'],
  },
  {
    id: 'forest_fresh',
    name: 'Forest Fresh',
    colors: [
      '#2D6A4F', // Forest Green
      '#40916C', // Medium Green
      '#52B788', // Emerald
      '#74C69D', // Light Green
      '#95D5B2', // Pale Green
      '#1B4332', // Dark Forest
      '#B7E4C7', // Mint
      '#8B4513', // Saddle Brown
    ],
    preview: ['#2D6A4F', '#40916C', '#52B788', '#74C69D', '#1B4332'],
  },
  {
    id: 'lavender_dreams',
    name: 'Lavender Dreams',
    colors: [
      '#7B68EE', // Medium Slate Blue
      '#9370DB', // Medium Purple
      '#BA55D3', // Medium Orchid
      '#DDA0DD', // Plum
      '#E6E6FA', // Lavender
      '#8A2BE2', // Blue Violet
      '#9932CC', // Dark Orchid
      '#DA70D6', // Orchid
    ],
    preview: ['#7B68EE', '#9370DB', '#BA55D3', '#DDA0DD', '#8A2BE2'],
  },
  {
    id: 'citrus_pop',
    name: 'Citrus Pop',
    colors: [
      '#FFD93D', // Bright Yellow
      '#FF9F1C', // Orange Peel
      '#FFBF00', // Amber
      '#C5E063', // Yellow Green
      '#6BCB77', // Lime Green
      '#F4D03F', // Sunflower
      '#FFC300', // Golden
      '#DAF7A6', // Light Lime
    ],
    preview: ['#FFD93D', '#FF9F1C', '#FFBF00', '#C5E063', '#6BCB77'],
  },
  {
    id: 'berry_blend',
    name: 'Berry Blend',
    colors: [
      '#9B2335', // Deep Berry
      '#D63384', // Magenta
      '#E91E63', // Pink
      '#C71585', // Medium Violet Red
      '#DB7093', // Pale Violet Red
      '#FF1493', // Deep Pink
      '#FF69B4', // Hot Pink
      '#8B0A50', // Deep Magenta
    ],
    preview: ['#9B2335', '#D63384', '#E91E63', '#C71585', '#FF1493'],
  },
  {
    id: 'pastel_paradise',
    name: 'Pastel Paradise',
    colors: [
      '#FFB3BA', // Light Pink
      '#FFDFBA', // Peach
      '#FFFFBA', // Light Yellow
      '#BAFFC9', // Light Green
      '#BAE1FF', // Light Blue
      '#E0BBE4', // Light Purple
      '#D4A5A5', // Dusty Rose
      '#A8E6CF', // Mint Green
    ],
    preview: ['#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF'],
  },
  {
    id: 'neon_nights',
    name: 'Neon Nights',
    colors: [
      '#FF00FF', // Magenta
      '#00FFFF', // Cyan
      '#FF1493', // Deep Pink
      '#39FF14', // Neon Green
      '#FF6600', // Neon Orange
      '#FFFF00', // Yellow
      '#7DF9FF', // Electric Blue
      '#FF073A', // Neon Red
    ],
    preview: ['#FF00FF', '#00FFFF', '#39FF14', '#FF6600', '#FF073A'],
  },
  {
    id: 'professional',
    name: 'Professional',
    colors: [
      '#3498DB', // Professional Blue
      '#2ECC71', // Emerald Green
      '#9B59B6', // Amethyst
      '#E74C3C', // Alizarin
      '#1ABC9C', // Turquoise
      '#34495E', // Wet Asphalt
      '#F39C12', // Orange
      '#95A5A6', // Concrete
    ],
    preview: ['#3498DB', '#2ECC71', '#9B59B6', '#E74C3C', '#1ABC9C'],
  },
  {
    id: 'monochrome_plus',
    name: 'Monochrome+',
    colors: [
      '#2C3E50', // Dark Blue Gray
      '#7F8C8D', // Gray
      '#BDC3C7', // Silver
      '#3498DB', // Accent Blue
      '#34495E', // Charcoal
      '#95A5A6', // Concrete
      '#1A252F', // Dark Slate
      '#ECF0F1', // Clouds
    ],
    preview: ['#2C3E50', '#7F8C8D', '#BDC3C7', '#3498DB', '#34495E'],
  },
  {
    id: 'autumn_harvest',
    name: 'Autumn Harvest',
    colors: [
      '#D2691E', // Chocolate
      '#CD853F', // Peru
      '#A0522D', // Sienna
      '#8B4513', // Saddle Brown
      '#B8860B', // Dark Goldenrod
      '#DAA520', // Goldenrod
      '#CC5500', // Burnt Orange
      '#8B0000', // Dark Red
    ],
    preview: ['#D2691E', '#CD853F', '#A0522D', '#B8860B', '#CC5500'],
  },
  {
    id: 'candy_shop',
    name: 'Candy Shop',
    colors: [
      '#FF69B4', // Hot Pink
      '#00CED1', // Dark Turquoise
      '#FFD700', // Gold
      '#FF6347', // Tomato
      '#40E0D0', // Turquoise
      '#EE82EE', // Violet
      '#87CEEB', // Sky Blue
      '#FFA500', // Orange
    ],
    preview: ['#FF69B4', '#00CED1', '#FFD700', '#FF6347', '#EE82EE'],
  },
  {
    id: 'nordic_cool',
    name: 'Nordic Cool',
    colors: [
      '#4A5568', // Cool Gray
      '#718096', // Gray
      '#A0AEC0', // Light Gray
      '#5A67D8', // Indigo Accent
      '#2D3748', // Dark Gray
      '#E2E8F0', // Light
      '#CBD5E0', // Silver
      '#4299E1', // Blue Accent
    ],
    preview: ['#4A5568', '#718096', '#A0AEC0', '#5A67D8', '#2D3748'],
  },
  {
    id: 'tropical_punch',
    name: 'Tropical Punch',
    colors: [
      '#FF6B6B', // Coral
      '#4ECDC4', // Teal
      '#45B7D1', // Sky Blue
      '#96CEB4', // Sage
      '#FFEAA7', // Cream Yellow
      '#DFE6E9', // Light Gray
      '#FD79A8', // Pink
      '#A29BFE', // Periwinkle
    ],
    preview: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FD79A8'],
  },
  {
    id: 'earth_tones',
    name: 'Earth Tones',
    colors: [
      '#8D6E63', // Brown
      '#A1887F', // Light Brown
      '#BCAAA4', // Taupe
      '#795548', // Dark Brown
      '#6D4C41', // Coffee
      '#5D4037', // Dark Coffee
      '#4E342E', // Deep Brown
      '#EFEBE9', // Light Beige
    ],
    preview: ['#8D6E63', '#A1887F', '#795548', '#6D4C41', '#5D4037'],
  },
];

// Light theme
export const lightTheme: Theme = {
  dark: false,
  colors: {
    primary: '#3498DB',
    background: '#F5F5F5',
    card: '#FFFFFF',
    text: '#1A1A1A',
    textSecondary: '#666666',
    border: '#E0E0E0',
    notification: '#FF6B6B',
    success: '#2ECC71',
    warning: '#F39C12',
    error: '#E74C3C',
    surface: '#FFFFFF',
    surfaceVariant: '#F0F0F0',
    onSurface: '#1A1A1A',
    placeholder: '#999999',
  },
};

// Dark theme
export const darkTheme: Theme = {
  dark: true,
  colors: {
    primary: '#5DADE2',
    background: '#121212',
    card: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    border: '#333333',
    notification: '#FF6B6B',
    success: '#58D68D',
    warning: '#F5B041',
    error: '#EC7063',
    surface: '#1E1E1E',
    surfaceVariant: '#2A2A2A',
    onSurface: '#FFFFFF',
    placeholder: '#666666',
  },
};

// Get default palette
export const getDefaultPalette = (): ColorPalette => colorPalettes[0];

// Get palette by ID
export const getPaletteById = (id: string): ColorPalette | undefined => {
  return colorPalettes.find(p => p.id === id);
};

// Get color for task based on task index and palette
export const getTaskColor = (taskIndex: number, palette: ColorPalette): string => {
  return palette.colors[taskIndex % palette.colors.length];
};
