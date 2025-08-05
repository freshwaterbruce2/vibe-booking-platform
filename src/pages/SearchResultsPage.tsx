
import SearchResults from '@/components/search/SearchResults';
import SearchFilters from '@/components/search/SearchFilters';

export function SearchResultsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1">
          <SearchFilters />
        </aside>
        <main className="lg:col-span-3">
          <SearchResults />
        </main>
      </div>
    </div>
  );
}