import ComponentForm from '@/components/ComponentForm';
import Link from 'next/link';

export const metadata = { title: 'New Component' };

export default function NewComponentPage() {
  return (
    <div className="animate-up">
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/" className="btn btn-secondary" style={{ display: 'inline-flex', marginBottom: '1.25rem' }}>
          ← Back to Library
        </Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>New Component</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Add a new Bubble UI component to the library.
        </p>
      </div>
      <ComponentForm />
    </div>
  );
}
