#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const pcRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sessionTokenModuleUrl = pathToFileURL(
  path.join(pcRoot, 'packages/sdkwork-documents-pc-commons/src/app-session-token.ts'),
).href;

const SESSION_KEY = 'sdkwork.documents.appSession.v1';
const LEGACY_HOST_KEY = 'sdkwork.cloudRouter.appSession.v1';

function createMemoryStorage() {
  const records = new Map();
  return {
    getItem(key) {
      return records.has(key) ? records.get(key) : null;
    },
    setItem(key, value) {
      records.set(key, String(value));
    },
    removeItem(key) {
      records.delete(key);
    },
    keys() {
      return Array.from(records.keys());
    },
  };
}

let caseSerial = 0;

/**
 * Fresh module instance per case: the token module caches the loaded token in
 * module scope, so the URL query keeps cases independent.
 */
async function loadSessionTokenModule() {
  caseSerial += 1;
  return import(`${sessionTokenModuleUrl}?case=${caseSerial}`);
}

function installStorages() {
  const sessionStorage = createMemoryStorage();
  const localStorage = createMemoryStorage();
  globalThis.sessionStorage = sessionStorage;
  globalThis.localStorage = localStorage;
  return { sessionStorage, localStorage };
}

function createStoredToken(accessToken = 'access-token') {
  return JSON.stringify({
    accessToken,
    authToken: `auth-${accessToken}`,
    storedAt: Math.floor(Date.now() / 1000),
  });
}

test.afterEach(() => {
  delete globalThis.sessionStorage;
  delete globalThis.localStorage;
});

test('storing an app session writes sessionStorage only (no persistent localStorage copy)', async () => {
  const { sessionStorage, localStorage } = installStorages();
  const module = await loadSessionTokenModule();

  module.storeAppSessionFromResult({
    code: 2000,
    data: {
      accessToken: 'access-token-new',
      authToken: 'auth-token-new',
    },
  });

  assert.equal(sessionStorage.getItem(SESSION_KEY) !== null, true);
  assert.deepEqual(localStorage.keys(), [], 'localStorage must stay free of session credentials');

  const parsed = JSON.parse(sessionStorage.getItem(SESSION_KEY));
  assert.equal(parsed.accessToken, 'access-token-new');
});

test('a legacy localStorage token is migrated into sessionStorage and deleted', async () => {
  const { sessionStorage, localStorage } = installStorages();
  localStorage.setItem(SESSION_KEY, createStoredToken('legacy-access'));
  const module = await loadSessionTokenModule();

  assert.equal(module.getStoredAppSessionAuthToken(), 'auth-legacy-access');
  assert.equal(localStorage.getItem(SESSION_KEY), null, 'legacy persistent copy must be deleted');
  assert.equal(sessionStorage.getItem(SESSION_KEY) !== null, true);
});

test('legacy host key is migrated forward as well', async () => {
  const { sessionStorage, localStorage } = installStorages();
  localStorage.setItem(LEGACY_HOST_KEY, createStoredToken('host-access'));
  const module = await loadSessionTokenModule();

  assert.equal(module.getStoredAppSessionAccessToken(), 'host-access');
  assert.equal(localStorage.getItem(LEGACY_HOST_KEY), null);
  assert.equal(sessionStorage.getItem(SESSION_KEY) !== null, true);
});

test('clearing the app session clears both stores', async () => {
  const { sessionStorage, localStorage } = installStorages();
  sessionStorage.setItem(SESSION_KEY, createStoredToken());
  localStorage.setItem(SESSION_KEY, createStoredToken());
  const module = await loadSessionTokenModule();

  module.clearStoredAppSessionToken();

  assert.deepEqual(sessionStorage.keys(), []);
  assert.deepEqual(localStorage.keys(), []);
  assert.equal(module.getStoredAppSessionToken(), undefined);
});

test('no reverse copy (sessionStorage -> localStorage) remains in the session bridge', async () => {
  const sessionTokenSource = await readFile(
    path.join(pcRoot, 'packages/sdkwork-documents-pc-commons/src/app-session-token.ts'),
    'utf8',
  );
  const iamRuntimeSource = await readFile(
    path.join(pcRoot, 'src/bootstrap/iamRuntime.ts'),
    'utf8',
  );

  assert.equal(
    /function writeBrowserStorage[\s\S]*?writeLocalStorage\(token\);/.test(sessionTokenSource),
    false,
    'writeBrowserStorage must not persist the token in localStorage',
  );
  assert.match(sessionTokenSource, /function writeBrowserStorage[\s\S]*?removeLocalStorage\(\);/);

  assert.match(iamRuntimeSource, /return window\.sessionStorage;/);
  assert.match(iamRuntimeSource, /window\.localStorage\.removeItem\(storageKey\);/);
  assert.equal(
    /window\.localStorage\.setItem\(storageKey/.test(iamRuntimeSource),
    false,
    'the IAM session bridge must not promote a browser session into localStorage',
  );
});
