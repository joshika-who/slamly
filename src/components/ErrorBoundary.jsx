import React from 'react';
import {
  FlowerSticker,
  HeartSticker,
  PolaroidIllustration,
  StarSticker,
} from '../assets/ScrapbookDoodles';

/**
 * Top-level React Error Boundary.
 * Catches unexpected runtime errors anywhere in the component tree and renders a
 * friendly scrapbook-themed recovery screen with a Reload button and a Back to Home link.
 * Never displays raw error messages or stack traces to users.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
    };
    this.handleReload = this.handleReload.bind(this);
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    // Log minimal diagnostic info in development only; never render raw error text or stack traces in UI
    if (import.meta.env.DEV) {
      console.error('[Slamly ErrorBoundary] Caught unexpected render error:', error?.message);
    }
  }

  handleReload() {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="not-found-page" role="alert">
          <div className="container">
            <div className="paper-card not-found-card">
              <span className="washi-tape washi-tape--pink" aria-hidden="true" />

              <div className="not-found-card__stickers" aria-hidden="true">
                <HeartSticker size={22} />
                <FlowerSticker size={22} />
                <StarSticker size={22} />
              </div>

              <div className="not-found-card__illustration">
                <PolaroidIllustration caption="A page slipped out of the binder!" />
              </div>

              <span className="badge badge--pink">Unexpected Hiccup</span>

              <h1 className="not-found-card__title">Something went wrong</h1>

              <p className="not-found-card__description">
                We hit an unexpected bump while opening this page. Your saved slam books and
                responses are safe — try reloading the page or heading back to the home screen.
              </p>

              <div className="not-found-card__actions">
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  onClick={this.handleReload}
                >
                  Reload Page
                </button>
                <a href="/" className="btn btn-secondary btn-lg">
                  Back to Home
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

