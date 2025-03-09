/* eslint-disable @typescript-eslint/naming-convention */
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { RiveCache } from './rive-cache';
import { RiveFile } from '@rive-app/canvas';

vi.mock('@rive-app/canvas', () => {
  return {
    RiveFile: vi.fn().mockImplementation(({ src, onLoad, onLoadError }) => {
      return {
        _onLoadCallback: onLoad,
        _onLoadErrorCallback: onLoadError,
        _src: src,
        init: vi.fn(),
      };
    }),
  };
});

describe('RiveCache', () => {
  let riveCache: RiveCache;

  beforeEach(() => {
    riveCache = new RiveCache();
  });

  it('should retrieve a Rive file from the cache', () => {
    const mockRiveFile = {} as unknown as RiveFile;
    riveCache.assets.set('path/to/file.riv', mockRiveFile);

    const retrievedFile = riveCache.get('path/to/file.riv');

    expect(retrievedFile).toBe(mockRiveFile);
  });

  it('should throw an error if the Rive file is not found in the cache', () => {
    expect(() => riveCache.get('path/to/nonexistent.riv')).toThrow(
      'Rive file with path "path/to/nonexistent.riv" not found in store.',
    );
  });

  it('should load and cache a Rive file', async () => {
    const loadPromise = riveCache.load('path/to/file.riv');

    const riveFileInstance = (RiveFile as unknown as Mock).mock.results[0]
      .value;
    riveFileInstance._onLoadCallback?.();

    await loadPromise;

    expect(riveFileInstance.init).toHaveBeenCalled();
    expect(riveCache.assets.get('path/to/file.riv')).toBe(riveFileInstance);
  });

  it('should retrieve a Rive file from the cache if it exists, otherwise load and cache it', async () => {
    const loadPromise = riveCache.getOrLoad('path/to/not-in-cache.riv');
    const riveFileInstance = (RiveFile as unknown as Mock).mock.results[0]
      .value;

    riveFileInstance._onLoadCallback?.();

    await loadPromise;

    expect(riveCache.get('path/to/not-in-cache.riv')).toBe(riveFileInstance);

    (RiveFile as unknown as Mock).mockClear();

    const cachedFile = await riveCache.getOrLoad('path/to/not-in-cache.riv');
    expect(cachedFile).toBe(riveFileInstance);
    expect(RiveFile).not.toHaveBeenCalled();
  });
});
