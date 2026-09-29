"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiClient, type ReadingRecord } from "@booktalk/api-client";
import { useRequireAuth } from "../../lib/useRequireAuth";
import { BottomNav } from "../../components/bottom-nav";

export default function RecordsPage() {
  const ready = useRequireAuth();
  const [records, setRecords] = useState<ReadingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const readingRecords = records.filter((r) => r.status === "READING");
  const completedRecords = records.filter((r) => r.status === "COMPLETED");

  if (!ready) return null;

  return (
    <main className="mx-auto max-w-md p-6 pb-24">
      <Link href="/" className="text-sm text-gray-400 hover:underline">
        ← 홈
      </Link>
      <h1 className="mt-2 text-xl font-medium">독서 기록</h1>

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
                <Link
                  href={`/records/${record.id}/complete`}
                  className="rounded-md border border-gray-300 px-3 py-1 text-xs hover:bg-gray-50"
                >
                  완독 처리
                </Link>
              </div>
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

      <BottomNav />
    </main>
  );
}
