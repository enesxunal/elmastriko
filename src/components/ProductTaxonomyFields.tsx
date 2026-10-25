"use client";

import { useMemo, useState } from "react";
import { PRODUCT_TAXONOMY, ProductGender } from "@/lib/product-taxonomy";

export default function ProductTaxonomyFields({
  initialGender="kadin",
  initialSubcategory="",
}:{
  initialGender?:string|null;
  initialSubcategory?:string|null;
}) {
  const safeGender=(initialGender&&initialGender in PRODUCT_TAXONOMY?initialGender:"kadin") as ProductGender;
  const [gender,setGender]=useState<ProductGender>(safeGender);
  const [subcategory,setSubcategory]=useState(initialSubcategory||"");
  const options=useMemo(()=>PRODUCT_TAXONOMY[gender],[gender]);
  const visibleOptions=gender===safeGender && subcategory && !options.includes(subcategory as never)
    ? [subcategory,...options]
    : [...options];
  function changeGender(next: ProductGender) {
    setGender(next);
    setSubcategory(current => PRODUCT_TAXONOMY[next].includes(current as never) ? current : "");
  }

  return <div className="product-two-cols">
    <div className="product-field">
      <label>Kategori</label>
      <select name="gender" value={gender} onChange={e=>changeGender(e.target.value as ProductGender)}>
        <option value="kadin">Kadın</option>
        <option value="erkek">Erkek</option>
        <option value="unisex">Unisex</option>
      </select>
    </div>
    <div className="product-field">
      <label>Alt kategori</label>
      <select name="product_type" value={subcategory} onChange={e=>setSubcategory(e.target.value)} required>
        <option value="">Alt kategori seçin</option>
        {visibleOptions.map(item=><option key={item} value={item}>{item}</option>)}
      </select>
    </div>
  </div>;
}
