import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import {
  FlowerSticker,
  HeartSticker,
  StarSticker,
} from '../assets/ScrapbookDoodles';

/**
 * Privacy Page (/privacy)
 * Plain-language privacy summary for Slamly.
 * Uses explicit placeholders ([YOUR NAME], [CONTACT EMAIL], [LAST UPDATED DATE])
 * rather than invented company names, addresses, or dates.
 */
function Privacy() {
  return (
    <div className="legal-page">
      <div className="container">
        <div className="paper-card legal-card">
          <span className="washi-tape washi-tape--pink" aria-hidden="true" />

          <div className="legal-disclaimer" role="note">
            This is a plain-language summary, not legal advice.
          </div>

          <header className="legal-card__header">
            <div className="legal-card__stickers" aria-hidden="true">
              <HeartSticker size={22} />
              <FlowerSticker size={22} />
              <StarSticker size={22} />
            </div>
            <span className="badge badge--pink">Privacy Summary</span>
            <h1 className="legal-card__title">Privacy on Slamly</h1>
            <p className="legal-card__updated">
              Last updated: <strong>[LAST UPDATED DATE]</strong>
            </p>
          </header>

          <div className="legal-content lined-paper">
            <section className="legal-section" aria-labelledby="privacy-account-heading">
              <h2 id="privacy-account-heading">1. Account Data</h2>
              <p>
                When you create a Slamly account to make slam books, we collect your{' '}
                <strong>name</strong> and <strong>email address</strong>. Sign-in and passwords are
                handled by <strong>Firebase Authentication</strong> (a Google service). Friends who
                only fill out a shared slam book do not need an account.
              </p>
            </section>

            <section className="legal-section" aria-labelledby="privacy-content-heading">
              <h2 id="privacy-content-heading">2. Books, Responses &amp; Photos</h2>
              <p>
                Slam books, questions, and friends&rsquo; responses (their name or nickname,
                written answers, and optional photo) are stored in{' '}
                <strong>Google Cloud Firestore</strong>.
              </p>
              <p>
                If a friend attaches an optional photo to their response, the photo is resized in
                their browser and location data (EXIF metadata) is removed before upload. Each
                response may have at most one small photo stored directly inside that response
                record.
              </p>
            </section>

            <section className="legal-section" aria-labelledby="privacy-visibility-heading">
              <h2 id="privacy-visibility-heading">3. Who Can See What</h2>
              <ul>
                <li>
                  <strong>Only the book owner can read responses.</strong> Friends cannot see other
                  people&rsquo;s responses or photos.
                </li>
                <li>
                  <strong>Anyone with a published book&rsquo;s link</strong> can open that book,
                  read its title, description, and questions, and submit a response with no account.
                </li>
                <li>
                  If the owner sets a book to <strong>Draft</strong>, the public link is turned off.
                  If the owner sets a book to <strong>Closed</strong>, the link shows that responses
                  are closed.
                </li>
              </ul>
            </section>

            <section className="legal-section" aria-labelledby="privacy-security-heading">
              <h2 id="privacy-security-heading">4. Abuse Prevention &amp; Hosting</h2>
              <p>
                We use <strong>Google reCAPTCHA</strong> and <strong>Firebase App Check</strong> to
                help stop automated spam and abuse. Those Google services may process technical
                information from your browser, such as your IP address and device details, to verify
                that requests come from a real browser.
              </p>
              <p>
                The Slamly web app is hosted on <strong>Vercel</strong>, which processes standard
                web request data (such as IP addresses) to deliver pages to your browser.
              </p>
            </section>

            <section className="legal-section" aria-labelledby="privacy-no-ads-heading">
              <h2 id="privacy-no-ads-heading">5. No Ads &amp; No Selling Data</h2>
              <p>
                Slamly has <strong>no ads</strong> and <strong>does not sell your personal data</strong>{' '}
                or your friends&rsquo; responses to anyone.
              </p>
            </section>

            <section className="legal-section" aria-labelledby="privacy-deletion-heading">
              <h2 id="privacy-deletion-heading">6. Editing &amp; Deleting Data</h2>
              <ul>
                <li>
                  <strong>Book owners:</strong> You can edit or delete any individual response,
                  delete any slam book, or permanently delete your account and all of your books and
                  responses from the <Link to="/account">Account page</Link>.
                </li>
                <li>
                  <strong>Friends who submitted a response:</strong> Because responses are submitted
                  without an account, please contact the owner of the slam book if you want your
                  response or photo edited or removed. If you cannot reach the book owner, email{' '}
                  <strong>[CONTACT EMAIL]</strong> and let us know which book link and name you used.
                </li>
              </ul>
            </section>

            <section className="legal-section" aria-labelledby="privacy-contact-heading">
              <h2 id="privacy-contact-heading">7. Contact</h2>
              <p>
                Slamly is operated by <strong>[YOUR NAME]</strong>. If you have questions about this
                privacy summary or need help removing content, contact{' '}
                <strong>[CONTACT EMAIL]</strong>.
              </p>
            </section>
          </div>

          <footer className="legal-card__footer">
            <Button to="/" variant="secondary" size="sm">
              &larr; Back to Home
            </Button>
            <Button to="/terms" variant="primary" size="sm">
              Read Terms of Use &rarr;
            </Button>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default Privacy;

