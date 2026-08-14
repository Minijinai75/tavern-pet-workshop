import './styles.css';
import { buildPackArchive, type PackDraft } from './pack-builder';
import { releaseDownloadUrlLater } from './download';
import { createGptImagePrompt } from './image-prompt';
import { applyLayoutMode, getLayoutLabel } from './layout-mode';
import {
  analyzeSpriteFrames,
  canvasToPngFile,
  copyRowAlignment,
  composeAdjustedSpriteSheet,
  composeAutomaticallyAlignedSpriteSheet,
  detectAutomaticSpriteAlignment,
  fitBoundsIntoSafeArea,
  inspectFramePixels,
  sourceRectForFrame,
  rowFrameIndexes,
  unsafeFrameEdges,
  type FrameAdjustment,
  type FrameInspection,
  type PixelBuffer,
} from './sprite-calibrator';
import {
  copyResidentLoaderRepositoryUrl,
  RESIDENT_LOADER_REPOSITORY_URL,
} from './loader-install';
import {
  createDownloadName,
  validateSpriteDimensions,
  validateWorkshopInput,
} from './workshop';

const form = document.querySelector<HTMLFormElement>('#pet-form')!;
const displayName = document.querySelector<HTMLInputElement>('#display-name')!;
const creator = document.querySelector<HTMLInputElement>('#creator')!;
const description = document.querySelector<HTMLInputElement>('#description')!;
const accentColor = document.querySelector<HTMLInputElement>('#accent-color')!;
const colorValue = document.querySelector<HTMLOutputElement>('#color-value')!;
const idlePrompt = document.querySelector<HTMLTextAreaElement>('#idle-prompt')!;
const letterPrompt = document.querySelector<HTMLTextAreaElement>('#letter-prompt')!;
const storyPrompt = document.querySelector<HTMLTextAreaElement>('#story-prompt')!;
const avatarFile = document.querySelector<HTMLInputElement>('#avatar-file')!;
const referenceNotes = document.querySelector<HTMLTextAreaElement>('#reference-notes')!;
const imagePromptOutput = document.querySelector<HTMLTextAreaElement>('#image-prompt-output')!;
const copyImagePrompt = document.querySelector<HTMLButtonElement>('#copy-image-prompt')!;
const copyStatus = document.querySelector<HTMLParagraphElement>('#copy-status')!;
const fileName = document.querySelector<HTMLParagraphElement>('#file-name')!;
const previewName = document.querySelector<HTMLElement>('#preview-name')!;
const previewDescription = document.querySelector<HTMLParagraphElement>('#preview-description')!;
const previewImage = document.querySelector<HTMLDivElement>('#preview-image')!;
const previewPlaceholder = document.querySelector<SVGElement>('#preview-placeholder')!;
const previewEmptyMessage = document.querySelector<HTMLParagraphElement>('#preview-empty-message')!;
const residentWidget = document.querySelector<HTMLElement>('#resident-widget')!;
const status = document.querySelector<HTMLParagraphElement>('#form-status')!;
const downloadButton = document.querySelector<HTMLButtonElement>('#download-button')!;
const previewModeLabel = document.querySelector<HTMLElement>('#preview-mode-label')!;
const loaderRepositoryUrl = document.querySelector<HTMLElement>('#loader-repository-url')!;
const copyLoaderUrl = document.querySelector<HTMLButtonElement>('#copy-loader-url')!;
const loaderCopyStatus = document.querySelector<HTMLParagraphElement>('#loader-copy-status')!;
const spriteCalibrator = document.querySelector<HTMLElement>('#sprite-calibrator')!;
const calibratorSummary = document.querySelector<HTMLParagraphElement>('#calibrator-summary')!;
const frameGrid = document.querySelector<HTMLDivElement>('#frame-grid')!;
const selectedFrameLabel = document.querySelector<HTMLElement>('#selected-frame-label')!;
const frameEditorCanvas = document.querySelector<HTMLCanvasElement>('#frame-editor-canvas')!;
const frameLiveStatus = document.querySelector<HTMLParagraphElement>('#frame-live-status')!;
const frameScale = document.querySelector<HTMLInputElement>('#frame-scale')!;
const frameOffsetX = document.querySelector<HTMLInputElement>('#frame-offset-x')!;
const frameOffsetY = document.querySelector<HTMLInputElement>('#frame-offset-y')!;
const frameCropSize = document.querySelector<HTMLInputElement>('#frame-crop-size')!;
const frameSourceOffsetX = document.querySelector<HTMLInputElement>('#frame-source-offset-x')!;
const frameSourceOffsetY = document.querySelector<HTMLInputElement>('#frame-source-offset-y')!;
const expandCurrentFrame = document.querySelector<HTMLButtonElement>('#expand-current-frame')!;
const fitCurrentFrame = document.querySelector<HTMLButtonElement>('#fit-current-frame')!;
const applyCurrentFrame = document.querySelector<HTMLButtonElement>('#apply-current-frame')!;
const applyCurrentRow = document.querySelector<HTMLButtonElement>('#apply-current-row')!;
const fitAllFrames = document.querySelector<HTMLButtonElement>('#fit-all-frames')!;
const autoAlignRows = document.querySelector<HTMLButtonElement>('#auto-align-rows')!;
const autoAlignmentReport = document.querySelector<HTMLElement>('#auto-alignment-report')!;

let activePreviewUrl: string | undefined;
let activeSpriteFile: File | undefined;
let sourceImage: CanvasImageSource | undefined;
let sourcePixels: PixelBuffer | undefined;
let sourceInspections: FrameInspection[] = [];
let currentInspections: FrameInspection[] = [];
let selectedFrame = 0;
const frameAdjustments = new Map<number, FrameAdjustment>();
const framePreviewCanvas = document.createElement('canvas');
framePreviewCanvas.width = 128;
framePreviewCanvas.height = 128;

const mobileLayoutQuery = window.matchMedia('(max-width: 720px)');

function syncLayoutMode(): void {
  const mode = applyLayoutMode(document.documentElement, mobileLayoutQuery.matches);
  previewModeLabel.textContent = getLayoutLabel(mode);
}

syncLayoutMode();
mobileLayoutQuery.addEventListener('change', syncLayoutMode);

loaderRepositoryUrl.textContent = RESIDENT_LOADER_REPOSITORY_URL;
copyLoaderUrl.addEventListener('click', async () => {
  try {
    await copyResidentLoaderRepositoryUrl();
    loaderCopyStatus.textContent = '安裝網址已複製，貼進酒館的「安裝擴充」就可以。';
    loaderCopyStatus.dataset.kind = 'success';
  } catch {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(loaderRepositoryUrl);
    selection?.removeAllRanges();
    selection?.addRange(range);
    loaderCopyStatus.textContent = '瀏覽器沒有開放剪貼簿，已替你選取網址，請按 Ctrl+C。';
    loaderCopyStatus.dataset.kind = 'error';
  }
});

function readDraft(): PackDraft {
  return {
    displayName: displayName.value,
    creator: creator.value,
    description: description.value,
    accentColor: accentColor.value,
    idlePrompt: idlePrompt.value,
    letterPrompt: letterPrompt.value,
    storyPrompt: storyPrompt.value,
  };
}

function updatePreview(): void {
  previewName.textContent = displayName.value.trim() || '未命名桌寵';
  previewDescription.textContent = description.value.trim() || '你的桌寵會在這裡陪著你。';
  colorValue.value = accentColor.value.toUpperCase();
  residentWidget.style.setProperty('--pet-accent', accentColor.value);
  imagePromptOutput.value = createGptImagePrompt({
    displayName: displayName.value,
    referenceNotes: referenceNotes.value,
  });
}

function setStatus(message: string, kind: 'neutral' | 'error' | 'success' = 'neutral'): void {
  status.textContent = message;
  status.dataset.kind = kind;
}

function showNeutralPreview(message: string): void {
  previewPlaceholder.toggleAttribute('hidden', true);
  previewImage.hidden = true;
  previewImage.style.removeProperty('background-image');
  previewEmptyMessage.textContent = message;
  previewEmptyMessage.hidden = false;
}

function showSpritePreview(url: string): void {
  previewPlaceholder.toggleAttribute('hidden', true);
  previewEmptyMessage.hidden = true;
  previewImage.style.backgroundImage = `url("${url}")`;
  previewImage.hidden = false;
}

function updatePreviewUrl(file: Blob): void {
  if (activePreviewUrl) URL.revokeObjectURL(activePreviewUrl);
  activePreviewUrl = URL.createObjectURL(file);
  showSpritePreview(activePreviewUrl);
}

function controlsAdjustment(): FrameAdjustment {
  return {
    scale: Number(frameScale.value) / 100,
    offsetX: Number(frameOffsetX.value),
    offsetY: Number(frameOffsetY.value),
    cropSize: Number(frameCropSize.value),
    sourceOffsetX: Number(frameSourceOffsetX.value),
    sourceOffsetY: Number(frameSourceOffsetY.value),
  };
}

function setAdjustmentControls(adjustment: FrameAdjustment): void {
  frameScale.value = String(Math.round(adjustment.scale * 100));
  frameOffsetX.value = String(Math.round(adjustment.offsetX));
  frameOffsetY.value = String(Math.round(adjustment.offsetY));
  frameCropSize.value = String(Math.round(adjustment.cropSize ?? 128));
  frameSourceOffsetX.value = String(Math.round(adjustment.sourceOffsetX ?? 0));
  frameSourceOffsetY.value = String(Math.round(adjustment.sourceOffsetY ?? 0));
}

function drawFrameEditor(): void {
  if (!sourceImage) return;
  const context = frameEditorCanvas.getContext('2d');
  const previewContext = framePreviewCanvas.getContext('2d');
  if (!context || !previewContext) return;
  const adjustment = controlsAdjustment();
  const sourceRect = sourceRectForFrame(selectedFrame, adjustment);
  previewContext.setTransform(1, 0, 0, 1, 0, 0);
  previewContext.clearRect(0, 0, 128, 128);
  previewContext.save();
  previewContext.beginPath();
  previewContext.rect(0, 0, 128, 128);
  previewContext.clip();
  previewContext.translate(64 + adjustment.offsetX, 64 + adjustment.offsetY);
  previewContext.scale(adjustment.scale, adjustment.scale);
  previewContext.drawImage(
    sourceImage,
    sourceRect.x,
    sourceRect.y,
    sourceRect.width,
    sourceRect.height,
    -64,
    -64,
    128,
    128,
  );
  previewContext.restore();

  const pixels = previewContext.getImageData(0, 0, 128, 128);
  const liveInspection = inspectFramePixels({ data: pixels.data, width: 128, height: 128 });
  if (liveInspection.empty) {
    frameLiveStatus.dataset.kind = 'empty';
    frameLiveStatus.textContent = '目前取景沒有偵測到角色；請移回角色位置或放大取景範圍。';
  } else if (liveInspection.unsafe) {
    const labels = { top: '上方', right: '右側', bottom: '下方', left: '左側' } as const;
    const edges = unsafeFrameEdges(liveInspection.bounds).map((edge) => labels[edge]);
    frameLiveStatus.dataset.kind = 'unsafe';
    frameLiveStatus.textContent = `仍超出 8px 安全區：${edges.join('、')}。請繼續移動或縮小角色。`;
  } else {
    frameLiveStatus.dataset.kind = 'safe';
    frameLiveStatus.textContent = '已進入 8px 安全區。按「套用本格校正」保存這次調整。';
  }

  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, 256, 256);
  context.drawImage(framePreviewCanvas, 0, 0, 256, 256);
  context.save();
  context.scale(2, 2);
  context.strokeStyle = liveInspection.unsafe ? '#dc2626' : '#16a34a';
  context.lineWidth = 1.5;
  context.strokeRect(8, 8, 112, 112);
  context.restore();
}

function selectFrame(frame: number): void {
  selectedFrame = frame;
  selectedFrameLabel.textContent = `第 ${frame + 1} 格 · 第 ${Math.floor(frame / 8) + 1} 排第 ${(frame % 8) + 1} 格`;
  applyCurrentRow.textContent = `套用目前大小與上下到第 ${Math.floor(frame / 8) + 1} 排`;
  setAdjustmentControls(frameAdjustments.get(frame) ?? { scale: 1, offsetX: 0, offsetY: 0 });
  for (const button of frameGrid.querySelectorAll<HTMLButtonElement>('[data-frame]')) {
    button.toggleAttribute('aria-current', Number(button.dataset.frame) === frame);
  }
  drawFrameEditor();
}

function renderFrameGrid(): void {
  frameGrid.replaceChildren();
  const unsafeCount = currentInspections.filter((item) => item.unsafe).length;
  const emptyCount = currentInspections.filter((item) => item.empty).length;
  calibratorSummary.textContent = unsafeCount === 0
    ? '96 格都在 8px 安全範圍內，可以直接下載角色包。'
    : `有 ${unsafeCount} 格需要確認${emptyCount ? `，其中 ${emptyCount} 格沒有偵測到角色` : ''}。紅色格子可逐格調整。`;
  currentInspections.forEach((inspection) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `frame-cell${inspection.unsafe ? ' is-unsafe' : ' is-safe'}`;
    button.dataset.frame = String(inspection.frame);
    button.title = inspection.empty
      ? `第 ${inspection.frame + 1} 格：沒有偵測到角色`
      : inspection.unsafe
        ? `第 ${inspection.frame + 1} 格：內容碰到安全邊界`
        : `第 ${inspection.frame + 1} 格：安全`;
    if (activePreviewUrl) button.style.backgroundImage = `url("${activePreviewUrl}")`;
    button.style.backgroundPosition = `${((inspection.frame % 8) / 7) * 100}% ${((Math.floor(inspection.frame / 8)) / 11) * 100}%`;
    const badge = document.createElement('span');
    badge.textContent = String(inspection.frame + 1);
    button.append(badge);
    button.addEventListener('click', () => selectFrame(inspection.frame));
    frameGrid.append(button);
  });
  selectFrame(selectedFrame);
}

async function rebuildCorrectedSprite(): Promise<void> {
  if (!sourceImage || !activeSpriteFile) return;
  applyCurrentFrame.disabled = true;
  fitAllFrames.disabled = true;
  try {
    const canvas = composeAdjustedSpriteSheet(sourceImage, frameAdjustments);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('瀏覽器無法檢查校正後圖片。');
    currentInspections = analyzeSpriteFrames(context.getImageData(0, 0, canvas.width, canvas.height));
    activeSpriteFile = await canvasToPngFile(canvas, activeSpriteFile.name);
    updatePreviewUrl(activeSpriteFile);
    renderFrameGrid();
    setStatus('已在瀏覽器本機重新組成 1024×1536 PNG，下載時會使用校正後版本。', 'success');
  } finally {
    applyCurrentFrame.disabled = false;
    fitAllFrames.disabled = false;
  }
}

form.addEventListener('input', updatePreview);

copyImagePrompt.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(imagePromptOutput.value);
    copyStatus.textContent = '圖片指令已複製，可以貼到 GPT 了。';
    copyStatus.dataset.kind = 'success';
  } catch {
    imagePromptOutput.focus();
    imagePromptOutput.select();
    copyStatus.textContent = '瀏覽器沒有開放剪貼簿，已替你選取全文，請按 Ctrl+C。';
    copyStatus.dataset.kind = 'error';
  }
});

avatarFile.addEventListener('change', async () => {
  const file = avatarFile.files?.[0];
  if (activePreviewUrl) {
    URL.revokeObjectURL(activePreviewUrl);
    activePreviewUrl = undefined;
  }
  activeSpriteFile = undefined;
  sourceImage = undefined;
  sourcePixels = undefined;
  sourceInspections = [];
  currentInspections = [];
  frameAdjustments.clear();
  spriteCalibrator.hidden = true;

  if (!file) {
    fileName.textContent = '還沒選擇圖片';
    previewImage.hidden = true;
    previewImage.style.removeProperty('background-image');
    previewEmptyMessage.hidden = true;
    previewPlaceholder.toggleAttribute('hidden', false);
    return;
  }

  showNeutralPreview('正在讀取你選擇的 PNG…');

  const errors = validateWorkshopInput(readDraft(), file).filter((message) => message.includes('圖集'));
  if (errors.length > 0) {
    fileName.textContent = errors[0];
    setStatus(errors[0], 'error');
    showNeutralPreview('這張圖片無法使用，請依左側提示重新選擇。');
    return;
  }

  const sourceUrl = URL.createObjectURL(file);
  const source = new Image();
  const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
    source.onload = () => resolve({ width: source.naturalWidth, height: source.naturalHeight });
    source.onerror = () => reject(new Error('無法讀取這張 PNG，請重新匯出後再試。'));
    source.src = sourceUrl;
  }).catch((error: Error) => {
    setStatus(error.message, 'error');
    return undefined;
  });

  if (!dimensions) {
    URL.revokeObjectURL(sourceUrl);
    showNeutralPreview('無法讀取這張圖片，請重新選擇。');
    return;
  }

  const dimensionErrors = validateSpriteDimensions(dimensions.width, dimensions.height);
  if (dimensionErrors.length > 0) {
    fileName.textContent = `${file.name} · ${dimensions.width}×${dimensions.height}`;
    setStatus(dimensionErrors[0], 'error');
    URL.revokeObjectURL(sourceUrl);
    showNeutralPreview('尺寸不符合 8×12 圖集，請重新選擇。');
    return;
  }

  sourceImage = source;
  activeSpriteFile = file;
  const analysisCanvas = document.createElement('canvas');
  analysisCanvas.width = 1024;
  analysisCanvas.height = 1536;
  const analysisContext = analysisCanvas.getContext('2d');
  if (!analysisContext) {
    URL.revokeObjectURL(sourceUrl);
    showNeutralPreview('瀏覽器無法建立圖片檢查畫布。');
    return;
  }
  analysisContext.drawImage(source, 0, 0);
  const sourceImageData = analysisContext.getImageData(0, 0, 1024, 1536);
  sourcePixels = { data: sourceImageData.data, width: 1024, height: 1536 };
  sourceInspections = analyzeSpriteFrames(sourcePixels);
  currentInspections = sourceInspections;
  activePreviewUrl = sourceUrl;
  showSpritePreview(activePreviewUrl);
  spriteCalibrator.hidden = false;
  selectedFrame = sourceInspections.find((item) => item.unsafe)?.frame ?? 0;
  renderFrameGrid();
  fileName.textContent = `${file.name} · 1024×1536 · ${(file.size / 1024 / 1024).toFixed(2)} MB`;
  const unsafeCount = sourceInspections.filter((item) => item.unsafe).length;
  setStatus(
    unsafeCount
      ? `尺寸正確，但有 ${unsafeCount} 格碰到舊格線。請在下方回原圖逐格取景；也可先把問題格全部展開再檢查。`
      : '圖集尺寸與 96 格安全邊界都正確。',
    unsafeCount ? 'neutral' : 'success',
  );
});

autoAlignRows.addEventListener('click', async () => {
  if (!sourcePixels || !activeSpriteFile) return;
  autoAlignRows.disabled = true;
  autoAlignmentReport.dataset.kind = 'neutral';
  autoAlignmentReport.innerHTML = '<strong>正在辨識 12 排角色…</strong><span>這一步只在你的瀏覽器內處理圖片。</span>';
  try {
    const layout = detectAutomaticSpriteAlignment(sourcePixels);
    if (!layout.ok) {
      const failedRows = layout.rows.filter((row) => row.error).map((row) => row.row + 1);
      autoAlignmentReport.dataset.kind = 'error';
      autoAlignmentReport.innerHTML = `<strong>第 ${failedRows.join('、')} 排無法安全自動拆分</strong><span>${layout.errors.join(' ')} 相鄰角色可能已黏在一起；請重生整張 Sprite Sheet，或使用下方手動工具。</span>`;
      setStatus('自動辨識沒有修改圖片；辨識失敗的排已列出。', 'error');
      return;
    }

    const canvas = composeAutomaticallyAlignedSpriteSheet(sourcePixels, layout);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('瀏覽器無法檢查自動對齊後的圖片。');
    const corrected = context.getImageData(0, 0, canvas.width, canvas.height);
    const correctedPixels: PixelBuffer = {
      data: corrected.data,
      width: canvas.width,
      height: canvas.height,
    };
    const correctedInspections = analyzeSpriteFrames(correctedPixels);
    const unsafeCount = correctedInspections.filter((inspection) => inspection.unsafe).length;
    if (unsafeCount > 0) {
      throw new Error(`自動重組後仍有 ${unsafeCount} 格碰到安全線，已停止套用。`);
    }

    activeSpriteFile = await canvasToPngFile(canvas, activeSpriteFile.name);
    sourceImage = canvas;
    sourcePixels = correctedPixels;
    sourceInspections = correctedInspections;
    currentInspections = correctedInspections;
    frameAdjustments.clear();
    updatePreviewUrl(activeSpriteFile);
    renderFrameGrid();
    autoAlignmentReport.dataset.kind = 'success';
    autoAlignmentReport.innerHTML = '<strong>12 排、96 格已自動辨識並重新對齊</strong><span>每排共用同一縮放比例與腳底基準，全部角色都在 8px 安全框內。下方仍可逐格微調。</span>';
    setStatus('自動對齊完成；下載角色包時會使用這張重新組成的 PNG。', 'success');
  } catch (error) {
    const message = error instanceof Error ? error.message : '自動對齊失敗，圖片沒有被修改。';
    autoAlignmentReport.dataset.kind = 'error';
    autoAlignmentReport.innerHTML = `<strong>自動對齊沒有套用</strong><span>${message}</span>`;
    setStatus(message, 'error');
  } finally {
    autoAlignRows.disabled = false;
  }
});

for (const input of [frameScale, frameOffsetX, frameOffsetY, frameCropSize, frameSourceOffsetX, frameSourceOffsetY]) {
  input.addEventListener('input', drawFrameEditor);
}

expandCurrentFrame.addEventListener('click', () => {
  frameCropSize.value = String(Math.max(160, Number(frameCropSize.value)));
  drawFrameEditor();
  setStatus('已把本格取景範圍展開到舊格線之外；現在拖曳預覽，把完整角色對回綠色安全框。', 'neutral');
});

fitCurrentFrame.addEventListener('click', () => {
  const bounds = sourceInspections[selectedFrame]?.bounds;
  if (!bounds) return setStatus('這一格沒有偵測到角色，請回 GPT 補做後再換圖。', 'error');
  setAdjustmentControls(fitBoundsIntoSafeArea(bounds));
  drawFrameEditor();
});

applyCurrentFrame.addEventListener('click', () => {
  frameAdjustments.set(selectedFrame, controlsAdjustment());
  void rebuildCorrectedSprite();
});

applyCurrentRow.addEventListener('click', () => {
  const reference = controlsAdjustment();
  for (const frame of rowFrameIndexes(selectedFrame)) {
    if (frame === selectedFrame) {
      frameAdjustments.set(frame, reference);
      continue;
    }
    const previous = frameAdjustments.get(frame) ?? { scale: 1, offsetX: 0, offsetY: 0 };
    frameAdjustments.set(frame, copyRowAlignment(previous, reference));
  }
  const row = Math.floor(selectedFrame / 8) + 1;
  void rebuildCorrectedSprite().then(() => {
    setStatus(`第 ${row} 排 8 格已統一大小與上下基準；左右取景仍可逐格微調。`, 'success');
  });
});

fitAllFrames.addEventListener('click', () => {
  sourceInspections.forEach((inspection) => {
    if (inspection.unsafe) {
      const previous = frameAdjustments.get(inspection.frame) ?? { scale: 1, offsetX: 0, offsetY: 0 };
      frameAdjustments.set(inspection.frame, { ...previous, cropSize: Math.max(160, previous.cropSize ?? 128) });
    }
  });
  void rebuildCorrectedSprite();
});

let editorDrag: { x: number; y: number; sourceOffsetX: number; sourceOffsetY: number } | undefined;
frameEditorCanvas.addEventListener('pointerdown', (event) => {
  editorDrag = {
    x: event.clientX,
    y: event.clientY,
    sourceOffsetX: Number(frameSourceOffsetX.value),
    sourceOffsetY: Number(frameSourceOffsetY.value),
  };
  frameEditorCanvas.setPointerCapture?.(event.pointerId);
});
frameEditorCanvas.addEventListener('pointermove', (event) => {
  if (!editorDrag) return;
  frameSourceOffsetX.value = String(Math.max(-96, Math.min(96, Math.round(editorDrag.sourceOffsetX - (event.clientX - editorDrag.x) / 2))));
  frameSourceOffsetY.value = String(Math.max(-96, Math.min(96, Math.round(editorDrag.sourceOffsetY - (event.clientY - editorDrag.y) / 2))));
  drawFrameEditor();
});
const endEditorDrag = (event: PointerEvent): void => {
  if (!editorDrag) return;
  editorDrag = undefined;
  frameEditorCanvas.releasePointerCapture?.(event.pointerId);
};
frameEditorCanvas.addEventListener('pointerup', endEditorDrag);
frameEditorCanvas.addEventListener('pointercancel', endEditorDrag);

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const draft = readDraft();
  const file = activeSpriteFile;
  const errors = validateWorkshopInput(draft, file);

  if (errors.length > 0 || !file) {
    setStatus(errors.join(' '), 'error');
    return;
  }

  downloadButton.disabled = true;
  downloadButton.setAttribute('aria-busy', 'true');
  setStatus('正在把角色資料和圖片包起來…');

  try {
    const archive = await buildPackArchive(draft, {
      name: file.name,
      mimeType: file.type,
      bytes: new Uint8Array(await file.arrayBuffer()),
    });
    const downloadUrl = URL.createObjectURL(archive);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = createDownloadName(draft.displayName);
    document.body.append(link);
    link.click();
    link.remove();
    releaseDownloadUrlLater(downloadUrl);
    setStatus('角色包完成。它只包含你看得到的資料與圖片。', 'success');
  } catch (error) {
    const message = error instanceof Error ? error.message : '角色包製作失敗，請再試一次。';
    setStatus(message, 'error');
  } finally {
    downloadButton.disabled = false;
    downloadButton.removeAttribute('aria-busy');
  }
});

window.addEventListener('beforeunload', () => {
  if (activePreviewUrl) URL.revokeObjectURL(activePreviewUrl);
});

updatePreview();
