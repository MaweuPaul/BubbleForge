import Link from 'next/link';
import styles from './Header.module.css';

export default function Header() {
  return (
    <header className={`${styles.header} glass-panel`}>
      <div className={`container ${styles.headerContent}`}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}></div>
          <Link href="/">BubbleForge Admin</Link>
        </div>
        <nav className={styles.nav}>
          <Link href="/" className={styles.navLink}>Dashboard</Link>
          <Link href="/components/new" className={`${styles.navLink} btn-primary`}>+ New Component</Link>
        </nav>
      </div>
    </header>
  );
}
