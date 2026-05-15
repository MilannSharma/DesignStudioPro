/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Canvas, FabricImage, filters } from 'fabric';

export interface AdjustmentSettings {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  hue: number;
  grayscale: boolean;
  invert: boolean;
}

export const applyAdjustments = (image: FabricImage, settings: Partial<AdjustmentSettings>) => {
  const activeFilters: any[] = [];

  if (settings.brightness !== undefined && settings.brightness !== 0) {
    activeFilters.push(new filters.Brightness({ brightness: settings.brightness }));
  }

  if (settings.contrast !== undefined && settings.contrast !== 0) {
    activeFilters.push(new filters.Contrast({ contrast: settings.contrast }));
  }

  if (settings.saturation !== undefined && settings.saturation !== 0) {
    activeFilters.push(new filters.Saturation({ saturation: settings.saturation }));
  }

  if (settings.hue !== undefined && settings.hue !== 0) {
    activeFilters.push(new filters.HueRotation({ rotation: settings.hue }));
  }

  if (settings.blur !== undefined && settings.blur !== 0) {
    activeFilters.push(new filters.Blur({ blur: settings.blur }));
  }

  if (settings.grayscale) {
    activeFilters.push(new filters.Grayscale());
  }

  if (settings.invert) {
    activeFilters.push(new filters.Invert());
  }

  image.filters = activeFilters;
  image.applyFilters();
};

export const resetAdjustments = (image: FabricImage) => {
  image.filters = [];
  image.applyFilters();
};
