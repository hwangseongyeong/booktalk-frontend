"use client";

/**
 * 로그인 이후 화면 공통 하단 내비게이션.
 * 아이콘은 Figma 하단바 디자인(하단 바_최종_261024.svg)에서 추출한 PNG를 그대로 사용한다.
 * (public/images/nav/*.png) 활성 탭은 진하게, 비활성 탭은 투명도로 흐리게 표시.
 * 현재 경로는 usePathname으로 자동 판별한다. 콘텐츠가 가려지지 않도록 페이지에 pb-24 정도 하단 여백을 준다.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  /** public/images/nav/{icon}.png */
  icon: string;
  /** null이면 아직 준비 안 된 메뉴(비활성) */
  href: string | null;
  /** 활성으로 볼 경로들 */
  match?: string[];
};

const ITEMS: NavItem[] = [
  { label: "홈", icon: "home", href: "/", match: ["/"] },
  { label: "북로그", icon: "shelf", href: "/shelf", match: ["/shelf"] },
  { label: "북메이트", icon: "chat", href: "/community", match: ["/community"] },
  { label: "북박스", icon: "box", href: "/bookbox", match: ["/bookbox", "/books"] },
  { label: "내 정보", icon: "my", href: "/my", match: ["/my"] },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      data-bottom-nav
      className="fixed bottom-0 left-1/2 z-50 flex h-20 w-full max-w-md -translate-x-1/2 items-stretch justify-around border-t border-gray-200 bg-white"
    >
      {ITEMS.map(({ label, icon, href, match }) => {
        const active = !!match?.some((p) => (p === "/" ? pathname === "/" : pathname.startsWith(p)));
        const opacity = href === null ? "opacity-25" : active ? "opacity-100" : "opacity-40";
        const textTone = href === null ? "text-gray-300" : active ? "text-gray-900" : "text-gray-400";
        const inner = (
          <span className="flex flex-1 flex-col items-center justify-center gap-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/images/nav/${icon}.png`} alt="" className={`h-9 w-auto ${opacity}`} />
            <span className={`text-[11px] font-bold ${textTone}`}>{label}</span>
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
