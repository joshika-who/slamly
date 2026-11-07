import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import {
  FlowerSticker,
  HeartSticker,
  StarSticker,
} from '../assets/ScrapbookDoodles';

/**
 * Terms Page (/terms)
 * Plain-language terms of use for Slamly.
 * Uses explicit placeholders ([YOUR NAME], [CONTACT EMAIL], [LAST UPDATED DATE])
 * rather than invented company names, addresses, or dates.
 */
function Terms() {
  return (
    <div className="legal-page">
      <div className="container">
        <div className="paper-card legal-card">
          <span className="washi-tape washi-tape--lavender" aria-hidden="true" />

          <div className="legal-disclaimer" role="note">
            This is a plain-language summary, not legal advice.
          </div>

          <header className="legal-card__header">
            <div className="legal-card__stickers" aria-hidden="true">
              <StarSticker size={22} />
              <HeartSticker size={22} />
              <FlowerSticker size={22} />
            </div>
            <span className="badge badge--lavender">Terms of Use</span>
            <h1 className="legal-card__title">Terms of Use</h1>
            <p className="legal-card__updated">
              Last updated: <strong>[LAST UPDATED DATE]</strong>
            </p>
          </header>

          <div className="legal-content lined-paper">
            <section className="legal-section" aria-labelledby="terms-acceptable-heading">
              <h2 id="terms-acceptable-heading">1. Be Kind &amp; Respectful (Acceptable Use)</h2>
              <p>
                Slamly is a personal digital keepsake book for friends, classmates, and loved ones.
                When creating books or submitting responses, you agree <strong>not</strong> to post
                or upload:
              </p>
              <ul>
                <li>Harassment, bullying, threats, or impersonation of others.</li>
                <li>Hate speech, discrimination, or abusive language.</li>
                <li>Illegal content, sexually explicit content, or spam.</li>
                <li>Photos of other people without their permission.</li>
              </ul>
            </section>

            <section className="legal-section" aria-labelledby="terms-owner-heading">
              <h2 id="terms-owner-heading">2. Book Owner Responsibilities</h2>
              <p>
                If you create a slam book, you are responsible for the questions you write and for
                who you share your public link with. Remember that anyone who has the link to a{' '}
                <strong>Published</strong> book can open it and submit a response. You can close a
                book or delete unwanted responses at any time from your dashboard.
              </p>
            </section>

            <section className="legal-section" aria-labelledby="terms-moderation-heading">
              <h2 id="terms-moderation-heading">3. Content Removal &amp; Abuse</h2>
              <p>
                Book owners can edit or delete any response in their own slam books. We may also
                remove responses, books, or accounts if they are reported for abuse or violate these
                terms.
              </p>
            </section>

            <section className="legal-section" aria-labelledby="terms-asis-heading">
              <h2 id="terms-asis-heading">4. Provided &ldquo;As Is&rdquo;</h2>
              <p>
                Slamly is provided <strong>&ldquo;as is&rdquo;</strong> without warranties of any
                kind. While we take care to keep your slam books safe, we cannot guarantee
                uninterrupted availability or that data will never be lost. We recommend downloading
                a keepsake PDF copy of your favorite slam books for safekeeping.
              </p>
            </section>

            <section className="legal-section" aria-labelledby="terms-contact-heading">
              <h2 id="terms-contact-heading">5. Contact</h2>
              <p>
                Slamly is operated by <strong>[YOUR NAME]</strong>. To report abuse or ask a
                question about these terms, email <strong>[CONTACT EMAIL]</strong>. You can also
                read our <Link to="/privacy">Privacy summary</Link>.
              </p>
            </section>
          </div>

          <footer className="legal-card__footer">
            <Button to="/" variant="secondary" size="sm">
              &larr; Back to Home
            </Button>
            <Button to="/privacy" variant="primary" size="sm">
              Read Privacy Summary &rarr;
            </Button>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default Terms;

