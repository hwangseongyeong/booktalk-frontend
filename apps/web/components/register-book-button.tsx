import Link from "next/link";

/**
 * 상단 우측 '책 등록' 진입 버튼.
 * 아이콘은 Figma 책추가 디자인(책추가_최종_261024.svg)에서 추출한 PNG를 사용한다. (public/images/book-add.png)
 * 홈·북로그 헤더에서 프로필 아바타 자리를 대체한다. (/my는 하단 '내정보' 탭으로 접근)
 */
export function RegisterBookButton() {
  return (
    <Link
      href="/books"
      aria-label="책 등록"
      className="flex flex-col items-center gap-1 text-gray-900"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/book-add.png" alt="" className="h-7 w-auto" />
      <span className="text-[10px] font-bold leading-none">책 등록</span>
    </Link>
  );
}
