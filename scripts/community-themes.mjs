// Sets up and looks after the community themes database (Neon, through the
// Vercel Marketplace). Reads DATABASE_URL from .env.local, which
// `vercel env pull` writes. Run from the repository root:
//
//   npm run themes:db -- setup          make the tables (safe to run again)
//   npm run themes:db -- stats          how many themes, shown and hidden
//   npm run themes:db -- hidden         themes hidden by reports
//   npm run themes:db -- restore <id>   show a hidden theme again and clear its reports
//   npm run themes:db -- delete <id>    remove a theme for good
import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set. Run `vercel env pull .env.local` first.');
  process.exit(1);
}
const sql = neon(url);
const [command, id] = process.argv.slice(2);

const SCHEMA = [
  `create table if not exists community_themes (
    id text primary key,
    name text not null,
    emoji text not null,
    live text not null default '',
    colors jsonb not null,
    author text not null default '',
    device text not null,
    installs integer not null default 0,
    reports integer not null default 0,
    hidden boolean not null default false,
    created_at timestamptz not null default now()
  )`,
  `create index if not exists community_themes_new on community_themes (created_at desc) where not hidden`,
  `create index if not exists community_themes_popular on community_themes (installs desc, created_at desc) where not hidden`,
  `create index if not exists community_themes_device on community_themes (device, created_at desc)`,
  `create table if not exists community_theme_installs (
    theme_id text not null references community_themes(id) on delete cascade,
    device text not null,
    primary key (theme_id, device)
  )`,
  `create table if not exists community_theme_reports (
    theme_id text not null references community_themes(id) on delete cascade,
    device text not null,
    created_at timestamptz not null default now(),
    primary key (theme_id, device)
  )`,
];

switch (command) {
  case 'setup':
    for (const statement of SCHEMA) await sql.query(statement);
    console.log('Community themes tables are ready.');
    break;
  case 'stats': {
    const [r] = await sql`select count(*) filter (where not hidden)::int as shown, count(*) filter (where hidden)::int as hidden, coalesce(sum(installs), 0)::int as installs from community_themes`;
    console.log(`${r.shown} shown, ${r.hidden} hidden, ${r.installs} installs`);
    break;
  }
  case 'hidden': {
    const rows = await sql`select id, emoji, name, author, reports, created_at from community_themes where hidden order by created_at desc`;
    if (rows.length === 0) console.log('No hidden themes.');
    for (const r of rows) console.log(`${r.id}  ${r.emoji} ${r.name}${r.author ? ` by ${r.author}` : ''}  (${r.reports} reports, ${new Date(r.created_at).toISOString().slice(0, 10)})`);
    break;
  }
  case 'restore': {
    if (!id) throw new Error('usage: restore <id>');
    await sql`delete from community_theme_reports where theme_id = ${id}`;
    const rows = await sql`update community_themes set hidden = false, reports = 0 where id = ${id} returning name`;
    console.log(rows.length ? `Restored "${rows[0].name}".` : 'No theme with that id.');
    break;
  }
  case 'delete': {
    if (!id) throw new Error('usage: delete <id>');
    const rows = await sql`delete from community_themes where id = ${id} returning name`;
    console.log(rows.length ? `Deleted "${rows[0].name}".` : 'No theme with that id.');
    break;
  }
  default:
    console.log('Commands: setup, stats, hidden, restore <id>, delete <id>');
}
