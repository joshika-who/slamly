import React, { useState } from 'react';
import Button from '../components/Button';
import {
  FlowerSticker,
  HeartSticker,
  PolaroidIllustration,
  StarSticker,
} from '../assets/ScrapbookDoodles';

const HERO_SAMPLE_ENTRIES = [
  {
    friend: 'Rohan ("Ro")',
    date: 'Oct 28',
    caption: 'Hostel Roof & Chai Nights ✨',
    variant: 'friends',
    alt: 'Illustrated polaroid of two friends smiling under a sunny sky',
    q1: 'First impression of you:',
    a1: '"Thought you were super quiet until you started the 2 AM hostel karaoke!"',
    q2: 'Our best memory together:',
    a2: '"Getting caught in the rain after our final exam and celebrating with samosas."',
    q3: 'Song that reminds me of you:',
    a3: 'Purani Jeans — Ali Haider 🎸',
  },
  {
    friend: 'Meera K.',
    date: 'Oct 29',
    caption: 'Last Bench Sketchbook 🌸',
    variant: 'notes',
    alt: 'Illustrated polaroid of a handwritten notebook card and pastel sticker',
    q1: 'First impression of you:',
    a1: '"The person with the colour-coded pens who saved my lab record!"',
    q2: 'Our best memory together:',
    a2: '"Laughing so hard in the library that we both got kicked out."',
    q3: 'Song that reminds me of you:',
    a3: 'Ilahi — Yeh Jawaani Hai Deewani ☀️',
  },
];

const STEPS = [
  {
    number: '1',
    title: 'Step 1: Create your book',
    tapeClass: '',
    badgeBg: '#FAD2DD',
    description:
      'Pick a nostalgic ready-made template (Friendship, College Memories, School Farewell, Birthday, or Icebreakers) or design your own questions and pastel cover from scratch.',
  },
  {
    number: '2',
    title: 'Step 2: Share your unique link',
    tapeClass: 'tape-lavender',
    badgeBg: '#E4DAF6',
    description:
      'Generate a private shareable link for your slam book and send it on WhatsApp, Instagram, or group chats. Friends can sign your book right in their browser—no account required.',
  },
  {
    number: '3',
    title: 'Step 3: Collect memories from friends',
    tapeClass: 'tape-sage',
    badgeBg: '#D5E8DA',
    description:
      'Watch heartfelt answers, inside jokes, and polaroid keepsakes arrive in your private dashboard—and export your finished slam book as a printable PDF keepsake.',
  },
];

const FEATURES = [
  {
    title: 'Personalised slam books',
    bg: '#FAD2DD',
    description:
      'Choose warm scrapbook paper textures, washi tape accents, custom covers, and handwritten typography that reflect your personality.',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15Z"
          stroke="#261F1C"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: 'Custom questions',
    bg: '#E4DAF6',
    description:
      'Add, edit, remove, and reorder prompts—from short nicknames and dates to long-form stories and multiple-choice questions.',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z"
          stroke="#261F1C"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: 'Ready-made templates',
    bg: '#FDE0C6',
    description:
      'Short on time? Start immediately with thoughtfully curated question sets for Friendship, College Memories, School Farewell, Birthdays, and more.',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="#261F1C" strokeWidth="2.2" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="#261F1C" strokeWidth="2.2" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="#261F1C" strokeWidth="2.2" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="#261F1C" strokeWidth="2.2" />
      </svg>
    ),
  },
  {
    title: 'No account required for friends to respond',
    bg: '#D5E8DA',
    description:
      'Zero friction for your friends. Anyone with your unique link can open your slam book and fill in their page without signing up.',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
          stroke="#261F1C"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: 'Private response dashboard',
    bg: '#FCF0C2',
    description:
      'Your slam books belong only to you. Manage open/closed status, read private entries, and curate responses in one calm workspace.',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="11" width="18" height="10" rx="2" stroke="#261F1C" strokeWidth="2.2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#261F1C" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'PDF memory export',
    bg: '#FAD2DD',
    description:
      'Turn your completed digital slam book into a beautifully formatted, downloadable PDF keepsake you can print or archive forever.',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
          stroke="#261F1C"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export default function Home() {
  const [activeEntryIdx, setActiveEntryIdx] = useState(0);
  const currentEntry = HERO_SAMPLE_ENTRIES[activeEntryIdx];

  function scrollToHowItWorks(e) {
    e.preventDefault();
    const el = document.getElementById('how-it-works');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  return (
    <div>
      {/* ==================== 1. HERO SECTION ==================== */}
      <section className="hero-section" aria-labelledby="hero-heading">
        <div className="container hero-grid">
          <div>
            <span className="sticker-pill">
              <StarSticker size={20} fill="#FAD2DD" />
              Your Personal Digital Slam Book
            </span>

            <h1 id="hero-heading" className="hero-title">
              Every friend. Every memory.{' '}
              <span className="hero-highlight">One little book.</span>
            </h1>

            <p className="hero-subtitle">
              Bring back the warmth of passing a physical slam book around class.
              Design your personalised memory book in minutes, share a link with
              friends, and keep their stories, inside jokes, and polaroids safe
              forever.
            </p>

            <div className="hero-cta-group">
              <Button to="/create" variant="primary" size="lg">
                Create your slam book
              </Button>
              <Button
                href="#how-it-works"
                onClick={scrollToHowItWorks}
                variant="secondary"
                size="lg"
              >
                See how it works
              </Button>
            </div>

            <div className="hero-trust-row">
              <span>&#10003; Free to start</span>
              <span>&#10003; Friends answer without an account</span>
              <span>&#10003; Private &amp; exportable</span>
            </div>
          </div>

          {/* Interactive Scrapbook Visual Mockup */}
          <div className="scrapbook-stage" aria-label="Interactive Slamly scrapbook preview">
            <div className="washi-tape" aria-hidden="true" />

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <span
                className="handwritten"
                style={{ fontSize: '1.35rem', fontWeight: 700 }}
              >
                📖 Aanya&apos;s Grad Slam Book (Page {activeEntryIdx + 1} of 2)
              </span>

              <div style={{ display: 'flex', gap: '6px' }}>
                {HERO_SAMPLE_ENTRIES.map((entry, idx) => (
                  <button
                    key={entry.friend}
                    type="button"
                    onClick={() => setActiveEntryIdx(idx)}
                    className={`tab-btn ${activeEntryIdx === idx ? 'active' : ''}`}
                    style={{ minHeight: '44px', padding: '6px 12px', fontSize: '0.8rem' }}
                  >
                    {entry.friend.split(' ')[0]}&apos;s Page
                  </button>
                ))}
              </div>
            </div>

            <div className="scrapbook-spread">
              {/* Left side: Polaroid frame + stickers */}
              <div
                className="polaroid-frame"
                style={{ transform: 'rotate(-2deg)', position: 'relative' }}
              >
                <div
                  style={{ position: 'absolute', top: '-12px', left: '-12px' }}
                  aria-hidden="true"
                >
                  <FlowerSticker size={32} fill="#E4DAF6" />
                </div>
                <PolaroidIllustration
                  variant={currentEntry.variant}
                  alt={currentEntry.alt}
                />
                <div className="polaroid-caption">{currentEntry.caption}</div>
                <div
                  style={{
                    fontSize: '0.78rem',
                    textAlign: 'center',
                    color: 'var(--color-ink-soft)',
                    fontWeight: 600,
                    marginTop: '4px',
                  }}
                >
                  Signed by {currentEntry.friend} &bull; {currentEntry.date}
                </div>
              </div>

              {/* Right side: Lined paper response card */}
              <div className="scrapbook-note-card">
                <div
                  style={{ position: 'absolute', top: '-10px', right: '12px' }}
                  aria-hidden="true"
                >
                  <HeartSticker size={26} fill="#FAD2DD" />
                </div>

                <div className="scrapbook-qa-item" style={{ marginTop: 0 }}>
                  <div className="scrapbook-q">{currentEntry.q1}</div>
                  <div className="scrapbook-a">{currentEntry.a1}</div>
                </div>

                <div className="scrapbook-qa-item">
                  <div className="scrapbook-q">{currentEntry.q2}</div>
                  <div className="scrapbook-a">{currentEntry.a2}</div>
                </div>

                <div className="scrapbook-qa-item" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                  <div className="scrapbook-q">{currentEntry.q3}</div>
                  <div className="scrapbook-a">{currentEntry.a3}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 2. HOW IT WORKS SECTION ==================== */}
      <section
        id="how-it-works"
        tabIndex="-1"
        className="section-block section-alt"
        aria-labelledby="how-it-works-heading"
      >
        <div className="container">
          <div className="section-header">
            <span className="sticker-pill" style={{ background: '#E4DAF6' }}>
              Simple 3-Step Magic
            </span>
            <h2 id="how-it-works-heading" className="section-title">
              How Slamly Works
            </h2>
            <p>
              No complicated setup. Create a warm space for your friends to leave
              their mark in under two minutes.
            </p>
          </div>

          <div className="steps-grid">
            {STEPS.map((step) => (
              <article key={step.number} className="step-card">
                <div className={`washi-tape ${step.tapeClass}`} aria-hidden="true" />
                <div
                  className="step-number-badge"
                  style={{ backgroundColor: step.badgeBg }}
                  aria-hidden="true"
                >
                  {step.number}
                </div>
                <h3 style={{ fontSize: '1.55rem' }}>{step.title}</h3>
                <p style={{ fontSize: '0.96rem' }}>{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== 3. FEATURES SECTION ==================== */}
      <section
        id="features"
        tabIndex="-1"
        className="section-block"
        aria-labelledby="features-heading"
      >
        <div className="container">
          <div className="section-header">
            <span className="sticker-pill" style={{ background: '#D5E8DA' }}>
              Crafted for Keepsakes
            </span>
            <h2 id="features-heading" className="section-title">
              Everything You Need in One Little Book
            </h2>
            <p>
              Thoughtfully designed so every slam book feels personal, private,
              and effortless to share.
            </p>
          </div>

          <div className="features-grid">
            {FEATURES.map((feat) => (
              <article key={feat.title} className="feature-card">
                <div
                  className="feature-icon-box"
                  style={{ backgroundColor: feat.bg }}
                >
                  {feat.icon}
                </div>
                <h3 style={{ fontSize: '1.45rem', marginBottom: '8px' }}>
                  {feat.title}
                </h3>
                <p style={{ fontSize: '0.94rem' }}>{feat.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== 4. CLOSING CTA SECTION ==================== */}
      <section className="section-block" aria-labelledby="closing-cta-heading">
        <div className="container">
          <div className="closing-cta-card">
            <div className="washi-tape tape-sage" aria-hidden="true" />
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '10px',
                marginBottom: '12px',
              }}
              aria-hidden="true"
            >
              <StarSticker size={28} fill="#FCF0C2" />
              <HeartSticker size={28} fill="#FFFDF9" />
              <FlowerSticker size={28} fill="#D5E8DA" />
            </div>

            <h2
              id="closing-cta-heading"
              style={{ fontSize: 'clamp(2.2rem, 4vw, 3.1rem)', marginBottom: '14px' }}
            >
              Ready to start your first slam book?
            </h2>

            <p
              style={{
                maxWidth: '560px',
                margin: '0 auto 28px',
                color: 'var(--color-ink)',
                fontSize: '1.06rem',
                fontWeight: 500,
              }}
            >
              Years from now, you&apos;ll love reading the nicknames, inside jokes,
              and messages your friends wrote today. Start from a template or a
              fresh blank page.
            </p>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '14px',
              }}
            >
              <Button to="/create" variant="secondary" size="lg">
                Create your first book
              </Button>
              <Button to="/signup" variant="primary" size="lg">
                Sign up for free
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

