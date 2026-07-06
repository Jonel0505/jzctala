## TALA — Teaching Automation for Lesson Planning and Assessment

Build a full-stack TALA app matching the uploaded design (navy sidebar, blue/green accents, clean white content area) with teacher + admin workflows.

### Scope (Phase 1 — functional MVP)

**Public**
- Landing page (hero, mission/vision, features, footer) — content editable via admin CMS
- Register, Login, Forgot Password, Reset Password, Email Verification

**Teacher Dashboard** (matches your mockup)
- Welcome hero + quick-open cards (Lesson Plan Generator, Automated TOS, Assessment Generator)
- Recent Activity strip
- Sidebar: Dashboard, TOS Portal, Lesson Plan Generator, Assessment Generator, My Documents, Downloads, Favorites, Help, Settings
- Profile / password / notifications

**Generators** (functional, AI-powered via Lovable AI Gateway — `google/gemini-2.5-flash`)
- Lesson Plan Generator (ILAW-style form → generated plan, saved to `lesson_plans`, downloadable as .txt/.md)
- Automated TOS Portal (subject, grade, topics + item counts → TOS table, saved to `tos`)
- Assessment Generator (topic, item type, count → items with answer key, saved to `assessments`)
- My Documents (list/filter/download/delete across all three)

**Admin Portal**
- Dashboard (counts: users, pending, lesson plans, TOS, status)
- User Approval (approve / deny w/ optional reason → email teacher)
- User Management (search, edit, disable, delete, restore)
- Website Content Management (edit hero, mission, vision, about, footer, colors, announcements — stored in `website_settings`)
- Portal Management (toggle modules on/off — reflected in teacher sidebar)
- Activity Logs (timestamped feed)
- Announcements (create/edit/publish)
- Reports (basic usage stats)
- System Settings, Backup (export DB as JSON download)

### Tech / Architecture

- **Stack**: TanStack Start + Lovable Cloud (Supabase) + Lovable AI Gateway
- **Auth**: Supabase email/password + email verification; teachers land in `status=pending` until admin approves; login gate blocks non-approved with a friendly message
- **Roles**: separate `user_roles` table + `has_role()` security-definer function (admin, teacher) — never on profiles
- **Profiles**: `profiles` table (firstname, middle, lastname, employee_id, school, division, region, position, status, denial_reason) linked to `auth.users` via trigger
- **Emails**: approval / denial notifications via Supabase (edge fn using Resend if configured; otherwise in-app notification + activity log entry — I'll add Resend hook stub with clear TODO if no key)
- **Routing**: TanStack file routes. Public routes top-level. Teacher routes under `_authenticated/`. Admin routes under `_authenticated/admin/` gated by `has_role('admin')` in `beforeLoad`.
- **Data**: server functions with `requireSupabaseAuth`. RLS on every table.

### Database Tables

- `profiles` (id → auth.users, names, employee_id, school, division, region, position, status: pending|approved|denied, denial_reason, timestamps)
- `user_roles` (user_id, role: admin|teacher)
- `lesson_plans` (id, user_id, title, subject, grade, content jsonb, created_at)
- `tos` (id, user_id, title, subject, grade, table_data jsonb, created_at)
- `assessments` (id, user_id, title, subject, grade, items jsonb, created_at)
- `activity_logs` (id, user_id, action, details, created_at)
- `announcements` (id, title, body, published, created_at)
- `website_settings` (key, value jsonb) — singleton-style rows for homepage content
- `portal_modules` (key, label, enabled) — toggles for teacher modules

Grants + RLS policies for each. Teachers see own rows; admins see all via `has_role`.

### Design System

Update `src/styles.css` tokens to match mockup:
- Sidebar navy `oklch(0.20 0.08 265)`, primary blue `oklch(0.48 0.20 265)`, success green `oklch(0.55 0.16 155)`, soft blue backgrounds, warm off-white content bg
- Inter font, generous rounded-2xl cards, subtle shadows
- Reusable `<AppShell>` (sidebar + topbar) for teacher, `<AdminShell>` for admin

### Deferred (not in this pass)

- Real email delivery requires Resend API key — I'll wire the code and prompt to add the secret. Until then, approvals still work and log to activity + in-app notification.
- SF Forms, AI Assistant, Analytics modules (kept as toggles, "coming soon" pages)
- Advanced reports/backup restore (export only, no restore UI)

### Deliverable

A working app: register → pending → admin approves → teacher logs in → generates a lesson plan, TOS, and assessment → downloads them; admin can manage everything and edit homepage content live.

Approve to build.
