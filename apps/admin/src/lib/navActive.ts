/** Compara ruta actual con destino del menú (incluye query params como ?tab=). */
export function isNavItemActive(
  pathname: string,
  search: string,
  itemTo: string,
  end?: boolean,
): boolean {
  const [itemPath, itemQuery = ""] = itemTo.split("?");
  const current = `${pathname}${search}`;

  if (itemQuery) {
    const normalizedItem = itemPath + (itemQuery ? `?${itemQuery}` : "");
    return current === normalizedItem || current.startsWith(`${normalizedItem}&`);
  }

  if (end) return pathname === itemPath;
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}
