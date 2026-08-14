import { describe, expect, it, vi } from 'vitest';

import {
  RESIDENT_LOADER_REPOSITORY_URL,
  copyResidentLoaderRepositoryUrl,
} from '../src/loader-install';

describe('Resident Loader repository installation', () => {
  it('copies the GitHub repository URL accepted by the SillyTavern installer', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);

    await copyResidentLoaderRepositoryUrl(writeText);

    expect(RESIDENT_LOADER_REPOSITORY_URL).toBe(
      'https://github.com/Minijinai75/resident-loader',
    );
    expect(writeText).toHaveBeenCalledWith(RESIDENT_LOADER_REPOSITORY_URL);
  });
});
