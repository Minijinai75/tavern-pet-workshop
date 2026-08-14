import './styles.css';
import { buildPackArchive, type PackDraft } from './pack-builder';
import { releaseDownloadUrlLater } from './download';
import { createGptImagePrompt } from './image-prompt';
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
const residentWidget = document.querySelector<HTMLElement>('#resident-widget')!;
const status = document.querySelector<HTMLParagraphElement>('#form-status')!;
const downloadButton = document.querySelector<HTMLButtonElement>('#download-button')!;

let activePreviewUrl: string | undefined;

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

  if (!file) {
    fileName.textContent = '還沒選擇圖片';
    previewImage.hidden = true;
    previewImage.style.removeProperty('background-image');
    previewPlaceholder.toggleAttribute('hidden', false);
    return;
  }

  const errors = validateWorkshopInput(readDraft(), file).filter((message) => message.includes('圖集'));
  if (errors.length > 0) {
    avatarFile.value = '';
    fileName.textContent = errors[0];
    setStatus(errors[0], 'error');
    previewImage.hidden = true;
    previewImage.style.removeProperty('background-image');
    previewPlaceholder.toggleAttribute('hidden', false);
    return;
  }

  activePreviewUrl = URL.createObjectURL(file);
  const source = new Image();
  const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
    source.onload = () => resolve({ width: source.naturalWidth, height: source.naturalHeight });
    source.onerror = () => reject(new Error('無法讀取這張 PNG，請重新匯出後再試。'));
    source.src = activePreviewUrl!;
  }).catch((error: Error) => {
    setStatus(error.message, 'error');
    return undefined;
  });

  if (!dimensions) {
    avatarFile.value = '';
    previewImage.hidden = true;
    previewPlaceholder.toggleAttribute('hidden', false);
    return;
  }

  const dimensionErrors = validateSpriteDimensions(dimensions.width, dimensions.height);
  if (dimensionErrors.length > 0) {
    avatarFile.value = '';
    fileName.textContent = `${file.name} · ${dimensions.width}×${dimensions.height}`;
    setStatus(dimensionErrors[0], 'error');
    URL.revokeObjectURL(activePreviewUrl);
    activePreviewUrl = undefined;
    previewImage.hidden = true;
    previewImage.style.removeProperty('background-image');
    previewPlaceholder.toggleAttribute('hidden', false);
    return;
  }

  previewImage.style.backgroundImage = `url("${activePreviewUrl}")`;
  previewImage.hidden = false;
  previewPlaceholder.toggleAttribute('hidden', true);
  fileName.textContent = `${file.name} · 1024×1536 · ${(file.size / 1024 / 1024).toFixed(2)} MB`;
  setStatus('圖集尺寸正確，第一格已在本機預覽。', 'success');
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const draft = readDraft();
  const file = avatarFile.files?.[0];
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
