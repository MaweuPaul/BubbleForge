'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './ComponentForm.module.css';
import { API_URL } from '@/lib/api';

interface ComponentData {
  id?: string;
  category: string;
  name: string;
  description: string;
  access: string;
  bubbleJson?: any;
}

interface Props {
  initialData?: ComponentData;
  isEdit?: boolean;
}

const CATEGORIES = ['UI', 'Layout', 'Form', 'Marketing', 'Buttons', 'Cards', 'Navbars', 'Inputs', 'Modals', 'Tables'];

export default function ComponentForm({ initialData, isEdit }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    id:          initialData?.id          || '',
    category:    initialData?.category    || 'UI',
    name:        initialData?.name        || '',
    description: initialData?.description || '',
    access:      initialData?.access      || 'Free',
    bubbleJson:  initialData?.bubbleJson
      ? JSON.stringify(initialData.bubbleJson, null, 2)
      : '{\n  \n}',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let parsedJson: unknown = {};
      try {
        parsedJson = JSON.parse(formData.bubbleJson);
      } catch {
        throw new Error('Bubble JSON is not valid — please check the syntax.');
      }

      const payload = {
        id:          formData.id,
        category:    formData.category,
        name:        formData.name,
        description: formData.description,
        access:      formData.access,
        bubbleJson:  parsedJson,
      };

      const url    = isEdit ? `${API_URL}/components/${formData.id}` : `${API_URL}/components`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as any).error || `Server error (${res.status})`);
      }

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {error && (
        <div className={styles.error}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      {/* Identity */}
      <div className={styles.section}>
        <p className={styles.sectionTitle}>Identity</p>

        {!isEdit && (
          <div className={styles.formGroup}>
            <label htmlFor="id" className={styles.label}>Component ID</label>
            <input
              type="text" id="id" name="id"
              value={formData.id} onChange={handleChange}
              required placeholder="e.g. btn-primary-solid"
            />
            <span className={styles.hint}>Unique slug — cannot be changed after creation.</span>
          </div>
        )}

        <div className={styles.formGroup}>
          <label htmlFor="name" className={styles.label}>Name</label>
          <input
            type="text" id="name" name="name"
            value={formData.name} onChange={handleChange}
            required placeholder="e.g. Solid Primary Button"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="description" className={styles.label}>Description</label>
          <textarea
            id="description" name="description"
            value={formData.description} onChange={handleChange}
            required rows={3}
            placeholder="What does this component look or behave like?"
          />
        </div>
      </div>

      {/* Classification */}
      <div className={styles.section}>
        <p className={styles.sectionTitle}>Classification</p>
        <div className={styles.row}>
          <div className={styles.formGroup} style={{ margin: 0 }}>
            <label htmlFor="category" className={styles.label}>Category</label>
            <select id="category" name="category" value={formData.category} onChange={handleChange}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className={styles.formGroup} style={{ margin: 0 }}>
            <label htmlFor="access" className={styles.label}>Access Level</label>
            <select id="access" name="access" value={formData.access} onChange={handleChange}>
              <option value="Free">Free</option>
              <option value="Premium">Premium</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payload */}
      <div className={styles.section}>
        <p className={styles.sectionTitle}>Bubble JSON Payload</p>
        <div className={styles.formGroup} style={{ margin: 0 }}>
          <textarea
            id="bubbleJson" name="bubbleJson"
            value={formData.bubbleJson} onChange={handleChange}
            required rows={12}
            className={styles.jsonEditor}
            placeholder="{}"
            spellCheck={false}
          />
          <span className={styles.hint}>Must be valid JSON. This is the serialized Bubble component definition.</span>
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button type="button" onClick={() => router.back()} className="btn btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <span className={styles.spinner} /> : null}
          {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Component'}
        </button>
      </div>
    </form>
  );
}
