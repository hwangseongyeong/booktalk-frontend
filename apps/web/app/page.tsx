import Link from "next/link";

const NAV_ITEMS = [
  { href: "/books", title: "책 등록/검색", description: "읽을 책을 등록하고 검색해요" },
  { href: "/records", title: "독서 기록", description: "읽는 중인 책을 완독 처리해요" },
  { href: "/shelf", title: "내 서재", description: "이번 달 읽은 책을 책꽂이로 봐요" },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-2xl font-medium">BookTalk</h1>
        <p className="mt-2 text-sm text-gray-500">읽은 책이 하나의 서재가 되다</p>
      </div>

      <nav className="flex w-full flex-col gap-3">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-lg border border-gray-200 p-4 transition hover:border-gray-400 hover:bg-gray-50"
          >
            <p className="font-medium">{item.title}</p>
            <p className="mt-1 text-sm text-gray-500">{item.description}</p>
          </Link>
        ))}
      </nav>
    </main>
  );
}
