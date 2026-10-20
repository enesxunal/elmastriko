import styles from "./AgencySignature.module.css";

type AgencySignatureProps = {
  theme?: "dark" | "light";
  logoSrc?: string;
};

/** 3 Kare Ajans signature v1 — no scripts, fonts or third-party requests. */
export default function AgencySignature({ theme = "dark", logoSrc = "/brand/3kare-ajans-logo.png" }: AgencySignatureProps) {
  return (
    <div className={styles.signature} data-theme={theme}>
      <div className={styles.message}>
        <span className={styles.eyebrow}><span className={styles.squares} aria-hidden="true"><i/><i/><i/></span>TASARIM & GELİŞTİRME</span>
        <p>İyi fikirler, <span>iz bırakır.</span></p>
      </div>
      <a className={styles.credit} href="https://3kareajans.com/" target="_blank" rel="noopener noreferrer" aria-label="3 Kare Ajans — tasarım ve geliştirme. Yeni sekmede açılır.">
        <span className={styles.brand}>
          <svg className={styles.logo} viewBox="0 37 352 109" role="img" aria-label="3 Kare Ajans"><image href={logoSrc} width="491" height="168"/></svg>
          <span className={styles.domain}>3kareajans.com</span>
        </span>
        <span className={styles.arrow} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M6 18 18 6M6 6h12v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
      </a>
    </div>
  );
}
