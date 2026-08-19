type BookSpineProps = {
  title: string;
  spineImageUrl?: string | null;
  primaryColor?: string | null;
  height?: number;
};

/**
 * 책등 이미지를 렌더링하는 컴포넌트.
 * 색상 추출/SVG 생성은 백엔드에서 도서 등록 시 1회만 수행되고,
 * 프론트는 캐싱된 spineImageUrl을 그대로 렌더링만 한다.
 * spineImageUrl이 아직 없는 경우(생성 전/실패) primaryColor 기반 fallback을 보여준다.
 */
export function BookSpine({ title, spineImageUrl, primaryColor, height = 220 }: BookSpineProps) {
  if (spineImageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={spineImageUrl}
        alt={title}
        style={{ height, width: "auto" }}
        className="shrink-0 rounded-sm shadow-sm"
      />
    );
  }

  return (
    <div
      style={{ height, backgroundColor: primaryColor ?? "#B4B2A9" }}
      className="flex w-10 shrink-0 items-center justify-center rounded-sm shadow-sm"
    >
      <span className="rotate-90 whitespace-nowrap text-[10px] text-white/80">{title}</span>
    </div>
  );
}
