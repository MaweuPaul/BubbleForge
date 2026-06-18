/* eslint-disable */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './ComponentForm.module.css';
import { API_URL } from '@/lib/api';

interface Template {
  id: string;
  name: string;
  type: string;
  property_schema?: Record<string, any>;
}

interface ComponentData {
  id?: string;
  category: string;
  name: string;
  description: string;
  access: string;
  template_id?: string;
  property_values?: Record<string, any>;
  bubbleJson?: any; 
}

interface Props {
  initialData?: ComponentData;
  isEdit?: boolean;
}

const CATEGORIES = ['UI', 'Layout', 'Form', 'Marketing', 'Buttons', 'Cards', 'Navbars', 'Inputs', 'Modals', 'Tables'];

function toColorInputValue(color: any) {
  if (typeof color !== 'string') return '#ea580c';
  if (/^#[0-9a-fA-F]{6}$/.test(color)) return color.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(color)) {
    const match = color.match(/#(.)(.)(.)/);
    if (match) {
      const [, r, g, b] = match;
      return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
    }
  }
  return '#ea580c';
}

export default function ComponentForm({ initialData, isEdit }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [templates, setTemplates] = useState<Template[]>([]);
  const [activeSchema, setActiveSchema] = useState<Record<string, any> | null>(null);

  const [formData, setFormData] = useState({
    id:              initialData?.id              || '',
    category:        initialData?.category        || 'UI',
    name:            initialData?.name            || '',
    description:     initialData?.description     || '',
    access:          initialData?.access          || 'Free',
    template_id:     initialData?.template_id     || '',
    property_values: initialData?.property_values || {} as Record<string, any>,
    bubbleJson:      initialData?.bubbleJson
      ? JSON.stringify(initialData.bubbleJson, null, 2)
      : '',
  });

  // Fetch templates list on mount
  useEffect(() => {
    fetch(`${API_URL}/templates`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setTemplates(data);
      })
      .catch(err => console.error("Failed to load templates", err));
  }, []);

  // Fetch schema when template_id changes
  useEffect(() => {
    if (!formData.template_id) {
      setActiveSchema(null);
      return;
    }
    fetch(`${API_URL}/templates/${formData.template_id}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.property_schema) {
          setActiveSchema(data.property_schema);

          // Initialize missing property values with defaults from schema
          setFormData(prev => {
            const nextVals = { ...prev.property_values };
            let changed = false;
            for (const [key, def] of Object.entries(data.property_schema)) {
              const d = def as any;
              if (nextVals[key] === undefined && d.default !== undefined) {
                nextVals[key] = d.default;
                changed = true;
              }
            }
            if (changed) return { ...prev, property_values: nextVals };
            return prev;
          });
        }
      })
      .catch(err => console.error("Failed to load schema", err));
  }, [formData.template_id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePropChange = (key: string, value: any, type: string) => {
    let parsedVal = value;
    if (type === 'number') {
      parsedVal = parseFloat(value);
      if (isNaN(parsedVal)) parsedVal = 0;
    }
    setFormData(prev => ({
      ...prev,
      property_values: {
        ...prev.property_values,
        [key]: parsedVal
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let parsedJson: any = null;
      if (!formData.template_id && formData.bubbleJson) {
        try {
          parsedJson = JSON.parse(formData.bubbleJson);
        } catch {
          throw new Error('Bubble JSON is not valid — please check the syntax.');
        }
      }

      const payload = {
        id:              formData.id,
        category:        formData.category,
        name:            formData.name,
        description:     formData.description,
        access:          formData.access,
        template_id:     formData.template_id || null,
        property_values: formData.property_values,
        bubbleJson:      parsedJson,
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

      {/* Architecture */}
      <div className={styles.section}>
        <p className={styles.sectionTitle}>Architecture</p>
        <div className={styles.formGroup}>
          <label htmlFor="template_id" className={styles.label}>Template (Compiler Base)</label>
          <select id="template_id" name="template_id" value={formData.template_id} onChange={handleChange}>
            <option value="">-- Legacy Raw JSON (No Template) --</option>
            {templates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.type})</option>)}
          </select>
        </div>

        {!formData.template_id && (
          <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
            <label htmlFor="bubbleJson" className={styles.label}>Bubble JSON Payload (Legacy)</label>
            <textarea
              id="bubbleJson" name="bubbleJson"
              value={formData.bubbleJson} onChange={handleChange}
              rows={12}
              className={styles.jsonEditor}
              placeholder="{}"
              spellCheck={false}
            />
            <span className={styles.hint}>Raw JSON for components that haven&apos;t been migrated to the template system yet.</span>
          </div>
        )}
      </div>

      {/* Dynamic Properties */}
      {formData.template_id && activeSchema && (
        <div className={styles.section}>
          <p className={styles.sectionTitle}>Template Properties</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {Object.entries(activeSchema).map(([key, schemaDef]) => {
              const s = schemaDef as any;
              const val = formData.property_values[key] ?? s.default ?? '';

              return (
                <div key={key} className={styles.formGroup} style={{ margin: 0 }}>
                  <label htmlFor={`prop_${key}`} className={styles.label} style={{ textTransform: 'capitalize' }}>
                    {key.replace(/_/g, ' ')}
                  </label>
                  
                  {s.type === 'string' && (
                    <input
                      type="text" id={`prop_${key}`}
                      value={val} onChange={(e) => handlePropChange(key, e.target.value, s.type)}
                      placeholder={s.default}
                    />
                  )}
                  
                  {s.type === 'number' && (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="number" id={`prop_${key}`}
                        value={val} onChange={(e) => handlePropChange(key, e.target.value, s.type)}
                        style={{ width: '80px' }}
                      />
                      <input 
                        type="range" min="0" max="1000" 
                        value={val} onChange={(e) => handlePropChange(key, e.target.value, s.type)} 
                        style={{ flex: 1 }}
                      />
                    </div>
                  )}
                  
                  {s.type === 'color' && (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="color" id={`prop_${key}`}
                        value={toColorInputValue(val)} 
                        onChange={(e) => handlePropChange(key, e.target.value, s.type)}
                        style={{ width: '40px', height: '40px', padding: '0', border: 'none', borderRadius: '4px' }}
                      />
                      <input
                        type="text" value={val} 
                        onChange={(e) => handlePropChange(key, e.target.value, 'string')}
                        style={{ flex: 1 }}
                      />
                    </div>
                  )}

                  {s.type === 'select' && (
                    <select
                      id={`prop_${key}`} value={val}
                      onChange={(e) => handlePropChange(key, e.target.value, s.type)}
                    >
                      {s.options?.map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

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
