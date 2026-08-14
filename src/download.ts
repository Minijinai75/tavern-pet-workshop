type Scheduler = (callback: () => void, delay: number) => unknown;

export function releaseDownloadUrlLater(
  downloadUrl: string,
  revoke: (url: string) => void = URL.revokeObjectURL.bind(URL),
  schedule: Scheduler = (callback, delay) => window.setTimeout(callback, delay),
): void {
  schedule(() => revoke(downloadUrl), 60_000);
}
