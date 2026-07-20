/**
 * Itens da sidebar esquerda do TechFala.
 * Labels só no tooltip — no dump ficam ocultos.
 */
import type { ReactNode } from 'react'
import { NavAssistente, NavCrm, NavMultiChat, NavSimple } from '@/shared/navIcons'

export type RotaId =
  | 'assistente'
  | 'multichat'
  | 'campanhas'
  | 'crm'
  | 'marketing'
  | 'neural-sales'
  | 'calendario'
  | 'faturamento'
  | 'configuracoes'
  | 'ajuda'

export type NavItem = {
  id: RotaId
  label: string
  icon: ReactNode
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'assistente', label: 'Assistente Virtual', icon: <NavAssistente /> },
  { id: 'multichat', label: 'Multi Chat', icon: <NavMultiChat /> },
  {
    id: 'campanhas',
    label: 'Campanhas',
    icon: <NavSimple paths={['M3 11l18-5v12L3 13v-2z', 'M11.6 16.8a3 3 0 1 1-5.8-1.6']} />,
  },
  { id: 'crm', label: 'CRM', icon: <NavCrm /> },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: <NavSimple paths={['M12 2v4', 'M12 18v4', 'm4.93 4.93 2.83 2.83', 'm16.24 16.24 2.83 2.83', 'M2 12h4', 'M18 12h4', 'm4.93 19.07 2.83-2.83', 'm16.24 7.76 2.83-2.83']} />,
  },
  {
    id: 'neural-sales',
    label: 'Neural Sales',
    icon: (
      <NavSimple
        paths={[
          'M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z',
          'M5 17l.7 2L8 20l-2.3.7L5 23l-.7-2.3L2 20l2.3-.7L5 17z',
        ]}
      />
    ),
  },
  {
    id: 'calendario',
    label: 'Calendário',
    icon: <NavSimple paths={['M8 2v4', 'M16 2v4', 'M3 10h18', 'M5 6h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z']} />,
  },
  {
    id: 'faturamento',
    label: 'Faturamento',
    icon: <NavSimple paths={['M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z', 'M16 8H8', 'M16 12H8', 'M12 16H8']} />,
  },
  {
    id: 'configuracoes',
    label: 'Configurações',
    icon: <NavSimple paths={['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.6.9 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z']} />,
  },
  {
    id: 'ajuda',
    label: 'Ajuda',
    icon: <NavSimple paths={['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3', 'M12 17h.01']} />,
  },
]
