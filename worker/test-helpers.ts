import type { KVNamespace } from '@cloudflare/workers-types';

export interface MockKV extends KVNamespace {
  _store: Map<string, string>;
  _shouldThrowOnRead: boolean;
  _shouldThrowOnWrite: boolean;
}

export function createMockKV(): MockKV {
  const store = new Map<string, string>();
  const kv = {
    _store: store,
    _shouldThrowOnRead: false,
    _shouldThrowOnWrite: false,
    async get(key: string): Promise<string | null> {
      if (kv._shouldThrowOnRead) throw new Error('KV read failed');
      return store.get(key) ?? null;
    },
    async put(key: string, value: string, _opts?: unknown): Promise<void> {
      if (kv._shouldThrowOnWrite) throw new Error('KV write failed');
      store.set(key, value);
    },
    async delete(key: string): Promise<void> {
      store.delete(key);
    },
    async list(): Promise<{ keys: { name: string }[] }> {
      return { keys: Array.from(store.keys()).map(name => ({ name })) };
    },
    getWithMetadata: async () => ({ value: null, metadata: null }) as never,
  } as unknown as MockKV;
  return kv;
}
