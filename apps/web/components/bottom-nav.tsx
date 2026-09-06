"use client";

/**
 * 로그인 이후 화면 공통 하단 내비게이션 (피그마: 검정 바 + 홈·책장·기록·소통·마이).
 * 현재 경로는 usePathname으로 자동 판별하므로 페이지에서 그냥 <BottomNav /> 만 놓으면 된다.
 * 콘텐츠가 가려지지 않도록 페이지 컨테이너에 pb-24 정도의 하단 여백을 준다.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import {
  NavChatIcon,
  NavHomeIcon,
  NavMyIcon,
  NavRecordIcon,
  NavShelfIcon,
} from "./icons";

type NavItem = {
  label: string;
  Icon: ComponentType<{ size?: number }>;
  /** null이면 아직 준비 안 된 메뉴(비활성) */
  href: string | null;
  /** 활성으로 볼 경로들 */
  match?: string[];
};

const ITEMS: NavItem[] = [
  { label: "홈", Icon: NavHomeIcon, href: "/", match: ["/"] },
  { label: "책장", Icon: NavShelfIcon, href: "/shelf", match: ["/shelf"] },
  { label: "기록", Icon: NavRecordIcon, href: "/records", match: ["/records", "/books"] },
  { label: "소통", Icon: NavChatIcon, href: null },
  { label: "마이", Icon: NavMyIcon, href: null },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 flex h-16 w-full max-w-md -translate-x-1/2 items-stretch justify-around bg-ink">
      {ITEMS.map(({ label, Icon, href, match }) => {
        const active = !!match?.some((p) => (p === "/" ? pathname === "/" : pathname.startsWith(p)));
        const tone = href === null
          ? "text-white/30"
          : active
            ? "text-paper-pure"
            : "text-white/45";
        const inner = (
          <span className={`flex flex-1 flex-col items-center justify-center gap-0.5 ${tone}`}>
            <Icon size={22} />
            <span className="text-[10px] font-bold">{label}</span>
          </span>
        );

        return href === null ? (
          <span key={label} aria-disabled className="flex flex-1" title="준비 중">
            {inner}
          </span>
        ) : (
          <Link key={label} href={href} className="flex flex-1" aria-current={active ? "page" : undefined}>
            {inner}
          </Link>
        );
      })}
    </nav>
  );
}
