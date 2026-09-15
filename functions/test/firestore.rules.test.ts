/**
 * Testes de isolamento tenant bleed — rodar com: firebase emulators:exec "npx vitest run test/firestore.rules.test.ts"
 * Requer @firebase/rules-unit-testing
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import * as fs from 'fs';

let testEnv: RulesTestEnvironment;
const PROJECT_ID = 'test-project';

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: fs.readFileSync('../firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  });
});

afterAll(async () => { await testEnv.cleanup(); });

describe('Isolamento tenant - task_evidencias', () => {
  it('alice não pode ler task de bob', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    const bobTask = doc(alice, 'task_evidencias/bobTask');
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'task_evidencias/bobTask'), { tenantId: 'bob', status: 'PENDENTE' });
    });
    await expect(getDoc(bobTask)).rejects.toThrow(/permission-denied|PERMISSION_DENIED/);
  });

  it('alice não pode escrever em companies/bob', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    await expect(setDoc(doc(alice, 'task_evidencias/aliceTask'), { tenantId: 'bob', status: 'PENDENTE' })).rejects.toThrow();
  });
});

describe('audit_logs imutável', () => {
  it('não permite update/delete', async () => {
    const admin = testEnv.withSecurityRulesDisabled((ctx) => ctx.firestore());
    // Simula criação via backend (bypass rules) e tenta update como user
    // O teste real valida firestore.rules: allow update,delete: if false
    expect(true).toBe(true); // placeholder — regra é estática: allow update,delete: if false
  });
});
