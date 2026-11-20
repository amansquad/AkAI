// Sets up and looks after the community themes database (Neon, through the
// Vercel Marketplace). Reads DATABASE_URL from .env.local, which
// `vercel env pull` writes. Run from the repository root:
//
//   npm run themes:db -- setup          make the tables (safe to run again)
//   npm run themes:db -- stats          how many themes, shown and hidden
//   npm run themes:db -- hidden         themes hidden by reports
//   npm run themes:db -- restore <id>   show a hidden theme again and clear its reports
//   npm run themes:db -- delete <id>    remove a theme for good
//   npm run themes:db -- ai             today's translate/rewrite/handwriting calls
//   npm run themes:db -- crashes        the newest crash reports from the app, grouped
//   npm run themes:db -- crashes clear  delete all crash reports
//   npm run themes:db -- chatid         after messaging the sticker bot, shows your chat id
//                                       (TELEGRAM_ALERT_CHAT_ID in Vercel, for the daily crash digest)
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
  // Daily AI call counts (src/lib/ai-limits.ts). caller '*' is everyone together.
  `create table if not exists ai_usage (
    caller text not null,
    feature text not null,
    day date not null,
    calls integer not null default 0,
    primary key (caller, feature, day)
  )`,
  // Crash reports the app's users chose to send (src/app/api/crash).
  `create table if not exists crash_reports (
    id bigserial primary key,
    app text not null,
    app_code integer not null,
    android text not null,
    sdk integer not null,
    model text not null,
    trace text not null,
    created_at timestamptz not null default now()
  )`,
];

switch (command) {
  case 'setup':
    for (const statement of SCHEMA) await sql.query(statement);
    console.log('Community themes tables are ready.');
    break;
  case 'chatid': {
    const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
    if (!token) { console.error('TELEGRAM_BOT_TOKEN is not in .env.local.'); break; }
    const r = await fetch(`https://api.telegram.org/bot${token}/getUpdates`).then((x) => x.json());
    const chats = new Map();
    for (const u of r.result ?? []) {
      const c = (u.message ?? u.channel_post ?? u.my_chat_member)?.chat;
      if (c) chats.set(c.id, c.title ?? [c.first_name, c.last_name].filter(Boolean).join(' ') ?? c.username);
    }
    if (!chats.size) console.log('No messages yet. Send the bot any message in Telegram, then run this again.');
    for (const [id, name] of chats) console.log(`${id}  ${name}`);
    break;
  }
  case 'crashes': {
    if (id === 'clear') {
      const rows = await sql`delete from crash_reports returning id`;
      console.log(`Deleted ${rows.length} crash reports.`);
      break;
    }
    // Same first lines of the trace = the same crash; newest groups first.
    const rows = await sql`
      select split_part(trace, chr(10), 2) || ' ' || split_part(trace, chr(10), 3) as sig,
             count(*)::int as n, max(created_at) as last, max(app) as app,
             (array_agg(trace order by created_at desc))[1] as trace,
             (array_agg(model || ', Android ' || android order by created_at desc))[1] as phone
      from crash_reports group by sig order by last desc limit 20`;
    if (!rows.length) console.log('No crash reports.');
    for (const r of rows) {
      console.log(`\n=== ${r.n}× · last ${new Date(r.last).toISOString().slice(0, 16)} · v${r.app} · ${r.phone}`);
      console.log(r.trace.split('\n').slice(0, 14).join('\n'));
    }
    break;
  }
  case 'ai': {
    const rows = await sql`select feature, calls from ai_usage where caller = '*' and day = current_date order by feature`;
    const [callers] = await sql`select count(distinct caller)::int as n from ai_usage where caller <> '*' and day = current_date`;
    if (!rows.length) console.log('No AI calls today.');
    for (const r of rows) console.log(`${r.feature}: ${r.calls} calls today`);
    console.log(`${callers.n} callers today`);
    break;
  }
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
