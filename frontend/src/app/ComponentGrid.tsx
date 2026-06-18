'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Component } from './page';
import styles from './page.module.css';

// ── Category accent colours ─────────────────────────────
const CAT_COLOR: Record<string, string> = {
  Buttons:   '#f97316',
  UI:        '#f97316',
  Layout:    '#3b82f6',
  Navbars:   '#06b6d4',
  Form:      '#8b5cf6',
  Inputs:    '#8b5cf6',
  Modals:    '#ec4899',
  Cards:     '#e11d48',
  Marketing: '#22c55e',
  Tables:    '#14b8a6',
  Default:   '#64748b',
};

// ── Build a live-preview snippet from component metadata ─
function buildPreviewHTML(comp: Component): string {
  const cat = comp.category;
  const name = comp.name;

  const baseStyles = `
    *{box-sizing:border-box;margin:0;padding:0}
    body{
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
      background:#f8fafc;
      display:flex;align-items:center;justify-content:center;
      min-height:100vh;padding:16px;
    }
  `;

  if (cat === 'Buttons' || cat === 'UI') {
    const isOutline  = /outline/i.test(name);
    const isGhost    = /ghost/i.test(name);
    const isPill     = /pill/i.test(name);
    const isSoft     = /soft/i.test(name);
    const isDestructive = /destructive|danger|delete/i.test(name);
    const isFAB      = /fab|floating/i.test(name);
    const isIcon     = /icon/i.test(name) && !isFAB;

    const radius = isPill ? '999px' : isFAB ? '50%' : '8px';
    const bg = isDestructive ? '#ef4444' : isGhost || isOutline || isSoft ? 'transparent' : '#f97316';
    const border = isOutline ? '2px solid #f97316' : isGhost ? 'none' : isDestructive ? '2px solid #ef4444' : isSoft ? 'none' : 'none';
    const color = isGhost || isOutline ? '#f97316' : isDestructive ? '#fff' : isSoft ? '#f97316' : '#fff';
    const softBg = isSoft ? 'rgba(249,115,22,0.12)' : '';
    const pad = isFAB ? '0' : isIcon ? '10px' : '10px 22px';
    const wh  = isFAB || isIcon ? 'width:48px;height:48px;' : '';

    const label = isFAB ? '⚡' : isIcon ? '✦' : name.replace(/ button/i, '').trim();
    const shadow = !isGhost && !isSoft && !isOutline ? '0 4px 14px rgba(249,115,22,0.35)' : 'none';

    return `<html><head><style>
      ${baseStyles}
      .wrap{display:flex;gap:12px;align-items:center;flex-wrap:wrap;justify-content:center}
      .btn{
        display:inline-flex;align-items:center;justify-content:center;gap:8px;
        font-size:14px;font-weight:600;letter-spacing:-0.01em;
        padding:${pad};border-radius:${radius};
        background:${softBg || bg};border:${border};color:${color};
        box-shadow:${shadow};cursor:pointer;
        transition:all .18s ease;${wh}
      }
      .btn:hover{filter:brightness(1.1);transform:translateY(-1px);}
      .label{font-size:12px;color:#94a3b8;font-weight:500;}
    </style></head><body>
      <div class="wrap">
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
          <button class="btn">${label}</button>
          <span class="label">${name}</span>
        </div>
      </div>
    </body></html>`;
  }

  if (cat === 'Navbars') {
    return `<html><head><style>
      ${baseStyles}
      body{padding:0;align-items:flex-start;background:#fff;}
      nav{
        width:100%;background:#fff;border-bottom:1px solid #e2e8f0;
        padding:0 20px;height:52px;
        display:flex;align-items:center;justify-content:space-between;
      }
      .logo{font-weight:800;font-size:15px;letter-spacing:-0.03em;color:#0f172a;}
      .logo span{color:#f97316;}
      .links{display:flex;gap:20px;}
      .link{font-size:13px;font-weight:500;color:#475569;cursor:pointer;}
      .link.active{color:#0f172a;font-weight:600;}
      .cta{
        background:#f97316;color:#fff;font-size:12.5px;font-weight:600;
        padding:7px 16px;border-radius:7px;border:none;cursor:pointer;
      }
    </style></head><body>
      <nav>
        <div class="logo">Bubble<span>Forge</span></div>
        <div class="links">
          <span class="link active">Home</span>
          <span class="link">Docs</span>
          <span class="link">Pricing</span>
        </div>
        <button class="cta">Get Started</button>
      </nav>
    </body></html>`;
  }

  if (cat === 'Cards' || cat === 'Modals') {
    return `<html><head><style>
      ${baseStyles}
      body{background:#f1f5f9;}
      .card{
        background:#fff;border:1px solid #e2e8f0;border-radius:14px;
        padding:20px;max-width:240px;width:100%;
        box-shadow:0 4px 16px rgba(0,0,0,0.08);
      }
      .avatar{
        width:40px;height:40px;border-radius:10px;
        background:linear-gradient(135deg,#f97316,#ea580c);
        display:flex;align-items:center;justify-content:center;
        font-size:18px;margin-bottom:14px;
      }
      .title{font-size:14px;font-weight:700;color:#0f172a;margin-bottom:5px;letter-spacing:-0.02em;}
      .desc{font-size:12px;color:#64748b;line-height:1.6;margin-bottom:14px;}
      .btn{
        background:#f97316;color:#fff;font-size:12px;font-weight:600;
        padding:8px 16px;border-radius:7px;border:none;cursor:pointer;width:100%;
      }
    </style></head><body>
      <div class="card">
        <div class="avatar">⚡</div>
        <div class="title">${name}</div>
        <div class="desc">A clean, modern component built for Bubble applications.</div>
        <button class="btn">Learn More</button>
      </div>
    </body></html>`;
  }

  if (cat === 'Form' || cat === 'Inputs') {
    return `<html><head><style>
      ${baseStyles}
      body{background:#f8fafc;}
      .form{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;max-width:260px;width:100%;box-shadow:0 2px 8px rgba(0,0,0,0.06);}
      label{display:block;font-size:11.5px;font-weight:600;color:#374151;margin-bottom:5px;letter-spacing:-0.01em;}
      input{
        width:100%;padding:9px 12px;border:1.5px solid #e2e8f0;border-radius:7px;
        font-size:13px;color:#0f172a;outline:none;font-family:inherit;
        transition:border .15s;
      }
      input:focus{border-color:#f97316;box-shadow:0 0 0 3px rgba(249,115,22,0.12);}
      .row{display:flex;flex-direction:column;gap:12px;}
      .btn{
        background:#f97316;color:#fff;font-size:13px;font-weight:600;
        padding:9px;border-radius:7px;border:none;cursor:pointer;width:100%;margin-top:4px;
      }
    </style></head><body>
      <div class="form">
        <div class="row">
          <div>
            <label>Email</label>
            <input type="email" placeholder="you@example.com" />
          </div>
          <div>
            <label>Password</label>
            <input type="password" placeholder="••••••••" />
          </div>
          <button class="btn">Sign In</button>
        </div>
      </div>
    </body></html>`;
  }

  if (cat === 'Tables') {
    return `<html><head><style>
      ${baseStyles}
      body{background:#f8fafc;padding:16px;align-items:flex-start;}
      table{width:100%;border-collapse:collapse;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.07);}
      th{background:#f8fafc;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.05em;padding:9px 12px;text-align:left;border-bottom:1px solid #e2e8f0;}
      td{font-size:12.5px;color:#0f172a;padding:9px 12px;border-bottom:1px solid #f1f5f9;}
      tr:last-child td{border-bottom:none;}
      .badge{display:inline-flex;padding:2px 8px;border-radius:999px;font-size:10.5px;font-weight:600;}
      .free{background:#dcfce7;color:#166534;}
      .pro{background:#fef9c3;color:#854d0e;}
    </style></head><body>
      <table>
        <tr><th>Name</th><th>Category</th><th>Access</th></tr>
        <tr><td>Solid Button</td><td>Buttons</td><td><span class="badge free">Free</span></td></tr>
        <tr><td>Nav Bar</td><td>Navbars</td><td><span class="badge pro">Pro</span></td></tr>
        <tr><td>Auth Form</td><td>Form</td><td><span class="badge free">Free</span></td></tr>
      </table>
    </body></html>`;
  }

  if (cat === 'Layout') {
    return `<html><head><style>
      ${baseStyles}
      body{background:#f1f5f9;padding:16px;align-items:flex-start;}
      .shell{display:flex;gap:10px;width:100%;}
      .side{width:56px;background:#0c0c0f;border-radius:10px;min-height:120px;padding:10px 0;display:flex;flex-direction:column;align-items:center;gap:8px;}
      .dot{width:22px;height:22px;border-radius:6px;background:rgba(255,255,255,0.08);}
      .dot.active{background:rgba(249,115,22,0.3);}
      .main{flex:1;display:flex;flex-direction:column;gap:8px;}
      .bar{height:28px;background:#fff;border-radius:7px;border:1px solid #e2e8f0;}
      .row{display:flex;gap:8px;}
      .block{height:60px;background:#fff;border-radius:7px;border:1px solid #e2e8f0;flex:1;}
    </style></head><body>
      <div class="shell">
        <div class="side"><div class="dot active"></div><div class="dot"></div><div class="dot"></div></div>
        <div class="main">
          <div class="bar"></div>
          <div class="row"><div class="block"></div><div class="block"></div></div>
        </div>
      </div>
    </body></html>`;
  }

  if (cat === 'Marketing') {
    return `<html><head><style>
      ${baseStyles}
      body{background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:24px;}
      .hero{text-align:center;max-width:260px;}
      .badge{display:inline-flex;background:rgba(249,115,22,0.2);color:#fb923c;font-size:11px;font-weight:700;padding:4px 12px;border-radius:999px;border:1px solid rgba(249,115,22,0.3);margin-bottom:14px;letter-spacing:.04em;}
      h1{font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.03em;line-height:1.2;margin-bottom:10px;}
      p{font-size:12px;color:#94a3b8;line-height:1.6;margin-bottom:16px;}
      .btn{background:#f97316;color:#fff;font-size:13px;font-weight:600;padding:10px 24px;border-radius:8px;border:none;cursor:pointer;box-shadow:0 4px 14px rgba(249,115,22,0.4);}
    </style></head><body>
      <div class="hero">
        <div class="badge">NEW</div>
        <h1>Build Faster with AI</h1>
        <p>Generate beautiful Bubble components in seconds with BubbleForge.</p>
        <button class="btn">Get Started →</button>
      </div>
    </body></html>`;
  }

  // Generic fallback
  const accent = CAT_COLOR[cat] ?? CAT_COLOR.Default;
  return `<html><head><style>
    ${baseStyles}
    body{background:#f8fafc;}
    .box{
      background:#fff;border:1px solid #e2e8f0;border-radius:12px;
      padding:24px;max-width:220px;text-align:center;
      box-shadow:0 2px 8px rgba(0,0,0,0.06);
    }
    .icon{
      width:48px;height:48px;border-radius:12px;
      background:${accent}18;
      display:flex;align-items:center;justify-content:center;
      margin:0 auto 12px;font-size:22px;
    }
    .name{font-size:13px;font-weight:700;color:#0f172a;letter-spacing:-0.02em;margin-bottom:4px;}
    .cat{font-size:11px;color:#94a3b8;font-weight:500;}
  </style></head><body>
    <div class="box">
      <div class="icon">◈</div>
      <div class="name">${name}</div>
      <div class="cat">${cat}</div>
    </div>
  </body></html>`;
}

// ── Stat card ───────────────────────────────────────────
function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className={styles.stat}>
      <div className={styles.statDot} style={{ background: color }} />
      <div className={styles.statInfo}>
        <span className={styles.statValue}>{value}</span>
        <span className={styles.statLabel}>{label}</span>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────
export default function ComponentGrid({ components }: { components: Component[] }) {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [search, setSearch] = useState('');

  const categories = useMemo(() => {
    const cats = [...new Set(components.map(c => c.category))].sort();
    return ['All', ...cats];
  }, [components]);

  const filtered = useMemo(() => {
    return components.filter(c => {
      const matchesCat = activeCategory === 'All' || c.category === activeCategory;
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [components, activeCategory, search]);

  const total   = components.length;
  const premium = components.filter(c => c.access === 'Premium').length;
  const free    = total - premium;
  const cats    = categories.length - 1; // exclude 'All'

  return (
    <div className={styles.page}>

      {/* ── Page Header ── */}
      <div className={styles.header}>
        <div className={styles.heading}>
          <h1 className={styles.title}>Component Library</h1>
          <p className={styles.subtitle}>
            {total > 0
              ? `${total} component${total !== 1 ? 's' : ''} · ${cats} categor${cats !== 1 ? 'ies' : 'y'}`
              : 'No components yet — add your first one below.'}
          </p>
        </div>
        <Link href="/components/new" className="btn btn-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          New Component
        </Link>
      </div>

      {/* ── Stats Bar ── */}
      {total > 0 && (
        <div className={styles.stats}>
          <StatCard value={total}   label="Total"      color="#f97316" />
          <StatCard value={free}    label="Free"       color="#22c55e" />
          <StatCard value={premium} label="Premium"    color="#f59e0b" />
          <StatCard value={cats}    label="Categories" color="#3b82f6" />
        </div>
      )}

      {/* ── Search + Filter ── */}
      {total > 0 && (
        <div className={styles.toolbar}>
          {/* Search */}
          <div className={styles.searchWrap}>
            <svg className={styles.searchIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search components…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className={styles.searchClear} onClick={() => setSearch('')} aria-label="Clear">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>

          {/* Category filter pills */}
          <div className={styles.filters}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`${styles.filterPill} ${activeCategory === cat ? styles.filterPillActive : ''}`}
                style={activeCategory === cat && cat !== 'All'
                  ? { background: `${CAT_COLOR[cat] ?? '#f97316'}18`, borderColor: `${CAT_COLOR[cat] ?? '#f97316'}50`, color: CAT_COLOR[cat] ?? '#f97316' }
                  : undefined}
              >
                {cat}
                {cat !== 'All' && (
                  <span className={styles.pillCount}>
                    {components.filter(c => c.category === cat).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Empty State ── */}
      {total === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIconRing}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1.5"/>
              <rect x="14" y="3" width="7" height="7" rx="1.5"/>
              <rect x="3" y="14" width="7" height="7" rx="1.5"/>
              <rect x="14" y="14" width="7" height="7" rx="1.5"/>
            </svg>
          </div>
          <h2 className={styles.emptyTitle}>Library is empty</h2>
          <p className={styles.emptyDesc}>Add your first Bubble UI component to start building your library.</p>
          <Link href="/components/new" className="btn btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Create First Component
          </Link>
        </div>
      )}

      {/* ── No results state ── */}
      {total > 0 && filtered.length === 0 && (
        <div className={styles.noResults}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <p>No components match <strong>{search || activeCategory}</strong></p>
          <button className="btn btn-secondary" onClick={() => { setSearch(''); setActiveCategory('All'); }}>
            Clear filters
          </button>
        </div>
      )}

      {/* ── Grid ── */}
      {filtered.length > 0 && (
        <div className={styles.grid}>
          {filtered.map((comp, i) => {
            const accent = CAT_COLOR[comp.category] ?? CAT_COLOR.Default;
            const previewHTML = buildPreviewHTML(comp);
            return (
              <Link
                key={comp.id}
                href={`/components/${comp.id}/edit`}
                className={styles.card}
                style={{ animationDelay: `${0.03 + i * 0.025}s` }}
              >
                {/* Preview area */}
                <div className={styles.previewWrap} style={{ borderTopColor: accent }}>
                  <iframe
                    srcDoc={previewHTML}
                    className={styles.previewFrame}
                    sandbox="allow-scripts"
                    tabIndex={-1}
                    title={`Preview of ${comp.name}`}
                  />
                  <div className={styles.previewOverlay} />
                </div>

                {/* Card body */}
                <div className={styles.cardBody}>
                  <div className={styles.cardTop}>
                    <span className="badge badge-category">{comp.category}</span>
                    <span className={comp.access === 'Premium' ? 'badge badge-premium' : 'badge badge-free'}>
                      {comp.access}
                    </span>
                  </div>
                  <h3 className={styles.cardName}>{comp.name}</h3>
                  <p className={styles.cardDesc}>{comp.description}</p>
                  <div className={styles.cardFooter}>
                    <code className={styles.cardId}>{comp.id}</code>
                    <span className={styles.cardEdit} style={{ color: accent }}>
                      Edit
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
