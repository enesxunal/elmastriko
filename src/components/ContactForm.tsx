"use client";
import { FormEvent, useState } from "react";

export default function ContactForm(){
  const [state,setState]=useState<"idle"|"loading"|"ok"|"error">("idle");
  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    setState("loading");
    const fd=new FormData(e.currentTarget);
    const body=Object.fromEntries(fd.entries());
    const r=await fetch("/api/contact",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
    setState(r.ok?"ok":"error");
    if(r.ok)e.currentTarget.reset();
  }
  return <form className="contact-form" onSubmit={submit}>
    <input name="website" className="hp-field" tabIndex={-1} autoComplete="off" aria-hidden="true"/>
    <input name="name" placeholder="Ad Soyad" maxLength={120} required/>
    <input name="email" type="email" placeholder="E-posta" maxLength={254} required/>
    <input name="phone" placeholder="Telefon" maxLength={40}/>
    <input name="subject" placeholder="Konu" maxLength={160}/>
    <textarea name="message" placeholder="Mesajınız" maxLength={5000} required/>
    <button disabled={state==="loading"}>{state==="loading"?"Gönderiliyor...":"Mesajı Gönder"}</button>
    {state==="ok"&&<p>Mesajınız alındı.</p>}
    {state==="error"&&<p>Mesaj gönderilemedi. Tekrar deneyin.</p>}
  </form>;
}
