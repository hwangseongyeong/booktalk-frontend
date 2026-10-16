import Link from "next/link";
import { PlusIcon } from "./icons";

/**
 * 상단 우측 '책 등록' 진입 버튼 (플러스 아이콘 + 라벨).
 * 홈·북로그 헤더에서 프로필 아바타 자리를 대체한다. (/my는 하단 '내정보' 탭으로 접근)
 */
export function RegisterBookButton() {
  return (
    <Link
      href="/books"
      aria-label="책 등록"
      className="flex flex-col items-center gap-1 text-gray-900"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-gray-900">
        <PlusIcon size={18} />
      </span>
      <span className="text-[10px] font-bold leading-none">책 등록</span>
    </Link>
  );
}
