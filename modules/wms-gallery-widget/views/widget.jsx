// Gallery markup. Thumbnails are plain links to the full image, so the
// gallery is usable without JavaScript; ../ui/src/index.js turns them into
// a lightbox.

function caption(image, source) {
  if (source === 'title') {
    return image.title || '';
  }
  if (source === 'credit') {
    return image.credit || '';
  }
  return '';
}

export default function ({ widget }, {
  Area, apos, __t
}) {
  const images = (widget._images || [])
    .map(image => ({
      attachment: apos.image.first(image),
      caption: caption(image, widget.captionSource)
    }))
    .filter(image => image.attachment);
  const label = __t('project:galleryLabel');
  return (
    <section className="wms-section wms-gallery" id={widget.anchor || undefined}>
      <div className="wms-section__intro">
        <Area doc={widget} name="intro" />
      </div>
      {images.length > 0 && (
        <ul
          className={`wms-gallery__grid wms-gallery__grid--cols-${widget.columns || '4'}`}
          data-wms-gallery
          data-label={label}
          data-close-label={__t('project:lightboxClose')}
          data-prev-label={__t('project:lightboxPrevious')}
          data-next-label={__t('project:lightboxNext')}
          data-counter-label={__t('project:lightboxCounter', {
            current: '{current}',
            total: '{total}'
          })}
        >
          {images.map(({ attachment, caption: text }) => (
            <li className="wms-gallery__item">
              <figure className="wms-gallery__figure">
                <a
                  className="wms-gallery__link"
                  href={apos.attachment.url(attachment, { size: 'max' })}
                  data-gallery-link
                  data-caption={text || undefined}
                >
                  <img
                    src={apos.attachment.url(attachment, { size: 'one-third' })}
                    alt={attachment._alt || ''}
                    loading="lazy"
                  />
                </a>
                {text && <figcaption className="wms-gallery__caption">{text}</figcaption>}
              </figure>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
