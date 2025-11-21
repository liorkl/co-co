export function normalizeMagicLink(magicLink: string, baseUrl: string): string {
  try {
    const link = new URL(magicLink);
    const base = new URL(baseUrl);
    link.protocol = base.protocol;
    link.host = base.host;
    return link.toString();
  } catch {
    return magicLink;
  }
}


