/**
 * Smoke unitário do parse + mapa assignee (sem rede Chatwoot).
 * Uso: node scripts/smoke-crm-assignee.mjs
 */
import assert from 'node:assert/strict';
import { extrairAssigneeDoPayload } from '../app/dist/crm-assignee-inbound.js';
import {
  foiAssigneeOutboundRecente,
  marcarAssigneeOutbound,
} from '../app/dist/crm-assignee-write.js';

const comMeta = extrairAssigneeDoPayload({
  event: 'conversation_updated',
  conversation: {
    meta: { assignee: { id: 44, name: 'Giulia', email: 'g@x.com' } },
  },
});
assert.equal(comMeta?.id, 44);

const changed = extrairAssigneeDoPayload({
  event: 'conversation_updated',
  changed_attributes: [{ assignee_id: { previous_value: null, current_value: 69 } }],
});
assert.equal(changed?.id, 69);

const limpo = extrairAssigneeDoPayload({
  event: 'assignee_changed',
  changed_attributes: [{ assignee_id: { previous_value: 69, current_value: null } }],
});
assert.equal(limpo, null);

const vazio = extrairAssigneeDoPayload({ event: 'contact_updated' });
assert.equal(vazio, undefined);

marcarAssigneeOutbound('smoke-contato');
assert.equal(foiAssigneeOutboundRecente('smoke-contato'), true);
assert.equal(foiAssigneeOutboundRecente('outro'), false);

console.log('smoke assignee OK');
