import type { LucideIcon } from "lucide-react";
import styles from "./PublicPages.module.css";

type Props = {
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tone: "pink" | "green" | "orange" | "blue";
};

export default function PublicIntro({ label, title, description, icon: Icon, tone }: Props) {
  return (
    <section className={`${styles.intro} ${styles[tone]}`}>
      <div className={`container ${styles.introLayout}`}>
        <div>
          <p className={styles.introLabel}>{label}</p>
          <h1>{title}</h1>
          <p className={styles.introDescription}>{description}</p>
        </div>
        <div className={styles.introMark} aria-hidden="true">
          <Icon strokeWidth={1.6} />
        </div>
      </div>
    </section>
  );
}
