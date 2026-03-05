## Project info

## How can I edit this code?

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Supabase setup (initial connection)

1. Create your local environment file:

```sh
cp .env.example .env.local
```

2. Add your Supabase project values in `.env.local`:

```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

3. Start the app:

```sh
npm run dev
```

4. Open browser devtools console and verify one of these logs:
- Success: `[Supabase smoke test] getSession ok`
- Error: `[Supabase smoke test] getSession error: ...`

## Auth de producción y bootstrap de admin

Este frontend usa autenticación real de Supabase (`email+password`) y las escrituras protegidas dependen de RLS + `auth.uid()`.

### 1) Crear primer usuario admin

1. Crea el usuario en Supabase Auth.
2. Ejecuta este SQL en el proyecto:

```sql
insert into public.user_roles (user_id, role)
select p.id, 'admin'::public.app_role
from public.profiles p
where p.email = 'admin@tu-dominio.com'
on conflict (user_id, role) do nothing;

update public.profiles
set active_role = 'admin'
where email = 'admin@tu-dominio.com';
```

### 2) Configuración recomendada de Auth en producción

- Desactivar registro público (`enable_signup = false`).
- Mantener método inicial `email+password`.
- Gestionar altas por invitación/admin.
- No usar `service_role` en frontend.
