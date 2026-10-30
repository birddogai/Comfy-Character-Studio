import test from 'node:test';
import assert from 'node:assert/strict';
import { messages, translate } from '../lib/messages.ts';
test('all extracted messages have Spanish and Simplified Chinese translations', () => {
  for (const [key, value] of Object.entries(messages)) {
    assert.ok(value.es.trim(), key);
    assert.ok(value['zh-CN'].trim(), key);
    assert.equal(translate('en', key), key);
  }
});
test('unknown messages fall back to English and known labels switch language', () => {
  assert.equal(translate('es', 'Characters'), 'Personajes');
  assert.equal(translate('zh-CN', 'Characters'), '角色');
  assert.equal(translate('es', 'Unmigrated label'), 'Unmigrated label');
});
