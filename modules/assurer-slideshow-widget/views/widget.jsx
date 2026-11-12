// Slideshow markup. Renders every slide server-side so the content is
// usable without JavaScript; the player in ../ui/src/index.js adds
// navigation, autoplay and the pause button.
//
// Missing options (slideshows saved before m1-072) fall back to the same
// defaults as the schema, which is today's look.
import BannerButtons from '../../../lib/views/BannerButtons.jsx';

const HEADING_TAGS = [ 'h1', 'h2', 'h3', 'p' ];

function SlideText({ slide }) {
  const Heading = HEADING_TAGS.includes(slide.headingLevel) ? slide.headingLevel : 'h2';
  return (
    <div className={`assurer-slideshow__text assurer-slideshow__text--${slide.textAcross || 'left'} assurer-slideshow__text--${slide.textDown || 'middle'} assurer-slideshow__text--overlay-${slide.overlay || 'dark'}`}>
      <div className="assurer-slideshow__text-inner" data-slide-text>
        {slide.eyebrow && <p className="assurer-slideshow__eyebrow">{slide.eyebrow}</p>}
        {slide.heading && <Heading className="assurer-slideshow__heading">{slide.heading}</Heading>}
        {slide.text && <p className="assurer-slideshow__body">{slide.text}</p>}
        <BannerButtons items={slide.buttons} className="assurer-slideshow__buttons" />
      </div>
    </div>
  );
}

export default function ({ widget }, { apos, __t }) {
  const slides = (widget.slides || [])
    .map(slide => ({
      ...slide,
      attachment: apos.image.first(slide._image?.[0]),
      hasText: !!(slide.eyebrow || slide.heading || slide.text || slide.buttons?.length)
    }))
    .filter(slide => slide.attachment);

  if (!slides.length) {
    return <div className="assurer-slideshow assurer-slideshow--empty">No slides yet.</div>;
  }

  const controls = widget.controls || 'both';
  const classes = [
    'assurer-slideshow',
    `assurer-slideshow--height-${widget.height || 'short'}`,
    `assurer-slideshow--width-${widget.width || 'content'}`,
    `assurer-slideshow--transition-${widget.transition || 'fade'}`,
    `assurer-slideshow--effect-${widget.imageEffect || 'none'}`,
    `assurer-slideshow--enter-${widget.textEntrance || 'rise'}`
  ].join(' ');

  return (
    <section
      className={classes}
      aria-roledescription="carousel"
      aria-label="Slideshow"
      data-assurer-slideshow
      data-autoplay={widget.autoplay ? 'true' : 'false'}
      data-interval={String((widget.interval || 6) * 1000)}
    >
      <div className="assurer-slideshow__track" aria-live="polite" data-track>
        {slides.map((slide, i) => (
          <figure
            className={`assurer-slideshow__slide${i === 0 ? ' is-active' : ''}${slide.hasText ? ' has-text' : ''}`}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${slides.length}`}
            data-slide
          >
            <img
              className="assurer-slideshow__image"
              src={apos.attachment.url(slide.attachment, { size: 'full' })}
              srcset={apos.image.srcset(slide.attachment)}
              sizes="100vw"
              alt={slide.attachment._alt || ''}
              loading={i === 0 ? 'eager' : 'lazy'}
              style={apos.attachment.hasFocalPoint(slide.attachment)
                ? `object-position: ${apos.attachment.focalPointToObjectPosition(slide.attachment)}`
                : undefined}
            />
            {slide.hasText && <SlideText slide={slide} />}
            {slide.caption && (
              <figcaption className="assurer-slideshow__caption">{slide.caption}</figcaption>
            )}
          </figure>
        ))}
      </div>
      {slides.length > 1 && (
        <div className="assurer-slideshow__controls">
          {widget.autoplay && (
            <button
              type="button"
              className="assurer-slideshow__pause"
              data-pause
              data-label-pause={__t('project:slideshowPause')}
              data-label-play={__t('project:slideshowPlay')}
              aria-label={__t('project:slideshowPause')}
            >
              <svg className="assurer-slideshow__icon-pause" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
                <rect x="3" y="2" width="3.5" height="12" />
                <rect x="9.5" y="2" width="3.5" height="12" />
              </svg>
              <svg className="assurer-slideshow__icon-play" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
                <path d="M4 2l10 6-10 6z" />
              </svg>
            </button>
          )}
          {controls !== 'dots' && (
            <button type="button" className="assurer-slideshow__prev" data-prev aria-label="Previous slide">‹</button>
          )}
          {controls !== 'arrows' && (
            <div className="assurer-slideshow__dots">
              {slides.map((s, i) => (
                <button
                  type="button"
                  className={`assurer-slideshow__dot${i === 0 ? ' is-active' : ''}`}
                  data-dot={String(i)}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          )}
          {controls !== 'dots' && (
            <button type="button" className="assurer-slideshow__next" data-next aria-label="Next slide">›</button>
          )}
        </div>
      )}
    </section>
  );
}
