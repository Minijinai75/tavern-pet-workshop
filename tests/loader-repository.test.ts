import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { openResidentRepository } from '../src/loader/repository';
import type { ImportedResidentPack } from '../src/loader/pack-importer';

const databases: string[] = [];

function databaseName(): string {
  const name = `resident-loader-test-${crypto.randomUUID()}`;
  databases.push(name);
  return name;
}

const pack: ImportedResidentPack = {
  manifest: {
    schemaVersion: 1,
    id: 'jinghe',
    identity: {
      displayName: '景和',
      creator: 'Mini',
      description: '桌邊的小居民。',
    },
    assets: { spritesheet: 'assets/spritesheet.png' },
    animation: {
      kind: 'grid',
      columns: 8,
      rows: 12,
      frameWidth: 128,
      frameHeight: 128,
      frameCount: 96,
    },
    theme: { accentColor: '#8ca8c7' },
    prompts: { idle: '待機', letters: '書信', stories: '番外' },
    capabilities: ['idle', 'letters', 'stories'],
  },
  spritesheet: new Uint8Array([137, 80, 78, 71]),
  importedAt: 100,
};

afterEach(async () => {
  await Promise.all(
    databases.splice(0).map(
      (name) =>
        new Promise<void>((resolve, reject) => {
          const request = indexedDB.deleteDatabase(name);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        }),
    ),
  );
});

describe('ResidentRepository', () => {
  it('persists imported packs and character bindings across repository instances', async () => {
    const name = databaseName();
    const first = await openResidentRepository({ databaseName: name });
    await first.putPack(pack);
    await first.bindCharacter({ characterKey: 'avatar:jinghe.png', displayName: '景和' }, 'jinghe');
    first.close();

    const second = await openResidentRepository({ databaseName: name });
    expect(await second.getPack('jinghe')).toEqual(pack);
    expect(await second.getBinding('avatar:jinghe.png')).toMatchObject({
      characterKey: 'avatar:jinghe.png',
      displayName: '景和',
      packId: 'jinghe',
    });
    second.close();
  });

  it('keeps generated records in time order and isolates character/chat/feature scopes', async () => {
    const repository = await openResidentRepository({ databaseName: databaseName() });
    await repository.addHistory({
      characterKey: 'char:a',
      chatKey: 'chat:1',
      feature: 'stories',
      content: '較新的番外',
      prompt: 'prompt 2',
      apiSource: 'current',
      createdAt: 200,
    });
    await repository.addHistory({
      characterKey: 'char:a',
      chatKey: 'chat:1',
      feature: 'stories',
      content: '較舊的番外',
      prompt: 'prompt 1',
      apiSource: 'profile:writer',
      createdAt: 100,
    });
    await repository.addHistory({
      characterKey: 'char:b',
      chatKey: 'chat:1',
      feature: 'stories',
      content: '別人的番外',
      prompt: 'other',
      apiSource: 'current',
      createdAt: 300,
    });

    const history = await repository.listHistory({
      characterKey: 'char:a',
      chatKey: 'chat:1',
      feature: 'stories',
    });
    expect(history.map((record) => record.content)).toEqual(['較新的番外', '較舊的番外']);
    repository.close();
  });

  it('deletes only the explicitly selected history record', async () => {
    const repository = await openResidentRepository({ databaseName: databaseName() });
    const firstId = await repository.addHistory({
      characterKey: 'char:a',
      chatKey: 'chat:1',
      feature: 'letters',
      content: '第一封',
      prompt: 'p1',
      apiSource: 'current',
      createdAt: 100,
    });
    await repository.addHistory({
      characterKey: 'char:a',
      chatKey: 'chat:1',
      feature: 'letters',
      content: '第二封',
      prompt: 'p2',
      apiSource: 'current',
      createdAt: 200,
    });

    await repository.deleteHistory(firstId);
    const history = await repository.listHistory({
      characterKey: 'char:a',
      chatKey: 'chat:1',
      feature: 'letters',
    });
    expect(history.map((record) => record.content)).toEqual(['第二封']);
    repository.close();
  });

  it('persists normalized USER settings per character without mixing roles', async () => {
    const name = databaseName();
    const first = await openResidentRepository({ databaseName: name });
    await first.putSettings('char:a', {
      motion: { frameIntervalMs: 200, walkSpeedPxPerSec: 88 },
      features: { stories: { promptOverride: '我的番外 Prompt', recentMessages: 12 } },
    });
    first.close();

    const second = await openResidentRepository({ databaseName: name });
    expect(await second.getSettings('char:a')).toMatchObject({
      motion: { frameIntervalMs: 200, walkSpeedPxPerSec: 88 },
      features: { stories: { promptOverride: '我的番外 Prompt', recentMessages: 12 } },
    });
    expect(await second.getSettings('char:b')).toBeUndefined();
    second.close();
  });
});
