import { API_URL } from '@/lib/api';
import ComponentGrid from './ComponentGrid';

export const dynamic = 'force-dynamic';

export interface Component {
  id: string;
  category: string;
  name: string;
  description: string;
  access: string;
  bubbleJson?: unknown;
}

async function getComponents(): Promise<Component[]> {
  try {
    const res = await fetch(`${API_URL}/components`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function Dashboard() {
  const components = await getComponents();
  return <ComponentGrid components={components} />;
}
