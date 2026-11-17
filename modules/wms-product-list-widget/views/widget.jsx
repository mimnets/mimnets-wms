// Product list: one card per published product. Editors see a hint when the
// list is empty; visitors see nothing.
import EmptyHint from '../../../lib/views/EmptyHint.jsx';

function ProductCard({ product, apos }) {
  const attachment = apos.image.first(product._image);
  return (
    <li className="wms-card">
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
        <h3 className="wms-card__title">{product.displayTitle || product.title}</h3>
        {product.summary && <p className="wms-card__text">{product.summary}</p>}
      </div>
    </li>
  );
}

export default function ({ widget, user }, {
  Area, apos, __t
}) {
  const products = widget._listed || [];
  // Nothing to list: editors get a hint, visitors get no section at all.
  if (!products.length && !user) {
    return null;
  }
  return (
    <section className="wms-section wms-product-list" id={widget.anchor || undefined}>
      <div className="wms-section__intro">
        <Area doc={widget} name="intro" />
      </div>
      {products.length > 0
        ? (
          <ul className={`wms-grid wms-grid--cols-${widget.columns || '3'}`}>
            {products.map(product => <ProductCard product={product} apos={apos} />)}
          </ul>
        )
        : <EmptyHint user={user} text={__t(widget.mode === 'pick' ? 'project:emptyPick' : 'project:emptyProductCategory')} />}
    </section>
  );
}
