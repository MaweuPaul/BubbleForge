import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = {
  title: { default: 'BubbleForge Admin', template: '%s · BubbleForge' },
  description: 'Manage and organize your Bubble UI component library.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          {/* Fixed sidebar */}
          <div className="sidebar-fixed">
            <Sidebar />
          </div>

          {/* Main content fills the space to the right of the sidebar */}
          <div className="main-area">
            <div className="page-content">
              {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
