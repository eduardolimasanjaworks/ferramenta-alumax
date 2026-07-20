#!/usr/bin/env node
/**
 * Orquestra bateria ~100 testes: auth, agenda, CRM, campanhas, WA, IA.
 *
 * Uso:
 *   TEST_SENHA=… EVOLUTION_URL=… EVOLUTION_API_KEY=… \
 *   node scripts/bateria-100.mjs
 */
import { BASE, EMAIL, SENHA, EV_URL, EV_KEY, EV_INST, TEL_A, TEL_B, summary, results } from './bateria/helpers.mjs'
import { suiteAuth } from './bateria/auth.mjs'
import { suiteAgenda } from './bateria/agenda.mjs'
import { suiteCrm } from './bateria/crm.mjs'
import { suiteCampanhas } from './bateria/campanhas.mjs'
import { suiteWhatsapp } from './bateria/whatsapp.mjs'
import { suiteIa } from './bateria/ia.mjs'

async function main() {
  if (!SENHA) {
    console.error('Defina TEST_SENHA')
    process.exit(1)
  }
  console.log(`\n=== BATERIA TILIT @ ${BASE} ===`)
  console.log(`user=${EMAIL} waInst=${EV_INST} evo=${!!EV_URL && !!EV_KEY}`)
  console.log(`tels=${TEL_A}, ${TEL_B}\n`)

  const ctx = {}
  await suiteAuth()
  await suiteAgenda(ctx)
  await suiteCrm(ctx)
  await suiteCampanhas(ctx)
  await suiteWhatsapp(ctx)
  await suiteIa()

  const s = summary()
  // meta: garantir ~100
  console.log(`\nTotal casos: ${results.length} (meta ≥ 100: ${results.length >= 100 ? 'SIM' : 'NÃO'})`)
  process.exit(s.fail > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(2)
})
