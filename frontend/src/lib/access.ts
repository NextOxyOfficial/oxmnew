/**
 * What the signed-in login may do, on the frontend side.
 *
 * This only decides what to *draw*. The server decides what to allow — a menu
 * item hidden here is still refused there if someone types the URL, and that is
 * the check that matters. Hiding it as well just stops staff walking into 403s.
 */

export interface AccessUser {
  is_employee?: boolean;
  /** null (or absent) means an owner: no restrictions. */
  permissions?: string[] | null;
}

export const isOwner = (user?: AccessUser | null) =>
  !user?.is_employee || user?.permissions == null;

export const can = (user: AccessUser | null | undefined, code: string) =>
  isOwner(user) ? true : (user?.permissions ?? []).includes(code);

/** True when any one of the codes is granted — for a menu covering several. */
export const canAny = (
  user: AccessUser | null | undefined,
  codes: string[]
) => (isOwner(user) ? true : codes.some((c) => can(user, c)));
