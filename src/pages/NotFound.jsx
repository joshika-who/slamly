import React from 'react';
import Button from '../components/Button';
import {
  FlowerSticker,
  HeartSticker,
  PolaroidIllustration,
  StarSticker,
} from '../assets/ScrapbookDoodles';

/**
 * NotFound Page (*)
 * Friendly scrapbook-themed 404 screen for unknown routes.
 */
function NotFound() {
  return (
    <div className="not-found-page">
      <div className="container">
        <div className="paper-card not-found-card">
          <span className="washi-tape washi-tape--pink" aria-hidden="true" />

          <div className="not-found-card__stickers" aria-hidden="true">
            <StarSticker size={24} />
            <HeartSticker size={24} />
            <FlowerSticker size={24} />
          </div>

          <div className="not-found-card__illustration">
            <PolaroidIllustration caption="Page missing from this slam book!" />
          </div>

          <span className="badge badge--lavender">Error 404 &bull; Missing Keepsake Page</span>

          <h1 className="not-found-card__title">
            Oops! It looks like this page slipped out of the slam book.
          </h1>

          <p className="not-found-card__description">
            The link you followed may be broken, or this page hasn&rsquo;t been written yet. Let&rsquo;s
            head back to your slam book shelf or the home page.
          </p>

          <div className="not-found-card__actions">
            <Button to="/" variant="primary" size="lg">
              Back to Home Page
            </Button>
            <Button to="/dashboard" variant="secondary" size="lg">
              Open My Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotFound;

