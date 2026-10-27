/**
 * NDAWG PRO — Google Workspace & Firebase Firestore Integration Test Suite
 * Validates:
 * 1. Firebase configuration and Firestore database initialization
 * 2. Scope compliance for Tasks, Drive, and Chat
 * 3. In-memory token isolation (security constraint: zero storage persistence)
 * 4. Google Tasks, Drive, and Chat API contract verification
 * 5. Firebase Blueprint schema and error handling contracts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { WORKSPACE_SCOPES } from '../services/googleWorkspaceService.ts';
import { OperationType, FirestoreErrorInfo, handleFirestoreError } from '../services/firebaseConfig.ts';

describe('NDAWG PRO — Google Workspace & Firebase Integration Suite', () => {
  it('1. Verifies firebase-applet-config.json exists with valid parameters', () => {
    const configPath = resolve(process.cwd(), 'firebase-applet-config.json');
    assert.ok(existsSync(configPath), 'firebase-applet-config.json must exist');

    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    assert.strictEqual(config.projectId, 'gen-lang-client-0286279859');
    assert.strictEqual(config.firestoreDatabaseId, 'ai-studio-ndawgproapexgove-c6711b60-456c-4524-8c44-e72ab78bf350');
    assert.ok(config.apiKey, 'API key must be present');
    assert.ok(config.oAuthClientId, 'OAuth Client ID must be present');
  });

  it('2. Verifies firebase-blueprint.json adheres strictly to Blueprint Schema', () => {
    const blueprintPath = resolve(process.cwd(), 'firebase-blueprint.json');
    assert.ok(existsSync(blueprintPath), 'firebase-blueprint.json must exist');

    const bp = JSON.parse(readFileSync(blueprintPath, 'utf8'));
    assert.ok(bp.entities, 'Entities section must be defined');
    assert.ok(bp.entities.UserProfile, 'UserProfile entity must be defined');
    assert.ok(bp.entities.WorkspaceSyncItem, 'WorkspaceSyncItem entity must be defined');
    assert.ok(bp.entities.AuditLogEntry, 'AuditLogEntry entity must be defined');

    assert.ok(bp.firestore, 'Firestore path configurations must exist');
    assert.ok(bp.firestore['/users/{userId}'], '/users/{userId} path must exist');
    assert.ok(bp.firestore['/users/{userId}/workspaceSync/{itemId}'], 'workspaceSync path must exist');
    assert.ok(bp.firestore['/users/{userId}/audits/{auditId}'], 'audits path must exist');
  });

  it('3. Verifies firestore.rules exists and contains 8 Pillars security protections', () => {
    const rulesPath = resolve(process.cwd(), 'firestore.rules');
    assert.ok(existsSync(rulesPath), 'firestore.rules must exist');

    const rules = readFileSync(rulesPath, 'utf8');
    assert.ok(rules.includes("rules_version = '2';"), 'Rules version 2 required');
    assert.ok(rules.includes('match /{document=**} {'), 'Catch-all rule required');
    assert.ok(rules.includes('allow read, write: if false;'), 'Default-deny required');
    assert.ok(rules.includes('isValidId(userId)'), 'Path variable hardening required');
    assert.ok(rules.includes('isOwner(userId)'), 'Owner identity validation required');
    assert.ok(rules.includes('workspaceSync'), 'Workspace synchronization collection secured');
    assert.ok(rules.includes('audits'), 'Audits collection secured');
  });

  it('4. Verifies WORKSPACE_SCOPES includes required Google Tasks, Drive, and Chat scopes', () => {
    assert.ok(Array.isArray(WORKSPACE_SCOPES), 'WORKSPACE_SCOPES must be an array');
    
    // Tasks scopes
    assert.ok(WORKSPACE_SCOPES.includes('https://www.googleapis.com/auth/tasks'), 'Must include tasks scope');
    assert.ok(WORKSPACE_SCOPES.includes('https://www.googleapis.com/auth/tasks.readonly'), 'Must include tasks.readonly scope');
    
    // Drive scopes
    assert.ok(WORKSPACE_SCOPES.includes('https://www.googleapis.com/auth/drive'), 'Must include drive scope');
    assert.ok(WORKSPACE_SCOPES.includes('https://www.googleapis.com/auth/drive.file'), 'Must include drive.file scope');
    assert.ok(WORKSPACE_SCOPES.includes('https://www.googleapis.com/auth/drive.readonly'), 'Must include drive.readonly scope');
    
    // Chat user scopes
    assert.ok(WORKSPACE_SCOPES.includes('https://www.googleapis.com/auth/chat.spaces'), 'Must include chat.spaces scope');
    assert.ok(WORKSPACE_SCOPES.includes('https://www.googleapis.com/auth/chat.messages'), 'Must include chat.messages scope');
    assert.ok(WORKSPACE_SCOPES.includes('https://www.googleapis.com/auth/chat.memberships.readonly'), 'Must include chat.memberships.readonly scope');
  });

  it('5. Verifies Firestore standard error format and OperationType', () => {
    assert.strictEqual(OperationType.CREATE, 'create');
    assert.strictEqual(OperationType.UPDATE, 'update');
    assert.strictEqual(OperationType.DELETE, 'delete');
    assert.strictEqual(OperationType.LIST, 'list');
    assert.strictEqual(OperationType.GET, 'get');
    assert.strictEqual(OperationType.WRITE, 'write');

    try {
      handleFirestoreError(new Error('Permission denied on /users/test/audits'), OperationType.WRITE, 'users/test/audits');
      assert.fail('handleFirestoreError must throw');
    } catch (e: any) {
      const parsed: FirestoreErrorInfo = JSON.parse(e.message);
      assert.strictEqual(parsed.operationType, OperationType.WRITE);
      assert.strictEqual(parsed.path, 'users/test/audits');
      assert.ok(parsed.error.includes('Permission denied'));
    }
  });

  it('6. Enforces that access tokens are never saved to localStorage or sessionStorage', () => {
    // In node test environment, we assert that the service module exports only in-memory getter
    // and does not use window.localStorage or sessionStorage for the bearer token
    const serviceSource = readFileSync(resolve(process.cwd(), 'src/services/googleWorkspaceService.ts'), 'utf8');
    assert.ok(!serviceSource.includes('localStorage.setItem("accessToken"'), 'Must never persist accessToken in localStorage');
    assert.ok(!serviceSource.includes('sessionStorage.setItem("accessToken"'), 'Must never persist accessToken in sessionStorage');
    assert.ok(serviceSource.includes('cachedAccessToken'), 'Must use in-memory cachedAccessToken');
  });
});
