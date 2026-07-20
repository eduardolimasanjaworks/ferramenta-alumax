/**
 * Ícones SVG inline (paths do Lucide do dump).
 * Evita dependência lucide-react — tudo local.
 */
import type { ReactNode, SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function base(props: IconProps, children: ReactNode) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  )
}

export const IconSearch = (p: IconProps) =>
  base(p, (
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </>
  ))

export const IconFilter = (p: IconProps) =>
  base(p, <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />)

export const IconPlus = (p: IconProps) =>
  base(p, (
    <>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </>
  ))

export const IconGrip = (p: IconProps) =>
  base(p, (
    <>
      <circle cx="9" cy="12" r="1" />
      <circle cx="9" cy="5" r="1" />
      <circle cx="9" cy="19" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="15" cy="5" r="1" />
      <circle cx="15" cy="19" r="1" />
    </>
  ))

export const IconEllipsis = (p: IconProps) =>
  base(p, (
    <>
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="19" r="1" />
    </>
  ))

export const IconZoomIn = (p: IconProps) =>
  base(p, (
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
      <path d="M11 8v6" />
      <path d="M8 11h6" />
    </>
  ))

export const IconZoomOut = (p: IconProps) =>
  base(p, (
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
      <path d="M8 11h6" />
    </>
  ))

export const IconExpand = (p: IconProps) =>
  base(p, (
    <>
      <path d="m21 21-6-6m6 6v-4.8m0 4.8h-4.8" />
      <path d="M3 16.2V21m0 0h4.8M3 21l6-6" />
      <path d="M21 7.8V3m0 0h-4.8M21 3l-6 6" />
      <path d="M3 7.8V3m0 0h4.8M3 3l6 6" />
    </>
  ))

export const IconRefresh = (p: IconProps) =>
  base(p, (
    <>
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </>
  ))

export const IconListChecks = (p: IconProps) =>
  base(p, (
    <>
      <path d="m3 17 2 2 4-4" />
      <path d="m3 7 2 2 4-4" />
      <path d="M13 6h8" />
      <path d="M13 12h8" />
      <path d="M13 18h8" />
    </>
  ))

export const IconWorkflow = (p: IconProps) =>
  base(p, (
    <>
      <rect width="8" height="8" x="3" y="3" rx="2" />
      <path d="M7 11v4a2 2 0 0 0 2 2h4" />
      <rect width="8" height="8" x="13" y="13" rx="2" />
    </>
  ))

export const IconSliders = (p: IconProps) =>
  base(p, (
    <>
      <path d="M21 4h-7" />
      <path d="M10 4H3" />
      <path d="M21 12h-9" />
      <path d="M8 12H3" />
      <path d="M21 20h-5" />
      <path d="M12 20H3" />
      <path d="M14 2v4" />
      <path d="M8 10v4" />
      <path d="M16 18v4" />
    </>
  ))

export const IconLayoutGrid = (p: IconProps) =>
  base(p, (
    <>
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </>
  ))

export const IconRows = (p: IconProps) =>
  base(p, (
    <>
      <rect width="18" height="6" x="3" y="3" rx="1" />
      <rect width="18" height="6" x="3" y="15" rx="1" />
    </>
  ))

export const IconList = (p: IconProps) =>
  base(p, (
    <>
      <path d="M3 6h18" />
      <path d="M3 12h18" />
      <path d="M3 18h18" />
    </>
  ))

export const IconArrowUpDown = (p: IconProps) =>
  base(p, (
    <>
      <path d="m21 16-4 4-4-4" />
      <path d="M17 20V4" />
      <path d="m3 8 4-4 4 4" />
      <path d="M7 4v16" />
    </>
  ))

export const IconPlay = (p: IconProps) =>
  base(p, <polygon points="6 3 20 12 6 21 6 3" fill="currentColor" />)

export const IconX = (p: IconProps) =>
  base(p, (
    <>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </>
  ))

export const IconChevronLeft = (p: IconProps) =>
  base(p, <path d="m15 18-6-6 6-6" />)

export const IconChevronRight = (p: IconProps) =>
  base(p, <path d="m9 18 6-6-6-6" />)

export const IconUsers = (p: IconProps) =>
  base(p, (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ))

export const IconLayers = (p: IconProps) =>
  base(p, (
    <>
      <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
      <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" />
      <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />
    </>
  ))

export const IconCalendar = (p: IconProps) =>
  base(p, (
    <>
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </>
  ))

export const IconCalendarDays = (p: IconProps) =>
  base(p, (
    <>
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
      <path d="M8 14h.01" />
      <path d="M12 14h.01" />
      <path d="M16 14h.01" />
      <path d="M8 18h.01" />
      <path d="M12 18h.01" />
      <path d="M16 18h.01" />
    </>
  ))

export const IconCheck = (p: IconProps) =>
  base(p, <path d="M20 6 9 17l-5-5" />)

export const IconTrash = (p: IconProps) =>
  base(p, (
    <>
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </>
  ))

export const IconClock = (p: IconProps) =>
  base(p, (
    <>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </>
  ))

export const IconChevronDown = (p: IconProps) =>
  base(p, <path d="m6 9 6 6 6-6" />)

export const IconArrowLeft = (p: IconProps) =>
  base(p, (
    <>
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </>
  ))

export const IconDownload = (p: IconProps) =>
  base(p, (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </>
  ))

export const IconUpload = (p: IconProps) =>
  base(p, (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </>
  ))
