# Guess the Picture — HTML + CSS + JavaScript + Supabase Storage

This version converts the original standalone game into a plain frontend:
- HTML
- CSS
- Vanilla JavaScript
- Supabase Database
- Supabase Storage
- Supabase Auth

No React, Node backend, PHP, or Vite is required.

## Setup

1. Create a Supabase project.
2. Open Supabase SQL Editor.
3. Run `supabase-schema.sql`.
4. Create an Authentication user for the administrator.
5. Copy that user's UUID and run:
   `insert into public.admin_users(user_id) values('YOUR-UUID');`
6. Copy `config.example.js` to `config.js`.
7. Put your Supabase URL and browser-safe Publishable/anon key in `config.js`.
8. Serve the folder from a web server. For example, VS Code Live Server or:
   `python -m http.server 5500`
9. Open `http://localhost:5500`.

## Supabase Storage

Bucket:
`game-images`

Pictures uploaded in the Admin Panel are stored in Supabase Storage. The database stores the public image URL and storage path.

## Security

Use only the browser-safe Supabase Publishable/anon key in `config.js`.

NEVER place a Supabase service_role/secret key in this frontend.

Admin modification permissions are protected by Supabase Auth + RLS.

## Files

index.html
style.css
app.js
config.example.js
supabase-schema.sql
README.md
