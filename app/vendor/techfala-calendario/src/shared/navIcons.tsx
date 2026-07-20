/**
 * Ícones da sidebar esquerda (extraídos do dump Bubble).
 * Ativo usa fill rosa #F5008D via currentColor.
 */
type Props = { className?: string }

export function NavAssistente({ className }: Props) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M7 10.2309L9.76923 13.0001C11.0586 12.5097 12.2956 11.8912 13.4615 11.154C18.28 7.92318 19 3.51088 19 1.00011C16.9717 0.987526 14.9739 1.49408 13.1966 2.47158C11.4193 3.44908 9.92171 4.86502 8.84615 6.58472C8.10973 7.73493 7.49121 8.9565 7 10.2309Z"
        fill="currentColor"
      />
      <path
        d="M9.76923 13.0001L7 10.2309M9.76923 13.0001C11.0586 12.5097 12.2956 11.8912 13.4615 11.154M9.76923 13.0001V17.6155C9.76923 17.6155 12.5662 17.1078 13.4615 15.7693C14.4585 14.274 13.4615 11.154 13.4615 11.154M7 10.2309C7.49121 8.9565 8.10973 7.73493 8.84615 6.58472C9.92171 4.86502 11.4193 3.44908 13.1966 2.47158C14.9739 1.49408 16.9717 0.987526 19 1.00011C19 3.51088 18.28 7.92318 13.4615 11.154M7 10.2309H2.38462C2.38462 10.2309 2.89231 7.43395 4.23077 6.53857C5.72615 5.54165 8.84615 6.53857 8.84615 6.53857M2.84615 14.3847C1.46154 15.5478 1 19.0001 1 19.0001C1 19.0001 4.45231 18.5386 5.61538 17.154C6.27077 16.3786 6.26154 15.1878 5.53231 14.4678C5.17351 14.1253 4.70089 13.9275 4.20513 13.9121C3.70938 13.8968 3.22542 14.0651 2.84615 14.3847Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function NavMultiChat({ className }: Props) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 18 18" fill="none">
      <path
        d="M18 9.77412C18 11.8351 16.938 13.6621 15.3 14.8142L14.094 17.4692C13.815 18.0722 13.005 18.1892 12.582 17.6762L11.25 16.0742C9.57596 16.0742 8.03695 15.5072 6.86694 14.5622L7.40695 13.9231C11.565 13.6081 14.85 10.3141 14.85 6.3001C14.85 5.6161 14.751 4.94109 14.571 4.29309C16.614 5.3731 18 7.42511 18 9.77412Z"
        fill="currentColor"
      />
      <path
        d="M12.8701 3.66308C11.8171 1.50307 9.46806 0 6.75004 0C3.02402 0 0 2.81708 0 6.3001C0 8.36111 1.06201 10.1881 2.70002 11.3401L3.90602 13.9951C4.18502 14.5981 4.99503 14.7061 5.41803 14.2021L5.91303 13.6081L6.75004 12.6001C10.4761 12.6001 13.5001 9.78312 13.5001 6.3001C13.5001 5.35509 13.2751 4.46409 12.8701 3.66308ZM9.00005 6.9751H4.50003C4.13102 6.9751 3.82502 6.6691 3.82502 6.3001C3.82502 5.9311 4.13102 5.62509 4.50003 5.62509H9.00005C9.36906 5.62509 9.67506 5.9311 9.67506 6.3001C9.67506 6.6691 9.36906 6.9751 9.00005 6.9751Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function NavCrm({ className }: Props) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="5" height="16" rx="1.5" fill="currentColor" />
      <rect x="10" y="8" width="5" height="12" rx="1.5" fill="currentColor" />
      <rect x="17" y="6" width="5" height="14" rx="1.5" fill="currentColor" />
    </svg>
  )
}

/** Ícones simples para os demais itens da nav (fiel ao papel, sem lib). */
export function NavSimple({
  className,
  paths,
}: Props & { paths: string[] }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      {paths.map((d) => (
        <path key={d} d={d} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  )
}
