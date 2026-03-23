# Add User Authentication

## Plan
Replace client-side Dexie/IndexedDB storage with Supabase for:
- Email/password authentication (sign up + sign in)
- Cloud-persisted tournaments (PostgreSQL via Supabase)
- Row Level Security so each user only sees their own tournaments

## Tasks
- [x] Install @supabase/supabase-js
- [ ] Create Supabase client (`src/lib/supabase.ts`) + env config
- [ ] Create AuthContext with session management
- [ ] Build SignIn and SignUp screens
- [ ] Create AuthGuard for route protection
- [ ] Define SQL migration for tournaments table with RLS
- [ ] Create Supabase data layer (`src/db/supabase.ts`)
- [ ] Update Zustand store to use Supabase instead of Dexie
- [ ] Update App.tsx routing with auth routes and guard
- [ ] Add sign-out button to Home screen
- [ ] Clean up Dexie dependency
- [ ] Add `.env.example` and update `.gitignore`
- [ ] Build + test verification
