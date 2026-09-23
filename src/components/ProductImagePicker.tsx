"use client";

import { useMemo, useRef, useState } from "react";
import { ImagePlus, UploadCloud, X } from "lucide-react";

export default function ProductImagePicker({
  name = "images",
  multiple = true,
  label = "Ürün görselleri",
}: {
  name?: string;
  multiple?: boolean;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const previews = useMemo(() => files.map(file => ({ file, url: URL.createObjectURL(file) })), [files]);

  function sync(next: File[]) {
    setFiles(next);
    const input = inputRef.current;
    if (!input) return;
    const dt = new DataTransfer();
    next.forEach(file => dt.items.add(file));
    input.files = dt.files;
  }

  function choose(fileList: FileList | null) {
    if (!fileList) return;
    const next = Array.from(fileList).filter(file => file.type.startsWith("image/"));
    sync(multiple ? next.slice(0, 8) : next.slice(0, 1));
  }

  return <div className="product-media-picker">
    <input
      ref={inputRef}
      className="product-media-input"
      type="file"
      name={name}
      accept="image/png,image/jpeg,image/webp,image/avif"
      multiple={multiple}
      onChange={event => choose(event.target.files)}
    />
    <button
      type="button"
      className="product-media-drop"
      onClick={() => inputRef.current?.click()}
      onDragOver={event => event.preventDefault()}
      onDrop={event => {
        event.preventDefault();
        choose(event.dataTransfer.files);
      }}
    >
      <UploadCloud size={24}/>
      <strong>{label}</strong>
      <span>Görselleri buraya sürükleyin veya bilgisayardan seçin</span>
      <small>JPG, PNG, WEBP veya AVIF · görsel başına en fazla 8 MB · en fazla 8 görsel</small>
    </button>
    {previews.length > 0 && <div className="product-media-preview">
      {previews.map(({file,url}, index) => <div key={file.name + file.lastModified}>
        <img src={url} alt="Seçilen ürün görseli"/>
        <button type="button" aria-label="Görseli kaldır" onClick={() => sync(files.filter((_,i)=>i!==index))}><X size={14}/></button>
        {index === 0 && <span>Kapak</span>}
      </div>)}
      {multiple && files.length < 8 && <button type="button" className="product-media-add-more" onClick={() => inputRef.current?.click()}><ImagePlus size={20}/><span>Görsel ekle</span></button>}
    </div>}
  </div>;
}
