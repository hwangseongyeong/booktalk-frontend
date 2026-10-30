"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { apiClient, resolveAssetUrl, type AdminUserDetail } from "@booktalk/api-client";

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 py-3 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium">{children}</span>
    </div>
  );
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setUser(await apiClient.getAdminUserDetail(id));
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (Number.isFinite(id) && id > 0) load();
    else setNotFound(true);
  }, [id, load]);

  async function act(fn: () => Promise<unknown>, confirmMsg?: string) {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusy(true);
    try {
      await fn();
      await load();
    } finally {
      setBusy(false);
    }
  }

  const btn = "rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40";
  const avatar = resolveAssetUrl(user?.profileImageUrl);

  return (
    <div>
      <Link href="/admin/users" className="text-sm text-gray-400 hover:text-gray-700">
        ← 회원 관리
      </Link>

      {loading ? (
        <p className="mt-6 text-sm text-gray-400">불러오는 중...</p>
      ) : notFound || !user ? (
        <div className="mx-auto mt-10 max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-base font-bold text-gray-700">회원을 찾을 수 없어요</p>
          <button onClick={() => router.push("/admin/users")} className="mt-4 text-sm text-gray-500 underline">
            목록으로 돌아가기
          </button>
        </div>
      ) : (
        <>
          <section className="mt-5 flex items-center gap-5">
            <span
              className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full text-2xl font-bold text-white"
              style={{ backgroundColor: user.profileColor ?? "#9ca3af" }}
            >
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt={user.nickname} className="h-full w-full object-cover" />
              ) : (
                user.nickname.slice(0, 1)
              )}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-xl font-bold">{user.nickname}</h1>
                {user.role === "ADMIN" && (
                  <span className="rounded-full bg-gray-900 px-2 py-0.5 text-xs font-bold text-white">ADMIN</span>
                )}
                {user.suspended && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">정지됨</span>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500">{user.email ?? "이메일 없음"}</p>
            </div>
          </section>

          <section className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
            <Stat label="독서 기록" value={user.readingRecordCount} />
            <Stat label="혼자 북톡" value={user.bookNoteCount} />
            <Stat label="온보딩" value={user.onboardingCompleted ? "완료" : "미완료"} />
          </section>

          <section className="mt-6 rounded-xl border border-gray-200 bg-white px-5">
            <Row label="회원 ID">{user.id}</Row>
            <Row label="로그인 제공자">{user.oauthProvider}</Row>
            <Row label="역할">{user.role}</Row>
            <Row label="상태">
              {user.suspended ? (
                <span className="text-red-600">정지됨</span>
              ) : (
                <span className="text-green-600">정상</span>
              )}
            </Row>
            <Row label="가입일">{new Date(user.createdAt).toLocaleString()}</Row>
          </section>

          <section className="mt-6 flex flex-wrap gap-2">
            {user.suspended ? (
              <button disabled={busy} onClick={() => act(() => apiClient.unsuspendUser(user.id))} className={`${btn} border-gray-300 text-gray-700 hover:bg-gray-50`}>
                정지 해제
              </button>
            ) : (
              <button disabled={busy} onClick={() => act(() => apiClient.suspendUser(user.id), `${user.nickname} 회원을 정지할까요?`)} className={`${btn} border-red-300 text-red-600 hover:bg-red-50`}>
                정지
              </button>
            )}
            {user.role === "ADMIN" ? (
              <button disabled={busy} onClick={() => act(() => apiClient.revokeAdmin(user.id), "관리자 권한을 회수할까요?")} className={`${btn} border-gray-300 text-gray-700 hover:bg-gray-50`}>
                권한 회수
              </button>
            ) : (
              <button disabled={busy} onClick={() => act(() => apiClient.grantAdmin(user.id), "관리자로 지정할까요?")} className={`${btn} border-gray-300 text-gray-700 hover:bg-gray-50`}>
                관리자 지정
              </button>
            )}
          </section>
        </>
      )}
    </div>
  );
}
