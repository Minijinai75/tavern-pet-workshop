import './style.css';
import { ResidentLoaderApp } from '../../src/loader/app';

const app = new ResidentLoaderApp();

export async function residentLoaderEnable(): Promise<void> {
  try {
    await app.start();
  } catch (error) {
    console.error('[Resident Loader] 啟動失敗', error);
  }
}

export function residentLoaderDisable(): void {
  app.stop();
}

Object.assign(globalThis, {
  residentLoaderEnable,
  residentLoaderDisable,
});

void residentLoaderEnable();
