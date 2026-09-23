"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";

function v(fd: FormData, key: string) { return String(fd.get(key) || "").trim(); }
function num(fd: FormData, key: string) { const x = v(fd,key); return x === "" ? null : Number(x); }

async function audit(action: string, entityType: string, entityId?: string, metadata: Record<string, unknown> = {}) {
  const { supabase, user } = await requireAdmin();
  await supabase.from("audit_logs").insert({ actor_id: user.id, action, entity_type: entityType, entity_id: entityId || null, metadata });
}

async function uploadProductFiles(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  productId: string,
  files: File[],
  altText: string,
) {
  const allowedTypes = ["image/png","image/jpeg","image/webp","image/avif"];
  const validFiles = files.filter(file => file instanceof File && file.size > 0).slice(0,8);
  for (const [index,file] of validFiles.entries()) {
    if (!allowedTypes.includes(file.type)) throw new Error("Desteklenmeyen görsel formatı.");
    if (file.size > 8 * 1024 * 1024) throw new Error("Her görsel en fazla 8 MB olabilir.");
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g,"");
    const path = `${productId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("product-media").upload(path,file,{contentType:file.type||undefined,upsert:false});
    if (uploadError) throw uploadError;
    const url = supabase.storage.from("product-media").getPublicUrl(path).data.publicUrl;
    const { error: imageError } = await supabase.from("product_images").insert({
      product_id: productId,
      url,
      alt_text: altText || null,
      sort_order: index,
    });
    if (imageError) throw imageError;
  }
}

export async function createProduct(fd: FormData) {
  const { supabase } = await requireAdmin();
  const slug = v(fd,"slug");
  const name = v(fd,"name");
  const { data, error } = await supabase.from("products").insert({
    slug,
    name,
    description: v(fd,"description") || null,
    category_id: v(fd,"category_id") || null,
    gender: v(fd,"gender") || "kadin",
    product_type: v(fd,"product_type") || null,
    base_price: num(fd,"base_price"),
    compare_at_price: num(fd,"compare_at_price"),
    currency: "TRY",
    is_active: fd.get("is_active") === "on",
    is_featured: fd.get("is_featured") === "on",
  }).select("id").single();
  if (error) redirect("/yonetim/urunler/yeni?error=" + encodeURIComponent(error.message));

  try {
    await uploadProductFiles(supabase, data.id, fd.getAll("images").filter((item): item is File => item instanceof File), name);
  } catch (uploadError) {
    await supabase.from("products").delete().eq("id",data.id);
    const message = uploadError instanceof Error ? uploadError.message : "Görsel yüklenemedi.";
    redirect("/yonetim/urunler/yeni?error=" + encodeURIComponent(message));
  }

  await audit("create", "product", data.id, { slug });
  revalidatePath("/yonetim/urunler"); revalidatePath("/kadin"); revalidatePath("/erkek");
  redirect(`/yonetim/urunler/${data.id}?created=1`);
}

export async function updateProduct(fd: FormData) {
  const { supabase } = await requireAdmin();
  const id = v(fd,"id");
  const { error } = await supabase.from("products").update({
    slug: v(fd,"slug"),
    name: v(fd,"name"),
    description: v(fd,"description") || null,
    category_id: v(fd,"category_id") || null,
    gender: v(fd,"gender") || "kadin",
    product_type: v(fd,"product_type") || null,
    base_price: num(fd,"base_price"),
    compare_at_price: num(fd,"compare_at_price"),
    is_active: fd.get("is_active") === "on",
    is_featured: fd.get("is_featured") === "on",
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) redirect(`/yonetim/urunler/${id}?error=` + encodeURIComponent(error.message));
  await audit("update", "product", id);
  revalidatePath("/yonetim/urunler"); revalidatePath(`/yonetim/urunler/${id}`); revalidatePath("/kadin"); revalidatePath("/erkek");
}

function storagePathFromPublicUrl(url: string) {
  const marker="/storage/v1/object/public/product-media/";
  const index=url.indexOf(marker);
  if(index<0) return null;
  return decodeURIComponent(url.slice(index+marker.length));
}

export async function deleteProduct(fd: FormData) {
  const { supabase } = await requireAdmin();
  const id=v(fd,"id");
  const { data: images }=await supabase.from("product_images").select("url").eq("product_id",id);
  const storagePaths=(images||[]).map(image=>storagePathFromPublicUrl(image.url)).filter((path):path is string=>Boolean(path));
  if(storagePaths.length) await supabase.storage.from("product-media").remove(storagePaths);
  const { error } = await supabase.from("products").delete().eq("id",id);
  if (error) redirect("/yonetim/urunler?error="+encodeURIComponent(error.message));
  await audit("delete","product",id); revalidatePath("/yonetim/urunler");
}

export async function updateOrderStatus(fd: FormData) {
  const { supabase } = await requireAdmin(); const id=v(fd,"id"), status=v(fd,"status");
  const { error } = await supabase.from("orders").update({status,updated_at:new Date().toISOString()}).eq("id",id);
  if (error) redirect("/yonetim/siparisler?error="+encodeURIComponent(error.message));
  await audit("status_change","order",id,{status}); revalidatePath("/yonetim/siparisler");
}

export async function setUserRole(fd: FormData) {
  const { supabase } = await requireAdmin(); const id=v(fd,"id"), role=v(fd,"role");
  if (!['customer','admin'].includes(role)) return;
  await supabase.from("profiles").update({role,updated_at:new Date().toISOString()}).eq("id",id);
  await audit("role_change","profile",id,{role}); revalidatePath("/yonetim/kullanicilar");
}

export async function saveIntegration(fd: FormData) {
  const { supabase, user } = await requireAdmin(); const provider=v(fd,"provider");
  const publicConfig = { note: v(fd,"note") };
  await supabase.from("integration_settings").upsert({provider,is_enabled:fd.get("is_enabled")==="on",status:v(fd,"status")||"not_configured",public_config:publicConfig,updated_by:user.id,updated_at:new Date().toISOString()});
  await audit("update","integration",provider); revalidatePath("/yonetim/entegrasyonlar");
}

export async function createPost(fd: FormData) {
  const { supabase, user } = await requireAdmin(); const status=v(fd,"status")||"draft";
  const { data, error } = await supabase.from("blog_posts").insert({slug:v(fd,"slug"),title:v(fd,"title"),excerpt:v(fd,"excerpt")||null,content:v(fd,"content"),cover_image:v(fd,"cover_image")||null,seo_title:v(fd,"seo_title")||null,seo_description:v(fd,"seo_description")||null,status,published_at:status==='published'?new Date().toISOString():null,author_id:user.id}).select("id").single();
  if(error) redirect("/yonetim/blog?error="+encodeURIComponent(error.message));
  await audit("create","blog_post",data.id); revalidatePath("/blog"); revalidatePath("/yonetim/blog");
}

export async function togglePostStatus(fd: FormData) {
  const { supabase } = await requireAdmin(); const id=v(fd,"id"), status=v(fd,"status");
  await supabase.from("blog_posts").update({status,published_at:status==='published'?new Date().toISOString():null,updated_at:new Date().toISOString()}).eq("id",id);
  await audit("status_change","blog_post",id,{status}); revalidatePath("/blog"); revalidatePath("/yonetim/blog");
}

export async function saveSiteSetting(fd: FormData) {
  const { supabase, user } = await requireAdmin(); const key=v(fd,"key");
  let value: Record<string,unknown>={};
  try { value=JSON.parse(v(fd,"value")); } catch { redirect("/yonetim/ayarlar?error="+encodeURIComponent("Geçersiz JSON")); }
  await supabase.from("site_settings").upsert({key,value,updated_by:user.id,updated_at:new Date().toISOString()});
  await audit("update","site_setting",key); revalidatePath("/yonetim/ayarlar");
}

export async function createVariant(fd: FormData) {
  const { supabase } = await requireAdmin();
  const productId=v(fd,"product_id");
  const { data, error } = await supabase.from("product_variants").insert({product_id:productId,sku:v(fd,"sku")||null,color:v(fd,"color")||null,size:v(fd,"size")||null,price:num(fd,"price"),is_active:fd.get("is_active")==="on"}).select("id").single();
  if(error) redirect(`/yonetim/urunler/${productId}?error=`+encodeURIComponent(error.message));
  await supabase.from("inventory").upsert({variant_id:data.id,stock:Number(v(fd,"stock")||0),reserved:0});
  await audit("create","variant",data.id,{productId}); revalidatePath(`/yonetim/urunler/${productId}`);
}

export async function updateVariant(fd: FormData) {
  const { supabase } = await requireAdmin(); const productId=v(fd,"product_id"), id=v(fd,"id");
  const { error }=await supabase.from("product_variants").update({sku:v(fd,"sku")||null,color:v(fd,"color")||null,size:v(fd,"size")||null,price:num(fd,"price"),is_active:fd.get("is_active")==="on"}).eq("id",id);
  if(error) redirect(`/yonetim/urunler/${productId}?error=`+encodeURIComponent(error.message));
  await supabase.from("inventory").upsert({variant_id:id,stock:Number(v(fd,"stock")||0),reserved:Number(v(fd,"reserved")||0),updated_at:new Date().toISOString()});
  await audit("update","variant",id); revalidatePath(`/yonetim/urunler/${productId}`);
}

export async function deleteVariant(fd: FormData) {
  const { supabase }=await requireAdmin(); const productId=v(fd,"product_id"), id=v(fd,"id");
  await supabase.from("product_variants").delete().eq("id",id); await audit("delete","variant",id); revalidatePath(`/yonetim/urunler/${productId}`);
}

export async function addProductImages(fd: FormData) {
  const { supabase }=await requireAdmin();
  const productId=v(fd,"product_id");
  const altText=v(fd,"alt_text");
  const files=fd.getAll("images").filter((item): item is File => item instanceof File && item.size>0);
  if(!files.length) redirect(`/yonetim/urunler/${productId}?error=`+encodeURIComponent("En az bir görsel seçin."));

  const { data: existing } = await supabase.from("product_images").select("sort_order").eq("product_id",productId).order("sort_order",{ascending:false}).limit(1);
  const offset = Number(existing?.[0]?.sort_order ?? -1) + 1;

  try {
    const allowedTypes=["image/png","image/jpeg","image/webp","image/avif"];
    for (const [index,file] of files.slice(0,8).entries()) {
      if(!allowedTypes.includes(file.type)) throw new Error("Desteklenmeyen görsel formatı.");
      if(file.size>8*1024*1024) throw new Error("Her görsel en fazla 8 MB olabilir.");
      const ext=(file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g,"");
      const path=`${productId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const { error: uploadError }=await supabase.storage.from("product-media").upload(path,file,{contentType:file.type||undefined,upsert:false});
      if(uploadError) throw uploadError;
      const url=supabase.storage.from("product-media").getPublicUrl(path).data.publicUrl;
      const { data, error }=await supabase.from("product_images").insert({product_id:productId,url,alt_text:altText||null,sort_order:offset+index}).select("id").single();
      if(error) throw error;
      await audit("create","product_image",data.id,{productId});
    }
  } catch (uploadError) {
    const message=uploadError instanceof Error?uploadError.message:"Görsel yüklenemedi.";
    redirect(`/yonetim/urunler/${productId}?error=`+encodeURIComponent(message));
  }

  revalidatePath(`/yonetim/urunler/${productId}`);
  revalidatePath("/yonetim/urunler");
}

export async function deleteProductImage(fd: FormData) {
  const { supabase }=await requireAdmin();
  const productId=v(fd,"product_id"), id=v(fd,"id");
  const { data:image }=await supabase.from("product_images").select("url").eq("id",id).maybeSingle();
  const storagePath=image?.url?storagePathFromPublicUrl(image.url):null;
  if(storagePath) await supabase.storage.from("product-media").remove([storagePath]);
  const { error }=await supabase.from("product_images").delete().eq("id",id);
  if(error) redirect(`/yonetim/urunler/${productId}?error=`+encodeURIComponent(error.message));
  await audit("delete","product_image",id);
  revalidatePath(`/yonetim/urunler/${productId}`);
  revalidatePath("/yonetim/urunler");
}

export async function createCategory(fd: FormData) {
  const { supabase }=await requireAdmin();
  const {data,error}=await supabase.from("categories").insert({name:v(fd,"name"),slug:v(fd,"slug"),sort_order:Number(v(fd,"sort_order")||0),is_active:fd.get("is_active")==="on"}).select("id").single();
  if(error) redirect("/yonetim/urunler?error="+encodeURIComponent(error.message));
  await audit("create","category",data.id); revalidatePath("/yonetim/urunler");
}

export async function saveShipment(fd: FormData) {
  const { supabase }=await requireAdmin(); const orderId=v(fd,"order_id");
  const existing=await supabase.from("shipments").select("id").eq("order_id",orderId).order("created_at",{ascending:false}).limit(1).maybeSingle();
  const payload={order_id:orderId,provider:v(fd,"provider")||"BasitKargo",tracking_code:v(fd,"tracking_code")||null,tracking_url:v(fd,"tracking_url")||null,status:v(fd,"status")||"pending",updated_at:new Date().toISOString()};
  if(existing.data?.id) await supabase.from("shipments").update(payload).eq("id",existing.data.id); else await supabase.from("shipments").insert(payload);
  await audit("update","shipment",orderId,payload); revalidatePath(`/yonetim/siparisler/${orderId}`); revalidatePath(`/hesabim/siparis/${orderId}`);
}

export async function saveInvoice(fd: FormData) {
  const { supabase }=await requireAdmin(); const orderId=v(fd,"order_id");
  const existing=await supabase.from("invoices").select("id").eq("order_id",orderId).order("created_at",{ascending:false}).limit(1).maybeSingle();
  const payload={order_id:orderId,provider:v(fd,"provider")||"NES Portal",invoice_no:v(fd,"invoice_no")||null,status:v(fd,"status")||"pending",updated_at:new Date().toISOString()};
  if(existing.data?.id) await supabase.from("invoices").update(payload).eq("id",existing.data.id); else await supabase.from("invoices").insert(payload);
  await audit("update","invoice",orderId,payload); revalidatePath(`/yonetim/siparisler/${orderId}`); revalidatePath(`/hesabim/siparis/${orderId}`);
}

export async function savePaymentRecord(fd: FormData) {
  const { supabase }=await requireAdmin(); const orderId=v(fd,"order_id");
  const existing=await supabase.from("payments").select("id").eq("order_id",orderId).order("created_at",{ascending:false}).limit(1).maybeSingle();
  const payload={order_id:orderId,provider:v(fd,"provider")||"manual",provider_reference:v(fd,"provider_reference")||null,amount:Number(v(fd,"amount")||0),status:v(fd,"status")||"pending",updated_at:new Date().toISOString()};
  if(existing.data?.id) await supabase.from("payments").update(payload).eq("id",existing.data.id); else await supabase.from("payments").insert(payload);
  await supabase.from("orders").update({payment_status:payload.status,updated_at:new Date().toISOString()}).eq("id",orderId);
  await audit("update","payment",orderId,payload); revalidatePath(`/yonetim/siparisler/${orderId}`); revalidatePath(`/hesabim/siparis/${orderId}`);
}

export async function updatePost(fd: FormData) {
  const { supabase }=await requireAdmin(); const id=v(fd,"id"), status=v(fd,"status")||"draft";
  const { error }=await supabase.from("blog_posts").update({slug:v(fd,"slug"),title:v(fd,"title"),excerpt:v(fd,"excerpt")||null,content:v(fd,"content"),cover_image:v(fd,"cover_image")||null,seo_title:v(fd,"seo_title")||null,seo_description:v(fd,"seo_description")||null,status,published_at:status==='published'?(v(fd,"published_at")||new Date().toISOString()):null,updated_at:new Date().toISOString()}).eq("id",id);
  if(error) redirect(`/yonetim/blog/${id}?error=`+encodeURIComponent(error.message));
  await audit("update","blog_post",id); revalidatePath("/blog"); revalidatePath(`/yonetim/blog/${id}`);
}

export async function deletePost(fd: FormData) {
  const { supabase }=await requireAdmin(); const id=v(fd,"id");
  await supabase.from("blog_posts").delete().eq("id",id); await audit("delete","blog_post",id); revalidatePath("/blog"); redirect("/yonetim/blog");
}

export async function updateContactStatus(fd: FormData) {
  const { supabase }=await requireAdmin(); const id=v(fd,"id"), status=v(fd,"status");
  await supabase.from("contact_messages").update({status,updated_at:new Date().toISOString()}).eq("id",id);
  await audit("status_change","contact_message",id,{status}); revalidatePath("/yonetim/mesajlar");
}

export async function toggleSubscriber(fd: FormData) {
  const { supabase }=await requireAdmin(); const id=v(fd,"id"), active=v(fd,"active")==="true";
  await supabase.from("newsletter_subscribers").update({is_active:active,updated_at:new Date().toISOString()}).eq("id",id);
  await audit("update","newsletter_subscriber",id,{active}); revalidatePath("/yonetim/mesajlar");
}

export async function saveSeoSettings(fd: FormData) {
  const { supabase, user }=await requireAdmin();
  const value={siteName:v(fd,"site_name")||"Elmas Triko",defaultTitle:v(fd,"default_title"),defaultDescription:v(fd,"default_description")};
  await supabase.from("site_settings").upsert({key:"seo",value,updated_by:user.id,updated_at:new Date().toISOString()});
  await audit("update","site_setting","seo",value); revalidatePath("/", "layout"); revalidatePath("/yonetim/ayarlar");
}

export async function saveContactSettings(fd: FormData) {
  const { supabase, user }=await requireAdmin();
  const value={email:v(fd,"email"),phone:v(fd,"phone"),whatsapp:v(fd,"whatsapp"),instagram:v(fd,"instagram")};
  await supabase.from("site_settings").upsert({key:"contact",value,updated_by:user.id,updated_at:new Date().toISOString()});
  await audit("update","site_setting","contact",value); revalidatePath("/yonetim/ayarlar"); revalidatePath("/iletisim");
}
