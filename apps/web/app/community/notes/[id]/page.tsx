"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiClient, resolveAssetUrl, type BookNote } from "@booktalk/api-client";
import { useRequireAuth } from "../../../../lib/useRequireAuth";

/** 작성일 표기(예: 2026.10.24) */
function formatNoteDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}

/** 혼자 북톡 상세. 백엔드 단건 조회 API(본인 것만)로 가져온다. */
export default function BookNoteDetailPage() {
  const ready = useRequireAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const [note, setNote] = useState<BookNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setLoading(true);
    apiClient
      .getBookNote(id)
      .then((n) => {
        if (!cancelled) setNote(n);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, id]);

  async function handleDelete() {
    if (!note || deleting) return;
    if (!window.confirm("이 기록을 삭제할까요?")) return;
    setDeleting(true);
    try {
      await apiClient.deleteBookNote(note.id);
      router.replace("/community?tab=solo");
    } catch {
      setDeleting(false);
      window.alert("삭제에 실패했어요. 다시 시도해주세요.");
    }
  }

  if (!ready) return null;

  const imageSrc = resolveAssetUrl(note?.imageUrl);

  return (
    <main className="mx-auto min-h-screen max-w-md bg-white px-5 pb-24 pt-6">
      <header className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          aria-label="뒤로"
          className="flex h-9 w-9 items-center justify-center text-gray-900"
        >
          <span aria-hidden className="text-2xl leading-none">
            ←
          </span>
        </button>
        {note && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-sm text-gray-400 transition-colors hover:text-red-500 disabled:opacity-40"
          >
            삭제
          </button>
        )}
      </header>

      {loading ? (
        <p className="py-20 text-center text-sm text-gray-400">불러오는 중...</p>
      ) : notFound || !note ? (
        <div className="py-20 text-center">
          <p className="text-sm text-gray-400">기록을 찾을 수 없어요.</p>
          <Link
            href="/community?tab=solo"
            className="mt-4 inline-block text-sm text-gray-500 underline"
          >
            혼자 북톡으로
          </Link>
        </div>
      ) : (
        <article className="mt-4">
          {note.book && <p className="text-lg font-bold text-gray-900">{note.book.title}</p>}
          <p className="mt-1 text-xs text-gray-400">{formatNoteDate(note.createdAt)}</p>
          {imageSrc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageSrc} alt="" className="mt-4 w-full rounded-2xl object-contain" />
          )}
          {note.content && (
            <p className="mt-5 whitespace-pre-wrap text-[15px] leading-relaxed text-gray-800">
              {note.content}
            </p>
          )}
        </article>
      )}
    </main>
  );
}
