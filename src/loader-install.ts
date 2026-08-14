export const RESIDENT_LOADER_REPOSITORY_URL =
  'https://github.com/Minijinai75/resident-loader';

export async function copyResidentLoaderRepositoryUrl(
  writeText: (value: string) => Promise<void> = (value) => navigator.clipboard.writeText(value),
): Promise<void> {
  await writeText(RESIDENT_LOADER_REPOSITORY_URL);
}
