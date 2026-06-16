# BubbleForge

AI-powered component platform for Bubble developers.

BubbleForge helps Bubble builders create better interfaces faster by combining a high-quality component library with AI-powered component generation and customization.

If a component already exists, users can browse, preview, and insert it into Bubble. If it does not exist, BubbleForge generates it with AI, validates it, saves it, and makes it reusable.

> If it exists, use it. If it does not, generate it.

## Vision

BubbleForge is built for Bubble developers who want polished UI components without spending hours manually designing and rebuilding common interface patterns.

The goal is to create a private, production-grade component system that can eventually support:

- ready-made Bubble-compatible UI components
- AI-generated components on demand
- AI customization of existing components
- reusable personal and team component libraries
- Chrome extension-assisted Bubble insertion
- bring-your-own-key AI provider support
- backend-powered validation, caching, and versioning

This project starts with one core technical question:

Can BubbleForge reliably insert a prepared component into the Bubble editor?

Once that is proven, the rest of the platform can grow around it.

## Product Concept

BubbleForge is similar in spirit to tools like Elemium, but with an AI-native workflow.

Traditional component libraries are limited by what already exists in the library.

BubbleForge should support both:

- using existing components instantly
- generating missing components when needed

Example prompts:

- Create a Stripe-inspired pricing button
- Create a glassmorphism CTA button with hover animation
- Create a clean SaaS dashboard card
- Create a Linear-style sidebar item
- Make this button darker and more rounded
- Add an icon, loading state, and disabled state

Generated components should be saved into the user's library so they can be reused later.

## Core Features

### Component Library

Users should be able to:

- browse components
- search components
- filter by category
- preview components
- favorite components
- save custom components
- insert components into Bubble

Initial component categories:

- buttons
- badges
- inputs
- cards
- navbars
- sidebars
- pricing sections
- forms
- modals
- tabs
- tables
- dashboard widgets

### AI Component Generator

When a component does not exist, the user should be able to generate one.

The AI generator should produce:

- component name
- component description
- HTML/CSS/JS or Bubble-compatible component definition
- responsive behavior
- variants
- states such as hover, active, disabled, loading
- customization options
- preview metadata
- insertion instructions or serialized insert payload

Generated components must not be inserted blindly. They should pass validation first.

### AI Component Editor

Users should be able to select an existing component and ask AI to modify it.

Example edits:

- change colors
- adjust border radius
- add hover animation
- add dark mode
- add icon support
- create a smaller variant
- make it look more premium
- match a brand style

The editor should preserve the component's structure where possible instead of regenerating everything from scratch.

### Bubble Insertion

This is the most important technical milestone.

BubbleForge must research and validate how components can be inserted into Bubble.

Possible approaches:

- clipboard-based paste format
- Chrome extension-assisted insertion
- Bubble editor DOM automation
- reusable element import flow
- custom Bubble plugin renderer
- serialized component payloads

Phase 0 is successful when BubbleForge can insert one simple component, such as a button, into Bubble reliably.

## Architecture

Recommended high-level architecture:

```text
Web App / Chrome Extension
          |
          v
Go Backend API
          |
          +--------------------+
          |                    |
          v                    v
     PostgreSQL              Redis
          |                    |
          v                    v
 Component Store        Cache / Job Queue
          |
          v
 AI Providers + Validation Workers
```

## Tech Stack

### Backend

- Go
- PostgreSQL
- Redis
- REST API initially
- worker queue for generation jobs
- structured logging
- API key encryption
- rate limiting
- usage tracking

Possible Go frameworks:

- Gin
- Fiber
- Echo

### Frontend

- Next.js
- TypeScript
- Tailwind CSS

The web app should handle:

- authentication UI
- component browsing
- previews
- generation prompts
- AI key management
- account settings
- admin review tools

### Chrome Extension

The extension should eventually handle:

- login
- component browsing inside Bubble
- search
- preview
- copy/paste or insertion into Bubble
- Bubble editor integration

The extension should be treated as a core part of the product, not an afterthought.

## Backend Design

The backend should be designed for concurrent users from the beginning.

Expensive work should not run directly inside API requests.

Bad flow:

```text
Request -> Generate component -> Validate -> Save -> Return
```

Preferred flow:

```text
Request -> Create generation job -> Return job ID
Worker -> Generate -> Validate -> Save -> Notify user
```

This allows the system to handle many users submitting generation requests at the same time.

### Core Backend Responsibilities

- user authentication integration
- component CRUD
- component versioning
- favorites
- generation jobs
- AI provider routing
- encrypted API key storage
- prompt normalization
- cache lookup
- validation pipeline
- usage events
- admin review

## Bring Your Own Key

BubbleForge should support BYOK: Bring Your Own Key.

Users can add API keys for providers such as:

- Claude
- OpenAI
- Gemini
- Mistral
- DeepSeek

API keys must be treated as secrets.

Requirements:

- never expose raw keys to the frontend after saving
- encrypt keys before storing them
- decrypt only on the backend during provider calls
- show only masked keys in the UI
- allow users to delete or replace keys
- store key metadata such as provider and last four characters
- use HTTPS in production
- log usage events without logging secrets

Passwords should be hashed.

API keys should be encrypted because they need to be recovered later for provider requests.

Example table:

```text
ai_keys
- id
- user_id
- provider
- encrypted_key
- key_last_four
- is_active
- created_at
- updated_at
```

## Suggested Database Tables

```text
users
components
component_versions
categories
favorites
generation_jobs
ai_keys
usage_events
teams
team_members
audit_logs
```

## Component Generation Flow

```text
User prompt
    |
    v
Normalize prompt
    |
    v
Check Redis cache
    |
    +--> Cache hit: return component
    |
    v
Check PostgreSQL component store
    |
    +--> Found: cache and return component
    |
    v
Create generation job
    |
    v
Worker calls selected AI provider
    |
    v
Validate generated component
    |
    v
Render preview
    |
    v
Save component/version
    |
    v
Return result to user
```

## Validation Pipeline

Generated components should be validated before users rely on them.

Possible validation steps:

- schema validation
- HTML/CSS/JS safety checks
- responsive preview rendering
- screenshot generation
- Bubble compatibility checks
- extension insertion test
- admin review for shared/public components

Possible tooling:

- Playwright
- Chromium workers
- isolated render sandbox
- dedicated Bubble test app

## Roadmap

### Phase 0: Bubble Insertion Research

Goal:

Prove that BubbleForge can insert a prepared component into Bubble.

Tasks:

- study Bubble editor paste behavior
- inspect clipboard payloads
- test simple component insertion
- research how existing tools insert components
- document findings

Success metric:

One simple button can be inserted into Bubble reliably.

### Phase 1: Component Library MVP

Goal:

Build the basic component management platform.

Tasks:

- Go backend setup
- PostgreSQL schema
- component CRUD
- categories
- search
- favorites
- preview metadata
- basic Next.js dashboard

Success metric:

Users can browse, save, and manage components.

### Phase 2: Chrome Extension MVP

Goal:

Bring BubbleForge into the Bubble editor workflow.

Tasks:

- extension authentication
- component browser panel
- search components
- copy or insert component payloads
- communicate with backend

Success metric:

Users can access BubbleForge components while working inside Bubble.

### Phase 3: AI Generation

Goal:

Generate and customize components with AI.

Tasks:

- BYOK support
- encrypted API key storage
- provider routing
- generation job queue
- component generation prompts
- component editing prompts
- save generated components

Success metric:

Users can generate a missing component and save it to their library.

### Phase 4: Automated Validation

Goal:

Make generated components safer and more reliable.

Tasks:

- schema validation
- isolated render testing
- screenshot previews
- Bubble compatibility checks
- version history

Success metric:

Generated components are validated before being used.

### Phase 5: Community and Marketplace

Goal:

Turn generated components into a growing ecosystem.

Tasks:

- public/private components
- ratings
- downloads/usage counts
- trending components
- team libraries
- creator profiles

Success metric:

The component library grows from user-created components.

## Project Principles

- Keep the repository private.
- Validate Bubble insertion before building too much around it.
- Design the backend for concurrent users from the beginning.
- Use background jobs for AI generation and validation.
- Treat API keys like production secrets.
- Cache aggressively so the platform becomes faster over time.
- Save generated components for reuse.
- Prefer practical working demos over premature complexity.
- Build the extension as a serious product surface.

## Repository Status

This project is in early research and planning.

Current priority:

```text
Prove component insertion into Bubble.
```

## License

No license is provided.

All rights reserved.

This is a private commercial/portfolio project. No permission is granted to copy, modify, redistribute, sublicense, or use the source code without explicit written permission from the owner.
