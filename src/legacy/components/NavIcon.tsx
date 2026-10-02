const paths: Record<string, string> = {
  '/dashboard': 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  '/missions': 'M6 3v12a4 4 0 0 0 4 4h8 M3 3h6 M18 16l3 3-3 3 M10 9h8 M18 6l3 3-3 3',
  '/agents': 'M5 7h14v14H5z M9 11v2 M15 11v2 M9 17h6 M12 3v4 M2 11h3 M19 11h3',
  '/connections': 'M8 3v5 M16 3v5 M5 8h14v4a7 7 0 0 1-7 7v3 M5 8v4a7 7 0 0 0 7 7',
  '/models': 'M12 3l3 6 6 3-6 3-3 6-3-6-6-3 6-3z',
  '/approvals': 'M12 3l8 3v6c0 5-8 9-8 9s-8-4-8-9V6z M8 12l3 3 5-6',
  '/budgets': 'M3 6h18v15H3z M3 6V3h15 M15 12h6 M16 16h1',
  '/costs': 'M12 2v20 M17 6H9a3 3 0 0 0 0 6h6a3 3 0 0 1 0 6H6',
  '/memory': 'M9 4a4 4 0 0 0-6 4v8a4 4 0 0 0 6 4 M15 4a4 4 0 0 1 6 4v8a4 4 0 0 1-6 4 M9 2v20 M15 2v20 M3 10h6 M15 14h6',
  '/audit': 'M5 3h14v18H5z M8 7h8 M8 12h8 M8 17h5',
  '/policies': 'M12 3l8 3v6c0 5-8 9-8 9s-8-4-8-9V6z M12 8v5 M12 16h.01',
  '/settings/autonomy': 'M3 6h18 M3 12h18 M3 18h18 M7 3v6 M16 9v6 M10 15v6',
  '/settings/emergency': 'M8 3h8l5 5v8l-5 5H8l-5-5V8z M12 7v6 M12 17h.01',
};

export function NavIcon({ href }: { href: string }) {
  return <svg aria-hidden="true" className="h-5 w-5 shrink-0" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d={paths[href] ?? paths['/models']} />
  </svg>;
}
