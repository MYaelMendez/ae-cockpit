import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

// Append-only in-memory receipt log, hash-chained. Optionally persisted as
// one file per receipt under a directory such as ./.witness/.
export class Witness {
  constructor({ dir } = {}) { this.dir = dir; this.receipts = []; }
  record(fields) {
    const prev = this.receipts.at(-1)?.hash ?? '';
    const body = { ...fields, timestamp: new Date().toISOString(), prev };
    const receipt = Object.freeze({ ...body, hash: createHash('sha256').update(JSON.stringify(body)).digest('hex') });
    this.receipts.push(receipt);
    if (this.dir) {
      mkdirSync(this.dir, { recursive: true });
      const name = `${String(this.receipts.length).padStart(4, '0')}-${receipt.correlationId}.json`;
      writeFileSync(join(this.dir, name), JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
    }
    return receipt;
  }
  verify() {
    let prev = '';
    return this.receipts.every((r) => {
      const { hash, ...body } = r;
      const ok = r.prev === prev && createHash('sha256').update(JSON.stringify(body)).digest('hex') === hash;
      prev = hash;
      return ok;
    });
  }
}
