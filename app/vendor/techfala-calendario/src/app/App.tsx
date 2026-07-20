/**
 * App raiz embed: só o Calendário interno do painel Tilit.
 * Sem página pública de agendamento.
 */
import { CalendarioPage } from '@/features/calendario/CalendarioPage'
import { CalendarioProvider } from '@/features/calendario/store/calendarioStore'

export function App() {
  return (
    <CalendarioProvider>
      <CalendarioPage />
    </CalendarioProvider>
  )
}
