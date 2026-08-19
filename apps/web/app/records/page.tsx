"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiClient, type ReadingRecord } from "@booktalk/api-client";
import { useRequireAuth } from "../../lib/useRequireAuth";

export default function RecordsPage() {
  const ready = useRequireAuth();
  const [records, setRecords] = useState<ReadingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [openId, setOpenId] = useState<number | null>(null);
  const [rating, setRating] = useState("5");
  const [oneLineNote, setOneLineNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [reading, completed] = await Promise.all([
        apiClient.getMyReadingRecords("READING"),
        apiClient.getMyReadingRecords("COMPLETED"),
      ]);
      setRecords([...reading, ...completed]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "독서 기록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ready) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  async function handleComplete(id: number) {
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.completeReadingRecord(id, {
        rating: Number(rating),
        oneLineNote: oneLineNote.trim() || undefined,
      });
      setOpenId(null);
      setOneLineNote("");
      setMessage("완독 처리했어요. '내 서재'에서 이번 달 서재를 확인해보세요.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "완독 처리에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  const readingRecords = records.filter((r) => r.status === "READING");
  const completedRecords = records.filter((r) => r.status === "COMPLETED");

  if (!ready) return null;

  return (
    <main className="mx-auto max-w-md p-6">
      <Link href="/" className="text-sm text-gray-400 hover:underline">
        ← 홈
      </Link>
      <h1 className="mt-2 text-xl font-medium">독서 기록</h1>

      {message && <p className="mt-3 text-sm text-green-600">{message}</p>}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {loading && <p className="mt-4 text-sm text-gray-400">불러오는 중...</p>}

      <section className="mt-6">
        <h2 className="text-sm font-medium text-gray-500">읽는 중 ({readingRecords.length})</h2>
        {!loading && readingRecords.length === 0 && (
          <p className="mt-2 text-sm text-gray-400">
            읽고 있는 책이 없어요.{" "}
            <Link href="/books" className="underline">
              책 등록하러 가기
            </Link>
          </p>
        )}
        <ul className="mt-2 flex flex-col gap-2">
          {readingRecords.map((record) => (
            <li key={record.id} className="rounded-md border border-gray-200 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{record.book.title}</p>
                  <p className="text-xs text-gray-500">시작일 {record.startDate}</p>
                </div>
                <button
                  onClick={() => setOpenId(openId === record.id ? null : record.id)}
                  className="rounded-md border border-gray-300 px-3 py-1 text-xs hover:bg-gray-50"
                >
                  완독 처리
                </button>
              </div>

              {openId === record.id && (
                <div className="mt-3 flex flex-col gap-2 border-t border-gray-100 pt-3">
                  <label className="text-xs text-gray-500">
                    별점 (0~5)
                    <input
                      type="number"
                      min={0}
                      max={5}
                      step={0.5}
                      value={rating}
                      onChange={(e) => setRating(e.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="text-xs text-gray-500">
                    한 줄 기록
                    <textarea
                      value={oneLineNote}
                      onChange={(e) => setOneLineNote(e.target.value)}
                      placeholder="인상 깊었던 문장이나 느낀 점"
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      rows={2}
                    />
                  </label>
                  <button
                    onClick={() => handleComplete(record.id)}
                    disabled={submitting}
                    className="mt-1 rounded-md bg-gray-900 py-2 text-sm text-white disabled:opacity-50"
                  >
                    {submitting ? "저장 중..." : "완독 저장"}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-gray-500">완독 ({completedRecords.length})</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {completedRecords.map((record) => (
            <li key={record.id} className="rounded-md border border-gray-200 p-3">
              <p className="text-sm font-medium">{record.book.title}</p>
              <p className="text-xs text-gray-500">
                완독일 {record.endDate} {record.rating != null && `· ★${record.rating}`}
              </p>
              {record.oneLineNote && <p className="mt-1 text-xs text-gray-600">"{record.oneLineNote}"</p>}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
