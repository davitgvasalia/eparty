# E-Party / ელექტრონული პარტია

ორენოვანი (ქართული / English) ვებ-პლატფორმა Solana ვოლეტით ავტორიზაციით.
Next.js 14 (App Router) + TypeScript + Tailwind. PWA-მზადაა, ამიტომ მობილურზე აპივით ინსტალირდება.

> სტატუსი: ინტერფეისის პროტოტიპი დემო მონაცემებით. ვოლეტის დაკავშირება რეალურია,
> ხმის მიცემა და ადმინისტრირება ჯერ არ არის დაკავშირებული Solana პროგრამასთან.

## გაშვება ლოკალურად

```bash
npm install
cp .env.example .env.local
npm run dev
```

გახსენით http://localhost:3000. ავტომატურად გადადის `/ka` ან `/en` გვერდზე.

## საჯაროდ გამოქვეყნება (Vercel, უფასო გეგმა საკმარისია)

1. შექმენით GitHub-ზე ახალი repository და ატვირთეთ პროექტი:
   ```bash
   git init && git add . && git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<თქვენი-სახელი>/eparty.git
   git push -u origin main
   ```
2. შედით https://vercel.com, დააჭირეთ **Add New → Project** და აირჩიეთ ეს repository.
3. Environment Variables-ში დაამატეთ (იხ. `.env.example`):
   - `NEXT_PUBLIC_SOLANA_RPC` = `https://api.devnet.solana.com`
   - `NEXT_PUBLIC_ADMIN_WALLET` = ადმინისტრატორის ვოლეტის მისამართი
4. დააჭირეთ **Deploy**. რამდენიმე წუთში მიიღებთ საჯარო მისამართს `xxx.vercel.app`.
5. შემდეგ **Settings → Domains**-ში დაამატეთ საკუთარი დომენი.

ყოველი `git push` ავტომატურად აახლებს საიტს.

## ფაილების სტრუქტურა

```
app/[locale]/        გვერდები (ka / en)
components/          Shell (მენიუ), AdminPanel, PollCard, ვოლეტის კომპონენტები
lib/dictionaries.ts  ყველა ტექსტი ორივე ენაზე
lib/demo-data.ts     დემო მონაცემები (შემდეგ ჩანაცვლდება Solana/DB მონაცემებით)
middleware.ts        ენის განსაზღვრა და გადამისამართება
```

## შემდეგი ნაბიჯები

1. SIWS (Sign-In With Solana): ერთჯერადი nonce, ხელმოწერის შემოწმება სერვერზე, სესია.
2. Anchor პროგრამა devnet-ზე: `add_member`, `create_poll`, `cast_vote`, `close_poll`.
3. ინტერფეისის დაკავშირება პროგრამასთან (დემო მონაცემების ჩანაცვლება).
4. ინიციატივების შენახვა მონაცემთა ბაზაში (Supabase), ტექსტის ჰეში ჯაჭვზე.
5. ადმინისტრატორისთვის მულტისიგი (Squads).
6. აუდიტი, შემდეგ mainnet.
7. მობილური აპი (Expo), საერთო ლოგიკით.

## Database (PostgreSQL + Prisma)

Data lives in PostgreSQL; the browser talks to it through `app/api/*`.
Signing in = the wallet signs a one-time message, the server checks it and sets a session cookie.

```bash
# 1. PostgreSQL: either Docker ...
npm run db:up
# ... or the portable install on this machine:
D:\eparty\pgsql\bin\pg_ctl -D D:\eparty\pgdata -l D:\eparty\pgdata\server.log start

# 2. Tables and starter data
npm run db:migrate      # applies prisma/migrations
npm run db:seed         # districts + demo content (SEED_DEMO=false for districts only)

# 3. App
npm run dev
```

`.env` needs `DATABASE_URL` and `SESSION_SECRET` (see `.env.example`).
Applicants' ID photos are stored in `storage/ids` (outside `public/`, admin-only, deleted once the
application is decided). In production set `NEXT_PUBLIC_ADMIN_WALLET`; without it the admin API is closed.
`npm run db:studio` opens a table browser.

## Public server

See [deploy/README.md](deploy/README.md) (Ubuntu VPS, nginx, HTTPS, backups).
