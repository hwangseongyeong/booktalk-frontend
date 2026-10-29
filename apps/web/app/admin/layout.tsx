"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { apiClient } from "@booktalk/api-client";
import { useRequireAuth } from "../../lib/useRequireAuth";

const NAV = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/users", label: "회원 관리" },
  { href: "/admin/moderation", label: "모더레이션" },
];

/**
 * 어드민 공통 셸. 로그인 필수(useRequireAuth) + ADMIN 권한 확인(어드민 API 호출로 검증).
 * 권한이 없으면(403) 접근 거부 화면을 보여준다. 실제 보호는 서버의 역할 가드가 담당한다.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const ready = useRequireAuth();
  const pathname = usePathname();
  const [access, setAccess] = useState<"checking" | "ok" | "denied">("checking");

  useEffect(() => {
    if (!ready) return;
    apiClient
      .getAdminMetrics()
      .then(() => setAccess("ok"))
      .catch(() => setAccess("denied"));
  }, [ready]);

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-8 px-6 py-4">
          <span className="text-lg font-bold">text42 어드민</span>
          <nav className="flex gap-5 text-sm">
            {NAV.map((n) => {
              const active = n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`font-medium transition-colors ${active ? "text-gray-900" : "text-gray-400 hover:text-gray-700"}`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        {access === "checking" ? (
          <p className="py-16 text-center text-sm text-gray-400">확인 중...</p>
        ) : access === "denied" ? (
          <div className="mx-auto max-w-md rounded-xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="text-base font-bold text-red-700">관리자 권한이 필요합니다</p>
            <p className="mt-2 text-sm text-red-600">ADMIN 역할이 부여된 계정으로 로그인해주세요.</p>
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
