"use client";

import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { AnchorHTMLAttributes, PropsWithChildren } from "react";

type LinkProps = PropsWithChildren<
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { to: string }
>;

export function NavLink({ to, children, ...props }: LinkProps) {
  return (
    <NextLink href={to} {...props}>
      {children}
    </NextLink>
  );
}

export const Link = NavLink;

export function useNavigate() {
  const router = useRouter();
  return (to: string) => router.push(to);
}

export function useLocation() {
  const pathname = usePathname();
  return { pathname, key: pathname, state: null };
}
