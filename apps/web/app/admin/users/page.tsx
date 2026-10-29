"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient, type AdminUserListItem } from "@booktalk/api-client";

export default function AdminUsersPage() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<AdminUserListItem[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(async (q: string, p: number) => {
    setLoading(true);
    try {
      const res = await apiClient.getAdminUsers(q || undefined, p, 20);
      setItems(res.content);
      setTotalPages(res.totalPages);
      setPage(res.page);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load("", 0);
  }, [load]);

  async function act(id: number, fn: () => Promise<unknown>, confirmMsg?: string) {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusy(id);
    try {
      await fn();
      await load(query, page);
    } finally {
      setBusy(null);
    }
  }

  const btn = "rounded border px-2 py-1 text-xs transition-colors disabled:opacity-40";

  return (
    <div>
      <h1 className="text-xl font-bold">회원 관리</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          load(query, 0);
        }}
        className="mt-4 flex gap-2"
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="닉네임 · 이메일 검색"
          className="w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
        />
        <button type="button" onClick={() => load(query, 0)} className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-bold text-white">
          검색
        </button>
      </form>

      <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">회원</th>
              <th className="px-4 py-3">제공자</th>
              <th className="px-4 py-3">역할</th>
              <th className="px-4 py-3">상태</th>
              <th className="px-4 py-3">가입</th>
              <th className="px-4 py-3 text-right">관리</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">불러오는 중...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">회원이 없어요.</td></tr>
            ) : (
              items.map((u) => (
                <tr key={u.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{u.nickname}</div>
                    <div className="text-xs text-gray-400">{u.email ?? "이메일 없음"}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.oauthProvider}</td>
                  <td className="px-4 py-3">
                    {u.role === "ADMIN" ? (
                      <span className="rounded-full bg-gray-900 px-2 py-0.5 text-xs font-bold text-white">ADMIN</span>
                    ) : (
                      <span className="text-gray-400">USER</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {u.suspended ? (
                      <span className="font-medium text-red-600">정지됨</span>
                    ) : (
                      <span className="text-green-600">정상</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {u.suspended ? (
                        <button disabled={busy === u.id} onClick={() => act(u.id, () => apiClient.unsuspendUser(u.id))} className={`${btn} border-gray-300 text-gray-700 hover:bg-gray-50`}>
                          정지 해제
                        </button>
                      ) : (
                        <button disabled={busy === u.id} onClick={() => act(u.id, () => apiClient.suspendUser(u.id), `${u.nickname} 회원을 정지할까요?`)} className={`${btn} border-red-300 text-red-600 hover:bg-red-50`}>
                          정지
                        </button>
                      )}
                      {u.role === "ADMIN" ? (
                        <button disabled={busy === u.id} onClick={() => act(u.id, () => apiClient.revokeAdmin(u.id), "관리자 권한을 회수할까요?")} className={`${btn} border-gray-300 text-gray-700 hover:bg-gray-50`}>
                          권한 회수
                        </button>
                      ) : (
                        <button disabled={busy === u.id} onClick={() => act(u.id, () => apiClient.grantAdmin(u.id), "관리자로 지정할까요?")} className={`${btn} border-gray-300 text-gray-700 hover:bg-gray-50`}>
                          관리자 지정
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-4 text-sm">
          <button disabled={page <= 0} onClick={() => load(query, page - 1)} className="text-gray-500 disabled:opacity-30">
            ← 이전
          </button>
          <span className="text-gray-500">{page + 1} / {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => load(query, page + 1)} className="text-gray-500 disabled:opacity-30">
            다음 →
          </button>
        </div>
      )}
    </div>
  );
}
