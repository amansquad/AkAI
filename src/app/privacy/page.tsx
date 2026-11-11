import type { Metadata } from 'next';
import Link from 'next/link';
import '../landing.css';

export const metadata: Metadata = {
  title: 'Privacy policy · AkAI keyboard',
  description: 'What the AkAI keyboard keeps on your phone, and the few things it sends, only when you ask it to.',
};

const UPDATED = '11 November 2026';

/** One thing the keyboard can send: what goes, where, and when. */
const SENT = [
  {
    name: 'Translate',
    what: 'Up to 300 characters before the cursor in the field you are typing in (never from a password field).',
    where: 'The AkAI website, which passes it to OpenAI to translate and returns the result. The website does not store it; OpenAI handles it under its API data policy, which does not use it for training.',
    when: 'Only when you open the translate panel and ask for a translation.',
  },
  {
    name: 'Handwriting',
    what: 'A picture of the letter you drew.',
    where: 'Recognised on your phone first. If that fails, the picture goes to the AkAI website and on to OpenAI.',
    when: 'Only while you write in the handwriting panel.',
  },
  {
    name: 'Voice typing',
    what: 'What you say.',
    where: "Android's own speech service (usually Google's), under its own privacy policy.",
    when: 'Only after you tap the microphone.',
  },
  {
    name: 'GIF search',
    what: 'The words you search for.',
    where: 'Giphy, using the API key you entered yourself, under Giphy’s privacy policy.',
    when: 'Only when you search in the GIF panel.',
  },
  {
    name: 'Update check',
    what: 'Nothing about you: a request for the latest version number.',
    where: 'The AkAI website.',
    when: 'Only when you tap “Check for updates” in the app.',
  },
];

const KEPT = [
  'Everything you type. AkAI does not record, upload or log your keystrokes.',
  'The words it learns for suggestions, your clipboard history, pinned items, and recent emoji.',
  'Your settings and themes, including themes you make.',
  'Handwriting models, which are downloaded once from Google and then run on your phone.',
];

export default function PrivacyPage() {
  return (
    <main className="land">
      <div className="land-chevron" aria-hidden="true" />
      <article className="land-wrap" style={{ maxWidth: 760, paddingBlock: '56px 72px', lineHeight: 1.6 }}>
        <p style={{ marginBottom: 12 }}>
          <Link href="/" style={{ color: 'var(--on-ink-dim)' }}>← AkAI</Link>
        </p>
        <h1 className="land-display" style={{ fontSize: 'clamp(2.4rem, 8vw, 4rem)', margin: '0 0 16px' }}>
          Privacy policy
        </h1>
        <p className="land-lede" style={{ marginBottom: 40 }}>
          AkAI is a keyboard, so it sees everything you type. It keeps that on your phone. A few features
          need the internet, and they only send what you give them, when you use them.
        </p>

        <h2 className="land-display" style={{ fontSize: '1.8rem', margin: '0 0 12px' }}>Stays on your phone</h2>
        <ul style={{ margin: '0 0 40px', paddingLeft: 20 }}>
          {KEPT.map((k) => <li key={k} style={{ marginBottom: 8 }}>{k}</li>)}
        </ul>

        <h2 className="land-display" style={{ fontSize: '1.8rem', margin: '0 0 12px' }}>Sent only when you use it</h2>
        <div style={{ display: 'grid', gap: 16, marginBottom: 40 }}>
          {SENT.map((s) => (
            <section key={s.name} style={{ border: '1px solid var(--ink-soft)', borderRadius: 12, padding: '16px 18px' }}>
              <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem' }}>{s.name}</h3>
              <p style={{ margin: 0, color: 'var(--on-ink-dim)' }}>
                <strong style={{ color: 'var(--on-ink)' }}>What:</strong> {s.what}<br />
                <strong style={{ color: 'var(--on-ink)' }}>Where:</strong> {s.where}<br />
                <strong style={{ color: 'var(--on-ink)' }}>When:</strong> {s.when}
              </p>
            </section>
          ))}
        </div>

        <h2 className="land-display" style={{ fontSize: '1.8rem', margin: '0 0 12px' }}>Never</h2>
        <p style={{ marginBottom: 40 }}>
          AkAI has no accounts, no ads, no analytics and no tracking. It never sells or shares data. In password
          fields it learns no words and its panels can’t read what you typed.
        </p>

        <h2 className="land-display" style={{ fontSize: '1.8rem', margin: '0 0 12px' }}>Children</h2>
        <p style={{ marginBottom: 40 }}>
          AkAI is not directed at children under 13 and does not knowingly collect information from them.
        </p>

        <h2 className="land-display" style={{ fontSize: '1.8rem', margin: '0 0 12px' }}>Changes</h2>
        <p style={{ marginBottom: 0 }}>
          If this policy changes, the new version will be posted on this page with a new date.
        </p>
        <p style={{ marginTop: 32, color: 'var(--on-ink-dim)', fontSize: '0.9rem' }}>Last updated {UPDATED}.</p>
      </article>
    </main>
  );
}
