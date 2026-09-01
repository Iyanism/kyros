export function capitalise(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getInitials(identifier: string): string {
  const [handle = ""] = identifier.split("@");
  const parts = handle.trim().split(/[\s._-]+/).filter(Boolean);

  const first = parts[0]?.[0];
  const second = parts[1]?.[0];

  if (first && second) {
    return (first + second).toUpperCase();
  }

  return parts[0]?.slice(0, 2).toUpperCase() || "--";
}
