// Looks after the Sticker Marketplace: the Telegram sticker packs the keyboard
// offers to install. Reads DATABASE_URL and TELEGRAM_BOT_TOKEN from .env.local
// (`vercel env pull` writes the first). Run from the repository root:
//
//   npm run stickers:db -- setup                     make the tables (safe to run again)
//   npm run stickers:db -- add <t.me link> [title]   add a pack, or refresh one already there
//   npm run stickers:db -- list                      every pack, most installed first
//   npm run stickers:db -- hide <name>               take a pack out of the marketplace
//   npm run stickers:db -- show <name>               put it back
//   npm run stickers:db -- delete <name>             remove it for good
//
// Packs already installed on phones stay there; this only changes what's offered.
import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL;
const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
if (!url) {
  console.error('DATABASE_URL is not set. Run `vercel env pull .env.local` first.');
  process.exit(1);
}
const sql = neon(url);
const [command, arg, ...rest] = process.argv.slice(2);

const SCHEMA = [
  `create table if not exists sticker_market (
    name text primary key,
    title text not null,
    count integer not null,
    moving integer not null default 0,
    previews jsonb not null default '[]',
    emoji text not null default '',
    installs integer not null default 0,
    hidden boolean not null default false,
    added_at timestamptz not null default now()
  )`,
  `create index if not exists sticker_market_popular on sticker_market (installs desc, added_at desc) where not hidden`,
  `create table if not exists sticker_market_installs (
    name text not null references sticker_market(name) on delete cascade,
    device text not null,
    primary key (name, device)
  )`,
];

function packName(input) {
  const m = input?.match(/(?:t\.me|telegram\.me)\/addstickers\/([A-Za-z0-9_]+)/i);
  const name = m ? m[1] : input;
  return name && /^[A-Za-z0-9_]{1,64}$/.test(name) ? name : null;
}

switch (command) {
  case 'setup':
    for (const s of SCHEMA) await sql.query(s);
    console.log('Sticker Marketplace tables are ready.');
    break;

  case 'add': {
    const name = packName(arg);
    if (!name) { console.error('Usage: add <t.me/addstickers/Name> [title]'); process.exit(1); }
    if (!token) { console.error('TELEGRAM_BOT_TOKEN is not set in .env.local'); process.exit(1); }
    const r = await (await fetch(`https://api.telegram.org/bot${token}/getStickerSet?name=${name}`)).json();
    if (!r.ok) { console.error(`Telegram: ${r.description}`); process.exit(1); }
    const set = r.result;
    const usable = set.stickers.filter((s) => !s.is_animated || s.thumbnail);
    const previews = usable.slice(0, 5).map((s) => s.file_unique_id);
    const moving = usable.filter((s) => s.is_video).length;
    // The pack's most common emoji, so it can be found by feeling.
    const counts = {};
    for (const s of usable) if (s.emoji) counts[s.emoji] = (counts[s.emoji] || 0) + 1;
    const emoji = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([e]) => e).join('');
    const title = rest.join(' ').trim() || set.title;
    await sql`
      insert into sticker_market (name, title, count, moving, previews, emoji)
      values (${set.name}, ${title}, ${usable.length}, ${moving}, ${JSON.stringify(previews)}::jsonb, ${emoji})
      on conflict (name) do update set title = excluded.title, count = excluded.count, moving = excluded.moving,
        previews = excluded.previews, emoji = excluded.emoji`;
    console.log(`Added "${title}" (${set.name}): ${usable.length} stickers, ${moving} moving.`);
    break;
  }

  case 'list': {
    const rows = await sql`select name, title, count, moving, installs, hidden from sticker_market order by installs desc, added_at desc`;
    if (rows.length === 0) console.log('No packs yet. Add one with: npm run stickers:db -- add <t.me link>');
    for (const r of rows) console.log(`${r.hidden ? '(hidden) ' : ''}${r.title} [${r.name}]: ${r.count} stickers, ${r.moving} moving, ${r.installs} installs`);
    break;
  }

  case 'hide':
  case 'show': {
    const rows = await sql`update sticker_market set hidden = ${command === 'hide'} where name = ${arg} returning name`;
    console.log(rows.length ? `${command === 'hide' ? 'Hid' : 'Showing'} ${arg}.` : `No pack called ${arg}.`);
    break;
  }

  case 'delete': {
    const rows = await sql`delete from sticker_market where name = ${arg} returning name`;
    console.log(rows.length ? `Deleted ${arg}.` : `No pack called ${arg}.`);
    break;
  }

  default:
    console.log('Commands: setup, add <link> [title], list, hide <name>, show <name>, delete <name>');
}
