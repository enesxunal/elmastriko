"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2 } from "lucide-react";
import ProductImagePicker from "./ProductImagePicker";
import { createClient } from "@/lib/supabase/client";

export default function ProductMediaUploadForm({productId,productName,startOrder}:{productId:string;productName:string;startOrder:number}) {
  const router=useRouter();
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");

  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(busy) return;
    setBusy(true);
    setError("");

    const form=event.currentTarget;
    const fd=new FormData(form);
    const alt=String(fd.get("alt_text")||"").trim()||productName;
    const files=fd.getAll("images").filter((item):item is File=>item instanceof File&&item.size>0).slice(0,8);
    if(!files.length){
      setError("En az bir görsel seçin.");
      setBusy(false);
      return;
    }

    const supabase=createClient();
    const uploadedPaths:string[]=[];
    const insertedImageIds:string[]=[];
    try {
      for(const [index,file] of files.entries()){
        if(file.size>8*1024*1024) throw new Error("Her görsel en fazla 8 MB olabilir.");
        const ext=(file.name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"");
        const path=`${productId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
        const {error:uploadError}=await supabase.storage.from("product-media").upload(path,file,{contentType:file.type,upsert:false});
        if(uploadError) throw uploadError;
        uploadedPaths.push(path);
        const url=supabase.storage.from("product-media").getPublicUrl(path).data.publicUrl;
        const {data:image,error:imageError}=await supabase.from("product_images").insert({
          product_id:productId,
          url,
          alt_text:alt,
          sort_order:startOrder+index,
        }).select("id").single();
        if(imageError) throw imageError;
        insertedImageIds.push(image.id);
        await supabase.from("audit_logs").insert({action:"create",entity_type:"product_image",entity_id:image.id,metadata:{productId,source:"admin_direct_upload"}});
      }
      form.reset();
      router.refresh();
    } catch(uploadError) {
      if(insertedImageIds.length) await supabase.from("product_images").delete().in("id",insertedImageIds);
      if(uploadedPaths.length) await supabase.storage.from("product-media").remove(uploadedPaths);
      setError(uploadError instanceof Error?uploadError.message:"Görsel yüklenemedi.");
    } finally {
      setBusy(false);
    }
  }

  return <form onSubmit={submit} className="product-media-form">
    {error&&<div className="admin-alert error">{error}</div>}
    <ProductImagePicker/>
    <div className="product-media-meta">
      <div className="product-field"><label>Görsel alt metni</label><input name="alt_text" placeholder={productName+" ürün görseli"}/></div>
      <button className="admin-primary-button" type="submit" disabled={busy}>{busy?<><Loader2 size={15} className="spin"/> Yükleniyor...</>:<><ImagePlus size={15}/> Seçilenleri yükle</>}</button>
    </div>
  </form>;
}
