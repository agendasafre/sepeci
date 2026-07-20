# Formulario de inscripción

Lightweight first slice for a public enrollment flow: static HTML/CSS/JavaScript, a Vercel serverless endpoint, and Supabase persistence.

## Setup

1. Copy `.env.example` to `.env.local` in Vercel/local development.
2. Replace the placeholder `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` values with the real Supabase project values when you are ready to submit records. Keep the service-role key server-only in Vercel/local env; never put it in browser code.
3. Set `ALLOWED_ORIGIN` to the deployed site origin.
4. Run `sql/001_enrollment_submissions.sql` in the Supabase SQL editor for a new database. For an existing database, apply the later migration files as needed, including `sql/003_add_other_place_of_belonging.sql`.
5. Add the production splash image at `assets/splash.jpg`.

## Academic units

The academic-unit list is centralized in `academic-units.js`. The browser loads that file before `main.js`, and the server-side endpoint imports the same file through `api/_shared.js`. To update the final list, edit only `academic-units.js`.

The database intentionally does not duplicate the controlled list in a `CHECK` constraint. This keeps the project simple and avoids editing SQL every time the final list changes. Server-side validation in `api/submit.js` remains the source of truth before inserting into Supabase.

Use the id `otra-unidad-academica` for the option that should display the extra free-text field. When that option is selected, the app stores the controlled value in `academic_unit` and the entered value in the nullable `other_academic_unit` column.

## Residence department

The residence department selector includes San Juan departments and the controlled value `otra-provincia-pais` for `Otra provincia/país`. When that option is selected, the app requires a free-text value up to 100 characters and stores it in the nullable `other_place_of_belonging` column. For regular departments, `other_place_of_belonging` is stored as `null`.

## Form closing date

The closing date and the closed-form message are centralized in `form-config.js`:

```js
expiresAt: "2026-12-31T00:00:00-03:00",
expiredMessage: "El formulario de inscripción ya no se encuentra disponible.",
```

From that exact date at 00:00 Argentina time, the browser no longer shows the form. The server-side endpoint also rejects direct submissions with HTTP `410`, so the closing rule is not only visual.

## Local run

You can open `index.html` directly in the browser for a static UI preview. The page uses relative asset paths, so CSS, JavaScript, the centralized academic-unit list, and `assets/splash.jpg` load from the project folder under `file://`. If `assets/splash.jpg` is missing, the splash still advances to the form after about 2.4 seconds.

Direct `file://` preview cannot call `POST /api/submit`; there is no local server or Vercel function runtime behind that URL. In that mode, the browser shows a clear message instead of attempting a broken submission.

Use Vercel's local runtime for real endpoint checks:

```bash
vercel dev
```

## Deployment notes

- Do not expose `SUPABASE_SERVICE_ROLE_KEY` in browser code or `NEXT_PUBLIC_`/client-prefixed variables.
- All writes go through `POST /api/submit`.
- DNI is normalized to the single `dni` column, must have 7 or 8 digits, and is protected by a unique constraint.
- Existing databases need `sql/003_add_other_place_of_belonging.sql` before deploying the updated endpoint.
- The honeypot and in-memory rate limit are first-slice abuse seams, not a durable anti-abuse system.

## Manual test checklist

- Splash auto-advances after about 2.4 seconds.
- Missing `assets/splash.jpg` still allows the form to appear.
- Opening `index.html` through `file://` loads local assets and blocks submit with the local-preview message.
- Running through `vercel dev` keeps `POST /api/submit` available for endpoint checks.
- Required fields show field-level attention.
- Allowed gender values are exactly `Femenino`, `Masculino`, `No binario`, and `Otro`.
- Academic unit rejects values outside the controlled list. Selecting `Otra unidad académica` requires the extra text field.
- Selecting `Otra provincia/país` requires the residence free-text field with up to 100 characters.
- Selecting a regular department hides and clears the residence free-text field.
- A valid submission opens the success popup.
- A repeated DNI returns the duplicate message.
- Browser assets do not contain Supabase service-role credentials.
- After the closing date in `form-config.js`, the form is hidden and `POST /api/submit` returns `410`.

## Lightweight local verification

These checks do not require real Supabase credentials:

```bash
node --check main.js && node --check api/submit.js && node scripts/verify-local.js
```
