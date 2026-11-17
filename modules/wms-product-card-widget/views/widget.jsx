import { linkHref } from '../../../lib/link.js';

export default function ({ widget }, { Area, apos }) {
  const attachment = apos.image.first(widget._image?.[0]);
  const href = widget.hasLink ? linkHref(widget) : null;

  return (
    <article className="wms-card">
      {attachment && (
        <div className="wms-card__media">
          <img
            src={apos.attachment.url(attachment, { size: 'one-half' })}
            srcset={apos.image.srcset(attachment)}
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            alt={attachment._alt || ''}
            loading="lazy"
          />
        </div>
      )}
      <div className="wms-card__body">
        {widget.badge && <span className="wms-card__badge">{widget.badge}</span>}
        <h3 className="wms-card__title">{widget.title}</h3>
        <div className="wms-card__text">
          <Area doc={widget} name="body" />
        </div>
        {href && (
          <a className="wms-card__link" href={href}>{widget.linkText || 'Learn more'}</a>
        )}
      </div>
    </article>
  );
}
