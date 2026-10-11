import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, createSession, getUserIdByToken } from '../server/db.js';

describe('Authentication & Security', () => {
  test('hashes password and verifies successfully', () => {
    const password = 'securePassword123!';
    const hashed = hashPassword(password);

    assert.notEqual(hashed, password);
    assert.ok(hashed.includes(':'));

    assert.equal(verifyPassword(password, hashed), true);
    assert.equal(verifyPassword('wrongPassword', hashed), false);
  });

  test('creates session and retrieves user id', () => {
    const userId = 'usr-12345';
    const token = createSession(userId);

    assert.ok(token);
    assert.equal(getUserIdByToken(token), userId);
    assert.equal(getUserIdByToken('invalid-token'), null);
  });
});
