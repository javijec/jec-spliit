[<img alt="Spliit" height="60" src="https://github.com/spliit-app/spliit/blob/main/public/logo-with-text.png?raw=true" />](https://spliit.app)

Spliit is a free and open source alternative to Splitwise. You can either use the official instance at [Spliit.app](https://spliit.app), or deploy your own instance:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fspliit-app%2Fspliit&project-name=my-spliit-instance&repository-name=my-spliit-instance&stores=%5B%7B%22type%22%3A%22postgres%22%7D%5D&)

## Notes for this fork (jec-spliit / NexoGastos)

- PWA is enabled with `next-pwa`.
- Manifest is served at `/manifest.webmanifest` (generated from `src/app/manifest.ts`).
- Production service worker is generated during build; this project uses `next build --webpack` because `next-pwa` currently relies on webpack integration.
- A floating "Instalar app" button is shown only when the app is not installed and the browser exposes `beforeinstallprompt`.
- GitHub Actions CI workflow was removed from this repository (`.github/workflows/ci.yml`).

## Features

- [x] Create a group and share it with friends
- [x] Create expenses with description
- [x] Display group balances
- [x] Create reimbursement expenses
- [x] Progressive Web App
- [x] Select all/no participant for expenses
- [x] Split expenses unevenly [(#6)](https://github.com/spliit-app/spliit/issues/6)
- [x] Mark a group as favorite [(#29)](https://github.com/spliit-app/spliit/issues/29)
- [x] Tell the application who you are when opening a group [(#7)](https://github.com/spliit-app/spliit/issues/7)
- [x] Assign a category to expenses [(#35)](https://github.com/spliit-app/spliit/issues/35)
- [x] Search for expenses in a group [(#51)](https://github.com/spliit-app/spliit/issues/51)
- [x] Upload and attach images to expenses [(#63)](https://github.com/spliit-app/spliit/issues/63)

### Possible incoming features

- [ ] Ability to create recurring expenses [(#5)](https://github.com/spliit-app/spliit/issues/5)
- [ ] Import expenses from Splitwise [(#22)](https://github.com/spliit-app/spliit/issues/22)

## Stack

- [Next.js](https://nextjs.org/) for the web application
- [TailwindCSS](https://tailwindcss.com/) for the styling
- [shadcn/UI](https://ui.shadcn.com/) for the UI components
- [Prisma](https://prisma.io) to access the database
- [Vercel](https://vercel.com/) for hosting (application and database)

## Contribute

The project is open to contributions. Feel free to open an issue or even a pull-request!
Join the discussion in [the Spliit Discord server](https://discord.gg/YSyVXbwvSY).

If you want to contribute financially and help us keep the application free and without ads, you can also:

- 💜 [Sponsor me (Sebastien)](https://github.com/sponsors/scastiel), or
- 💙 [Make a small one-time donation](https://donate.stripe.com/28o3eh96G7hH8k89Ba).

### Translation

The project's translations are managed using [our Weblate project](https://hosted.weblate.org/projects/spliit/spliit/).
You can easily add missing translations to the project or even add a new language!
Here is the current state of translation:

<a href="https://hosted.weblate.org/engage/spliit/">
<img src="https://hosted.weblate.org/widget/spliit/spliit/multi-auto.svg" alt="Translation status" />
</a>

## Run locally

1. Clone the repository (or fork it if you intend to contribute)
2. Start a PostgreSQL server. You can run `./scripts/start-local-db.sh` if you don’t have a server already.
3. Copy the file `.env.example` as `.env`
4. Run `npm install` to install dependencies. This will also apply database migrations and update Prisma Client.
5. Run `npm run dev` to start the development server

## Auth0 + Google login

This fork now supports authenticated users with Auth0. Group memberships, favorites, archived groups and recent groups can be persisted for signed-in users instead of relying only on browser `localStorage`.

### Required environment variables

Add these values to `.env` locally and to your Vercel project in production:

```.env
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_CLIENT_ID=your-auth0-app-client-id
AUTH0_CLIENT_SECRET=your-auth0-app-client-secret
AUTH0_SECRET=generate-a-32-byte-hex-secret
APP_BASE_URL=http://localhost:3000
CRON_SECRET=replace-with-a-long-random-secret
```

You can generate `AUTH0_SECRET` with:

```bash
openssl rand -hex 32
```

### Auth0 dashboard setup

Create an Auth0 application of type `Regular Web Application`.

Configure these URLs:

- Allowed Callback URLs:
  `http://localhost:3000/auth/callback`
- Allowed Logout URLs:
  `http://localhost:3000`
- Allowed Web Origins:
  `http://localhost:3000`

For production, replace those URLs with your public domain. If you deploy on Vercel with a stable production domain, use that same domain in `APP_BASE_URL`.

### Google social login

In Auth0:

1. Go to `Authentication > Social`
2. Enable `Google`
3. Configure the Google OAuth credentials in the Auth0 connection
4. Make sure the connection name remains `google-oauth2`, since the app links to `/auth/login?connection=google-oauth2`

### Local verification

Once the variables are set:

1. Run `npm run dev`
2. Open `http://localhost:3000`
3. Click `Ingresar con Google`
4. Complete the Auth0 + Google flow
5. Open `/groups`, create a group, and verify that it appears in `Mis grupos` even after clearing browser storage

## Health check

The application has a health check endpoint that can be used to check if the application is running and if the database is accessible.

- `GET /api/health/readiness` or `GET /api/health` - Check if the application is ready to serve requests, including database connectivity.
- `GET /api/health/liveness` - Check if the application is running, but not necessarily ready to serve requests.

## Recurring expenses processing

Recurring expenses are generated outside of the regular read path through the cron route at `/api/cron/recurring-expenses`.

- On Vercel, the schedule is configured in `vercel.json` to run hourly.
- Protect the route in production with `CRON_SECRET`.
- In local development, if `CRON_SECRET` is empty, you can call the route manually to test it.

## Opt-in features

### Expense documents

Spliit offers users to upload images (to an AWS S3 bucket) and attach them to expenses. To enable this feature:

- Follow the instructions in the _S3 bucket_ and _IAM user_ sections of [next-s3-upload](https://next-s3-upload.codingvalue.com/setup#s3-bucket) to create and set up an S3 bucket where images will be stored.
- Update your environments variables with appropriate values:

```.env
NEXT_PUBLIC_ENABLE_EXPENSE_DOCUMENTS=true
S3_UPLOAD_KEY=AAAAAAAAAAAAAAAAAAAA
S3_UPLOAD_SECRET=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
S3_UPLOAD_BUCKET=name-of-s3-bucket
S3_UPLOAD_REGION=us-east-1
```

You can also use other S3 providers by providing a custom endpoint:

```.env
S3_UPLOAD_ENDPOINT=http://localhost:9000
```

## License

MIT, see [LICENSE](./LICENSE).
