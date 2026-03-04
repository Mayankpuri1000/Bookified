import BookCard from "@/components/BookCard";
import { LibraryHero } from "@/components/LibraryHero";
import { sampleBooks } from "@/lib/constants";

const Page = () => {
  return (
    <main className="wrapper container">
        <LibraryHero />

        <div className="library-books-grid">
          {sampleBooks.map((book) => (
            <BookCard key={book._id} title={book.title} author={book.author} slug={book.slug} coverURL={book.coverURL} />
          ))}
        </div>
    </main>
  );
};

export default Page;