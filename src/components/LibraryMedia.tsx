import { Fragment, useState, type ReactNode } from "react";
import { libraryImage, libraryUrl } from "../data/library-contract.mjs";

export function PublicImage({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState("");
  if (!src || src === failed || !libraryImage(src)) return null;
  return <img className={className} src={src} alt={alt} loading="lazy"
    referrerPolicy="no-referrer" onError={() => setFailed(src)} />;
}

export function LibraryLink({ url, children }: { url?: string; children: ReactNode }) {
  if (!libraryUrl(url)) return null;
  return <a className="text-link" href={url} target="_blank" rel="noopener noreferrer">{children}</a>;
}

export function FormattedText({ text }: { text: string }) {
  return <span className="library-text">{text.split(/(\*\*[^*\n]+\*\*)/).map((part, index) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4
      ? <strong key={index}>{part.slice(2, -2)}</strong>
      : <Fragment key={index}>{part}</Fragment>,
  )}</span>;
}
