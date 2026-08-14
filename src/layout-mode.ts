export type LayoutMode = 'mobile' | 'desktop';

type LayoutRoot = {
  dataset: { layout?: string };
};

export function applyLayoutMode(root: LayoutRoot, isNarrowViewport: boolean): LayoutMode {
  const mode: LayoutMode = isNarrowViewport ? 'mobile' : 'desktop';
  root.dataset.layout = mode;
  return mode;
}

export function getLayoutLabel(mode: LayoutMode): string {
  return mode === 'mobile' ? '手機版' : '桌面版';
}
