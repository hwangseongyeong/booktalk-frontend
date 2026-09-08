"use client";

import { useEffect, useState } from "react";
import { apiClient, type AuthUser } from "@booktalk/api-client";
import { useRequireAuth } from "../../lib/useRequireAuth";
import { BottomNav } from "../../components/bottom-nav";

export default function MyPage() {
  const ready = useRequireAuth();
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        setProfile(await apiClient.getMyProfile());
      } catch (e) {
        setError(e instanceof Error ? e.message : "프로필을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, [ready]);

  function handleLogout() {
    apiClient.logout();
    window.location.href = "/login";
  }

  if (!ready) return null;

  return (
    <main className="mx-auto max-w-md p-6 pb-24">
      <h1 className="text-xl font-medium">마이</h1>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {loading && <p className="mt-4 text-sm text-gray-400">불러오는 중...</p>}

      {profile && (
        <section className="mt-6 flex items-center gap-4">
          <span
            className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full text-xl font-bold text-white"
            style={{ backgroundColor: profile.profileColor ?? "#9ca3af" }}
          >
            {profile.profileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.profileImageUrl}
                alt={profile.nickname}
                className="h-full w-full object-cover"
              />
            ) : (
              profile.nickname.slice(0, 1)
            )}
          </span>
          <div>
            <p className="text-lg font-medium">{profile.nickname}</p>
            {profile.email && <p className="text-sm text-gray-500">{profile.email}</p>}
          </div>
        </section>
      )}

      <section className="mt-10 border-t border-gray-100 pt-6">
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-gray-900 hover:underline"
        >
          로그아웃
        </button>
      </section>

      <BottomNav />
    </main>
  );
}
