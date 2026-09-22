import Link from "next/link";

export default function CatalogFilters({
  basePath,
  query,
  currentType,
  currentSort,
  types,
}: {
  basePath: string;
  query?: string;
  currentType?: string;
  currentSort?: string;
  types: string[];
}) {
  const hrefFor = (params: Record<string, string | undefined>) => {
    const search = new URLSearchParams();
    if (query) search.set("q", query);
    const type = params.type ?? currentType;
    const sort = params.sort ?? currentSort;
    if (type) search.set("type", type);
    if (sort) search.set("sort", sort);
    return basePath + (search.toString() ? "?" + search.toString() : "");
  };

  return <div className="catalog-filterbar">
    <div className="filter-group">
      <span>Kategori</span>
      <Link className={!currentType ? "active" : ""} href={hrefFor({ type: "" })}>Tümü</Link>
      {types.map(type => <Link className={currentType === type ? "active" : ""} href={hrefFor({ type })} key={type}>{type}</Link>)}
    </div>
    <div className="filter-group filter-sort">
      <span>Sırala</span>
      <Link className={!currentSort || currentSort === "newest" ? "active" : ""} href={hrefFor({ sort: "newest" })}>Yeni</Link>
      <Link className={currentSort === "price-asc" ? "active" : ""} href={hrefFor({ sort: "price-asc" })}>Fiyat ↑</Link>
      <Link className={currentSort === "price-desc" ? "active" : ""} href={hrefFor({ sort: "price-desc" })}>Fiyat ↓</Link>
    </div>
  </div>;
}
