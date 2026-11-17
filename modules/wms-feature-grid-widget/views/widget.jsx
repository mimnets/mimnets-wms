// Feature grid: optional heading and intro, then one card per item.
import { linkHref } from '../../../lib/link.js';

function Item({ item, apos }) {
  const attachment = apos.image.first(item._image?.[0]);
  const href = item.hasLink ? linkHref(item) : null;
  return (
    <li className="wms-card wms-feature" id={item.anchor || undefined}>
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
        <h3 className="wms-card__title">{item.title}</h3>
        {item.text && <p className="wms-card__text">{item.text}</p>}
        {href && <a className="wms-card__link" href={href}>{item.linkText}</a>}
      </div>
    </li>
  );
}

export default function ({ widget }, { Area, apos }) {
  const items = widget.items || [];
  return (
    <section className="wms-section wms-feature-grid" id={widget.anchor || undefined}>
      <div className="wms-section__intro">
        <Area doc={widget} name="intro" />
      </div>
      {items.length > 0 && (
        <ul className={`wms-grid wms-grid--cols-${widget.columns || '3'}`}>
          {items.map(item => <Item item={item} apos={apos} />)}
        </ul>
      )}
    </section>
  );
}
