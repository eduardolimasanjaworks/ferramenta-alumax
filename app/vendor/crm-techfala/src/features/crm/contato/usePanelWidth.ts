/**
 * Largura ajustável do painel de contato.
 * Arrasta pela borda esquerda; em mobile ocupa a tela.
 */
import { useResizableWidth } from '@/shared/lib/useResizableWidth'

export function usePanelWidth() {
  return useResizableWidth({
    storageKey: 'techfala-contato-panel-w',
    minDesktop: 360,
    defaultRatio: 0.42,
  })
}
