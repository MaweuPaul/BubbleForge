import ComponentForm from '@/components/ComponentForm';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { API_URL } from '@/lib/api';

async function getComponent(id: string) {
  try {
    const res = await fetch(`${API_URL}/components/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function EditComponentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const component = await getComponent(id);

  if (!component) {
    notFound();
  }

  return (
    <div className="animate-up">
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/" className="btn btn-secondary" style={{ display: 'inline-flex', marginBottom: '1.25rem' }}>
          ← Back to Library
        </Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>Edit Component</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Editing <strong>{component.name}</strong> · <code style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{component.id}</code>
        </p>
      </div>
      <ComponentForm initialData={component} isEdit={true} />
    </div>
  );
}
