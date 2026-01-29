# MuriukiDB - Custom RDBMS for Pesapal Junior Dev Challenge '26

## 📋 Overview

MuriukiDB is a custom Relational Database Management System (RDBMS) built as a submission for the **Pesapal Junior Dev Challenge '26**. It features a complete SQL parser, query execution engine with in-memory B-Tree indexing, and an interactive REPL interface, demonstrated through a Contact Manager web application.

**Live Demo**: [https://rdbms-muriuki.vercel.app/](https://rdbms-muriuki.vercel.app/)

---

## 🔄 Recent Updates

### PWA Install, Streak Logic, XP/Sound Consistency, Mobile Nav & GDPR Consent

**Commit:** `fix(app): PWA install, streak logic, XP/sound consistency, mobile nav, GDPR consent`

#### Changes Made:

1. **PWA Install Prompt** (`src/hooks/usePWAInstall.tsx`)
   - Created hook to capture `beforeinstallprompt` event
   - Shows install button in header when app is installable on mobile/desktop
   - Detects standalone mode to hide button when already installed

2. **Streak Logic Fix** (`src/hooks/useGameStats.tsx`)
   - Fixed `mergeStats` to use streak from source with most recent `lastQueryDate`
   - Streak now properly resets to 0 when a day is skipped
   - Prevents stale streak data when syncing between local storage and server

3. **XP & Sound Consistency** (`src/components/DemoAppManager.tsx`)
   - Added `playXP()` and `playSuccess()` calls when XP is awarded in Demo App
   - Matches REPL behavior for consistent audio/visual feedback

4. **Mobile Navigation** (`src/components/MobileNav.tsx`, `src/pages/Index.tsx`)
   - Integrated hamburger menu for small screens
   - All hidden nav items now accessible via collapsible menu
   - PWA install option included in mobile menu when available

5. **Cookie Consent Banner** (`src/components/CookieConsentBanner.tsx`, `src/hooks/useCookieConsent.tsx`)
   - GDPR-compliant consent mechanism with "Necessary Only" and "Accept All" options
   - Three categories: Necessary (always on), Functional, Analytics
   - Preferences stored with version control for automatic re-prompting on policy updates
   - Customizable preferences panel with individual toggles

---

## 🎯 Challenge Requirements Met

| Requirement | Implementation |
|-------------|----------------|
| Declare tables with column types | ✅ CREATE TABLE with INTEGER, TEXT, REAL, BOOLEAN, DATE types |
| CRUD operations | ✅ Full INSERT, SELECT, UPDATE, DELETE support |
| Basic indexing | ✅ In-memory B-Tree indexes with CREATE INDEX |
| Primary and unique keys | ✅ PRIMARY KEY, UNIQUE, NOT NULL, AUTO_INCREMENT |
| JOIN operations | ✅ INNER JOIN and LEFT JOIN with ON clause |
| Interactive REPL | ✅ Terminal-style interface with syntax highlighting |
| Demo application | ✅ Contact Manager with full CRUD, pagination, import/export |

---

## 🏗️ Architecture

### Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom terminal theme
- **Backend**: Supabase for data persistence & authentication
- **Audio**: Web Audio API for synthesized sound effects
- **Monitoring**: Sentry for error tracking and performance monitoring
- **State Management**: React Context + sessionStorage for session tracking

### SQL Engine Components

```
┌─────────────────────────────────────────────────────────┐
│                     SQL Query Input                      │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                       LEXER                              │
│  - Tokenizes SQL input                                   │
│  - XSS protection via HTML entity escaping               │
│  - Handles strings, numbers, keywords, identifiers       │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                       PARSER                             │
│  - Builds Abstract Syntax Tree (AST)                     │
│  - Supports: CREATE, INSERT, SELECT, UPDATE, DELETE      │
│  - Handles JOINs, WHERE, ORDER BY, GROUP BY, LIMIT       │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                      EXECUTOR                            │
│  - Executes queries against Supabase storage             │
│  - Rate limiting (client + server-side)                  │
│  - Resource limits (tables, rows, timeout)               │
│  - B-Tree index utilization                              │
│  - User/Session context for RLS compliance               │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   QUERY RESULT                           │
│  - Formatted output with execution time                  │
│  - Error messages with suggestions                       │
│  - Gamification rewards (XP, badges)                     │
└─────────────────────────────────────────────────────────┘
```

### Data Isolation & Multi-Tenancy

Each user operates in an isolated environment:
- **Anonymous users**: Session-based isolation using sessionStorage
- **Authenticated users**: User ID-based isolation with persistent storage
- **RLS policies**: Row-level security enforces strict data access control
- **Automatic cleanup**: Anonymous data purged after 7 days of inactivity

---

## 🔒 Security Features

### Implemented Security Measures

1. **XSS Protection**: SQL lexer escapes HTML entities in string values
2. **Rate Limiting**: Server-side enforcement via Edge Functions + client fallback
3. **Input Validation**: Stats validation before leaderboard sync with defined limits
4. **RLS Policies**: Row-level security on all tables (rdbms_tables, rdbms_rows, rdbms_query_history)
5. **SECURITY DEFINER Functions**: Protected with auth.uid() checks to prevent abuse
6. **Resource Limits**: Max 50 tables, 10k rows/table, 5s query timeout, 30 queries/min
7. **Destructive Operation Warnings**: Confirmation dialogs for DROP TABLE and DELETE operations
8. **Session Context**: All operations include user_id or session_id for RLS compliance

### Security Fixes Applied

| Issue | Fix |
|-------|-----|
| Client-side rate limit bypass | Added server-side rate limiting via Edge Function |
| SECURITY DEFINER abuse | Added auth.uid() verification in DB functions |
| Leaderboard stats tampering | Client-side validation + capped values on sync |
| localStorage data exposure | Server-side validation before persisting |
| Missing RLS context | Executor now includes user_id/session_id in all operations |

---

## 📊 Monitoring & Error Tracking

### Sentry Integration

The application uses [Sentry](https://sentry.io) for real-time error tracking and performance monitoring in production.

**Features:**
- **Error Tracking**: Automatic capture of unhandled exceptions and promise rejections
- **Performance Monitoring**: Transaction tracing with 10% sample rate
- **Session Replay**: Captures user sessions (10% normal, 100% on error) for debugging
- **Source Maps**: Uploaded during build for readable stack traces

**Configuration:**
- Sentry is enabled only in production (`import.meta.env.PROD`)
- DSN is configured via environment variable or build-time injection
- Integrations: Browser Tracing, Session Replay

**Environment Variables:**
```env
VITE_SENTRY_DSN=your_sentry_dsn_here
```

---

## 🎮 Gamification System

### SQL Command Ladder (23 Military-Style Ranks)

Progress from **Private (0 XP)** to **Commander in Chief (1,000,000 XP)**:

| Rank | XP Required | Icon |
|------|-------------|------|
| Private | 0 | 🔰 |
| Private First Class | 50 | 🎖️ |
| Corporal | 150 | ⭐ |
| Sergeant | 350 | ⭐⭐ |
| Staff Sergeant | 650 | 🌟 |
| Sergeant First Class | 1,200 | 🌟⭐ |
| Master Sergeant | 2,000 | 🎯 |
| First Sergeant | 3,500 | 🎯⭐ |
| Sergeant Major | 6,000 | 🏅 |
| ... | ... | ... |
| General | 540,000 | ⭐⭐⭐⭐ |
| Commander in Chief | 1,000,000 | 🎖️👑 |

### XP Rewards

| Action | XP |
|--------|-----|
| CREATE TABLE | +50 |
| INSERT (per row) | +10 |
| SELECT | +5 |
| UPDATE/DELETE | +15 |
| CREATE INDEX | +30 |

### Anti-Abuse Mechanics

- **Cooldown**: XP gains over 1,000/day reduced to 20% effectiveness
- **Validation**: Stats limits prevent impossibly high values
- **Rate Limiting**: 30 queries/minute max with exponential backoff
- **Streak Tracking**: Server-side streak computation prevents manipulation

---

## 💻 Supported SQL Commands

### DDL (Data Definition Language)

```sql
-- Create table with constraints
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  age INTEGER,
  created_at DATE
);

-- Create with IF NOT EXISTS
CREATE TABLE IF NOT EXISTS users (...);

-- Create index for faster lookups
CREATE INDEX idx_users_email ON users (email);

-- Create unique index
CREATE UNIQUE INDEX idx_users_email ON users (email);

-- Drop table
DROP TABLE IF EXISTS users;

-- Show all tables
SHOW TABLES;

-- Describe table structure
DESCRIBE users;
```

### DML (Data Manipulation Language)

```sql
-- Insert single row
INSERT INTO users (name, email, age) VALUES ('John', 'john@example.com', 25);

-- Insert multiple rows
INSERT INTO users (name, email) VALUES ('Alice', 'alice@mail.com'), ('Bob', 'bob@mail.com');

-- Select with filters
SELECT name, email FROM users WHERE age > 20 ORDER BY name LIMIT 10;

-- Select with LIKE pattern matching
SELECT * FROM users WHERE name LIKE 'J%';

-- Join tables (INNER JOIN)
SELECT users.name, orders.product 
FROM users 
INNER JOIN orders ON users.id = orders.user_id;

-- Left Join
SELECT users.name, orders.product 
FROM users 
LEFT JOIN orders ON users.id = orders.user_id;

-- Update records
UPDATE users SET age = 26 WHERE name = 'John';

-- Delete records (with confirmation dialog)
DELETE FROM users WHERE age < 18;
```

---

## 🚀 Running Locally

### Prerequisites

- Node.js 18+ or Bun
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/Samuel-Muriuki/MuriukiDB-RDBMS.git
cd MuriukiDB-RDBMS

# Install dependencies
npm install
# or
bun install

# Start development server
npm run dev
# or
bun dev
```

The app runs at `http://localhost:8080` by default.

### Environment Variables

The project uses Supabase for the backend. Create a `.env` file from the example:

```bash
cp .env.example .env
```

Then fill in your Supabase credentials:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

---

## 📁 Project Structure

```
src/
├── components/
│   ├── REPL.tsx                  # Interactive SQL terminal
│   ├── DemoAppManager.tsx        # Demo CRUD application (5 table types)
│   ├── ContactManager.tsx        # Legacy Contact Manager
│   ├── Leaderboard.tsx           # Global rankings
│   ├── ProfilePanel.tsx          # User profile & sound settings
│   ├── QueryHistory.tsx          # Query history viewer
│   ├── TerminalAuth.tsx          # Terminal-based authentication
│   ├── DeleteConfirmDialog.tsx   # Destructive operation confirmation
│   ├── SampleQueries.tsx         # Sample SQL queries loader
│   ├── WelcomeTutorial.tsx       # Onboarding for new users
│   ├── animations/               # UI animations (FadeContent, etc.)
│   └── tour/                     # Interactive tour components
│       ├── InteractiveTour.tsx   # Tour controller
│       ├── TourSpotlight.tsx     # Spotlight overlay
│       └── TourTooltip.tsx       # Tour step tooltips
├── contexts/
│   └── FeedbackContext.tsx       # Sound/haptic feedback provider
├── hooks/
│   ├── useAuth.tsx               # Authentication context
│   ├── useGameStats.tsx          # Gamification state (XP, ranks, badges)
│   ├── useSounds.tsx             # Web Audio API sound effects
│   ├── useTour.tsx               # Interactive guided tour
│   ├── useRealtimeTable.tsx      # Real-time data sync
│   ├── useTheme.tsx              # Dark/light theme management
│   └── useUserFingerprint.tsx    # Session tracking (per-session visits)
├── lib/rdbms/
│   ├── lexer.ts                  # SQL tokenizer with XSS protection
│   ├── parser.ts                 # AST builder
│   ├── executor.ts               # Query execution with RLS context
│   ├── btree.ts                  # B-Tree index implementation
│   └── types.ts                  # TypeScript interfaces
├── pages/
│   ├── Index.tsx                 # Main dashboard
│   └── Achievements.tsx          # Badges & ranks view
└── integrations/supabase/
    ├── client.ts                 # Supabase client
    └── types.ts                  # Auto-generated DB types

supabase/
├── functions/
│   ├── sql-execute/              # Rate limiting Edge Function
│   └── cleanup-inactive/         # Data cleanup Edge Function
└── migrations/                   # Database schema migrations
```

---

## 🌟 Key Features

### Core RDBMS Features
1. **Complete SQL Parser**: Lexer → Parser → AST → Executor pipeline
2. **B-Tree Indexing**: In-memory indexes for optimized lookups
3. **Smart Error Messages**: Fuzzy matching suggests correct table/column names
4. **Resource Limits**: Prevents abuse with table/row/query limits

### User Experience
5. **Terminal-Style REPL**: Authentic command-line experience with syntax highlighting
6. **Demo App Manager**: Full CRUD for 5 table types (Contacts, Users, Products, Orders, Employees)
7. **CSV/JSON Import/Export**: Data portability for the demo app
8. **Keyboard Shortcuts**: Ctrl+Enter to run, Esc to clear, Arrow keys for history
9. **Dark/Light Themes**: Customizable UI with terminal aesthetics
10. **Mobile Responsive**: Works on all devices with collapsible navigation
11. **Interactive Tour**: Guided walkthrough of app features with spotlight overlay
12. **Welcome Tutorial**: Onboarding for new users with theme selection
13. **Password Strength Indicator**: Visual feedback during signup and password reset
14. **Sound Effects**: Audio feedback for XP gains, achievements, rank ups, and errors (Web Audio API)

### Gamification
15. **XP & Ranking System**: 23 military-style ranks from Private to Commander in Chief
16. **Badge Achievements**: SQL Scholar, Query Master, Data Wizard, etc.
17. **Streak Tracking**: Daily activity streaks with server-side persistence
18. **Global Leaderboard**: Compete with other users worldwide

### Security & Safety
19. **Destructive Operation Confirmations**: DROP TABLE and DELETE trigger warning dialogs
20. **Rate Limiting**: Prevents abuse with server-side enforcement
21. **Data Isolation**: Each user's data is completely isolated
22. **Auto Cleanup**: Anonymous data cleaned after 7 days

---

## 🔑 Authentication

### Email Link Authentication

The authentication uses Supabase's native email verification with a terminal-style interface:

1. **Signup Flow**:
   - Enter nickname, email, and password (with visual strength indicator)
   - OTP verification code sent to email
   - Enter 6-character code → account created → auto logged in

2. **Login Flow**:
   - Enter email and password
   - Authenticated immediately

3. **Password Recovery**:
   - Enter email → recovery link sent
   - Click link in email → redirected to app
   - Prompted to enter new password (with strength indicator)
   - Password updated → logged in

### Password Strength Indicator

Visual feedback (non-enforcing) showing password strength during signup and reset:
- **Too weak** (red): Less than 6 characters
- **Weak** (orange): 6+ characters only
- **Fair** (yellow): Mixed case or numbers
- **Good/Strong** (green): Mixed case + numbers + special chars

### Terminal Commands
- `SIGNUP` - Create new account
- `LOGIN` - Sign in to existing account
- `RECOVER` - Reset forgotten password
- `EMAIL` - Change email address
- `Shift+T` - Toggle password visibility
- `Escape` - Cancel operation

---

## ⚠️ Known Limitations

See [KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md) for a complete list of current limitations and roadmap:

- **SQL Parser**: Single-statement execution internally (multi-statement at REPL level), no nested subqueries
- **Indexing**: In-memory B-Tree only (not persisted across sessions)
- **Transactions**: No ACID support (no BEGIN/COMMIT/ROLLBACK)
- **Concurrency**: No locking (last write wins)
- **Data Types**: INTEGER, TEXT, REAL, BOOLEAN, DATE only

---

## 🧪 Smoke Test Queries

Use these queries to verify the RDBMS functionality. Also available in [smoke_test.sql](smoke_test.sql).

```sql
-- 1) Create table with constraints
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  age INTEGER,
  created_at DATE
);

-- 2) Insert test data
INSERT INTO users (name, email, age, created_at) VALUES
 ('Alice', 'alice@example.com', 30, '2025-01-01'),
 ('Bob', 'bob@example.com', 25, '2025-01-03');

-- 3) Verify rows
SELECT * FROM users ORDER BY id;

-- 4) Test unique constraint (should fail)
INSERT INTO users (name, email) VALUES ('Eve', 'alice@example.com');

-- 5) Create and use index
CREATE INDEX idx_users_email ON users (email);
SELECT * FROM users WHERE email = 'bob@example.com';

-- 6) Test JOIN
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  user_id INTEGER,
  product TEXT
);
INSERT INTO orders (user_id, product) VALUES (1, 'Tea'), (2, 'Coffee');
SELECT u.name, o.product FROM users u INNER JOIN orders o ON u.id = o.user_id;

-- 7) Update & Delete
UPDATE users SET age = 26 WHERE name = 'Bob';
DELETE FROM users WHERE name = 'Alice';
```

---

## ⚠️ Design Decisions & Trade-offs

### Why Browser-Based Storage?

1. **Educational Focus**: Demonstrates RDBMS concepts without backend complexity
2. **Instant Feedback**: No network latency for query execution
3. **Privacy**: User data stays isolated by session/user

### Why Supabase for Persistence?

1. **RLS Policies**: Built-in row-level security
2. **Edge Functions**: Server-side rate limiting
3. **Authentication**: Secure user management
4. **Scalability**: Handles multiple concurrent users

### Why In-Memory B-Tree Indexes?

1. **Performance**: Faster lookups for repeated queries
2. **Educational**: Demonstrates real index structures
3. **Simplicity**: No need for persistent index storage

---

## 🚀 Deployment

### Vercel Deployment

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Import in Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository

3. **Configure Build Settings**
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Add Environment Variables**
   In Project Settings → Environment Variables:
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY` - Your Supabase anon key
   - `VITE_SUPABASE_PROJECT_ID` - Your Supabase project ID

5. **Deploy**
   - Click "Deploy" and wait for build to complete
   - Your app will be live at `your-project.vercel.app`

### SPA Routing

The `vercel.json` file handles client-side routing:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## 👨‍💻 Author

**Samuel Muriuki**
- Portfolio: [samuel-muriuki.vercel.app](https://samuel-muriuki.vercel.app/)
- GitHub: [github.com/Samuel-Muriuki](https://github.com/Samuel-Muriuki)

## ☕ Support

If you find this project helpful, consider supporting me!

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/elsamm)

Built in collaboration with [Lovable](https://lovable.dev/invite/A5KC0U8) AI.

---

## 📄 License

This project was created for the Pesapal Junior Developer Challenge 2026.

---

## 🙏 Acknowledgments

- **[Pesapal](https://www.pesapal.com/)** for the challenging and interesting problem
- **[Lovable](https://lovable.dev/invite/A5KC0U8) AI** for collaboration on development
- The open-source community for inspiration on SQL parsing techniques
