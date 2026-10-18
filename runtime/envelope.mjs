import { randomUUID } from 'node:crypto';

export function createEnvelope({ intent, source, destination, action, payload = {}, correlationId = randomUUID() }) {
  const e = { intent, source, destination, action, payload, correlationId };
  for (const k of ['intent', 'source', 'destination', 'action']) {
    if (!e[k] || typeof e[k] !== 'string') throw new Error(`envelope.${k} is required`);
  }
  return Object.freeze(e);
}
