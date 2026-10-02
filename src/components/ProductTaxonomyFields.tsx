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
  const options=useMemo(()=>PRODUCT_TAXONOMY[gender],[gender]);
  const visibleOptions=initialSubcategory && !options.includes(initialSubcategory as never)
    ? [initialSubcategory,...options]
    : [...options];

  return <div className="product-two-cols">
    <div className="product-field">
      <label>Kategori</label>
      <select name="gender" value={gender} onChange={e=>setGender(e.target.value as ProductGender)}>
        <option value="kadin">Kadın</option>
        <option value="erkek">Erkek</option>
        <option value="unisex">Unisex</option>
      </select>
    </div>
    <div className="product-field">
      <label>Alt kategori</label>
      <select name="product_type" defaultValue={initialSubcategory||""} key={gender} required>
        <option value="">Alt kategori seçin</option>
        {visibleOptions.map(item=><option key={item} value={item}>{item}</option>)}
      </select>
    </div>
  </div>;
}
