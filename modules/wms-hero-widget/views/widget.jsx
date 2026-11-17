// Hero banner. `widget` holds the fields defined in ../index.js.
import BannerButtons from '../../../lib/views/BannerButtons.jsx';

export default function ({ widget }, { Area, apos }) {
  const image = widget._backgroundImage?.[0];
  const attachment = image && apos.image.first(image);
  const style = attachment
    ? `background-image: url("${apos.attachment.url(attachment, { size: 'max' })}");` +
      (apos.attachment.hasFocalPoint(attachment)
        ? ` background-position: ${apos.attachment.focalPointToObjectPosition(attachment)};`
        : '')
    : '';

  return (
    <section
      className={`wms-hero wms-hero--overlay-${widget.overlay || 'dark'}${attachment ? ' wms-hero--has-image' : ''}`}
      style={style}
      aria-label={attachment?._alt || 'Hero'}
    >
      <div className="wms-hero__inner">
        {widget.eyebrow && (
          <p className="wms-hero__eyebrow">{widget.eyebrow}</p>
        )}
        <div className="wms-hero__content">
          <Area doc={widget} name="content" />
        </div>
        <BannerButtons items={widget.buttons} className="wms-hero__buttons" />
      </div>
    </section>
  );
}
