/**
 * Loads a page from scratch. Used whenever the signed-in user changes
 * (sign-in, sign-out, starting a demo): a client-side navigation would keep
 * pages and component state cached for the previous session.
 */
export function reloadTo(path: string): void {
  window.location.assign(path);
}
