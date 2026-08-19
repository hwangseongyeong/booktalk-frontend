import { BookSpine } from "./BookSpine";

type ShelfBook = {
  id: number;
  title: string;
  spineImageUrl?: string | null;
  primaryColor?: string | null;
};

type BookShelfProps = {
  books: ShelfBook[];
};

/** 책꽂이(모드 1) 화면. 책등들을 원목 선반 위에 가로로 배치한다. */
export function BookShelf({ books }: BookShelfProps) {
  return (
    <div className="rounded-md bg-amber-50 p-4">
      <div className="flex items-end gap-1 overflow-x-auto pb-2">
        {books.map((book) => (
          <BookSpine
            key={book.id}
            title={book.title}
            spineImageUrl={book.spineImageUrl}
            primaryColor={book.primaryColor}
          />
        ))}
      </div>
      {/* 원목 선반 */}
      <div className="mt-1 h-3 rounded-sm bg-amber-800/80" />
    </div>
  );
}
