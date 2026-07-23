import { uazStatus } from './app/src/lib/uazapi.js';
import { obterInfoInstancia } from './app/src/lib/evolution.js';

async function main() {
  try {
    console.log('--- UAZAPI ---');
    const st = await uazStatus();
    console.log(st);
  } catch (e) {
    console.error('UAZAPI Error:', e.message);
  }

  try {
    console.log('--- EVOLUTION ---');
    const info = await obterInfoInstancia();
    console.log(info);
  } catch (e) {
    console.error('EVOLUTION Error:', e.message);
  }
}

main();
