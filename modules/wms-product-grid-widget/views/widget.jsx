export default function ({ widget }, { Area }) {
  return (
    <section className="wms-products" id={widget.anchor || undefined}>
      <div className="wms-products__intro">
        <Area doc={widget} name="intro" />
      </div>
      <div className={`wms-products__grid wms-products__grid--cols-${widget.columns || '3'}`}>
        <Area doc={widget} name="cards" />
      </div>
    </section>
  );
}
