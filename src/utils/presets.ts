/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ProjectPreset {
  id: string;
  name: string;
  width: number;
  height: number;
  unit: 'px' | 'mm' | 'cm' | 'inch';
  dpi: number;
  category: 'social' | 'print' | 'photo' | 'screen' | 'mobile' | 'ads' | '2n';
}

export const PROJECT_PRESETS: ProjectPreset[] = [
  // Social
  { id: 'fb-cover', name: 'FB Page Cover', width: 1640, height: 664, unit: 'px', dpi: 72, category: 'social' },
  { id: 'fb-event', name: 'FB Event Image', width: 1920, height: 1080, unit: 'px', dpi: 72, category: 'social' },
  { id: 'fb-group', name: 'FB Group Header', width: 1640, height: 856, unit: 'px', dpi: 72, category: 'social' },
  { id: 'insta-post', name: 'Instagram', width: 1080, height: 1080, unit: 'px', dpi: 72, category: 'social' },
  { id: 'insta-story', name: 'Insta Story', width: 1080, height: 1920, unit: 'px', dpi: 72, category: 'social' },
  { id: 'insta-portrait', name: 'Insta Portrait', width: 1080, height: 1350, unit: 'px', dpi: 72, category: 'social' },
  
  // Print
  { id: 'a4', name: 'A4', width: 210, height: 297, unit: 'mm', dpi: 300, category: 'print' },
  { id: 'a3', name: 'A3', width: 297, height: 420, unit: 'mm', dpi: 300, category: 'print' },
  { id: 'a5', name: 'A5', width: 148, height: 210, unit: 'mm', dpi: 300, category: 'print' },
  { id: 'letter', name: 'Letter', width: 8.5, height: 11, unit: 'inch', dpi: 300, category: 'print' },
  { id: 'business-card', name: 'Business Card', width: 3.5, height: 2, unit: 'inch', dpi: 300, category: 'print' },

  // Screen
  { id: 'hd', name: 'HD (720p)', width: 1280, height: 720, unit: 'px', dpi: 72, category: 'screen' },
  { id: 'fhd', name: 'Full HD (1080p)', width: 1920, height: 1080, unit: 'px', dpi: 72, category: 'screen' },
  { id: '4k', name: '4K Ultra HD', width: 3840, height: 2160, unit: 'px', dpi: 72, category: 'screen' },

  // Mobile
  { id: 'iphone-13', name: 'iPhone 13/14', width: 390, height: 844, unit: 'px', dpi: 460, category: 'mobile' },
  { id: 'iphone-pro-max', name: 'iPhone 14 Pro Max', width: 430, height: 932, unit: 'px', dpi: 460, category: 'mobile' },
  { id: 'pixel-7', name: 'Pixel 7', width: 1080, height: 2400, unit: 'px', dpi: 416, category: 'mobile' },

  // Ads
  { id: 'leaderboard', name: 'Leaderboard', width: 728, height: 90, unit: 'px', dpi: 72, category: 'ads' },
  { id: 'large-rectangle', name: 'Large Rectangle', width: 336, height: 280, unit: 'px', dpi: 72, category: 'ads' },
  { id: 'wide-skyscraper', name: 'Wide Skyscraper', width: 160, height: 600, unit: 'px', dpi: 72, category: 'ads' },

  // 2n
  { id: '512', name: '512 x 512', width: 512, height: 512, unit: 'px', dpi: 72, category: '2n' },
  { id: '1024', name: '1024 x 1024', width: 1024, height: 1024, unit: 'px', dpi: 72, category: '2n' },
  { id: '2048', name: '2048 x 2048', width: 2048, height: 2048, unit: 'px', dpi: 72, category: '2n' },
];
