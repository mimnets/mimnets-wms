// Key figures: value, label and an optional source or "as of" note.

export default function ({ widget }, { Area }) {
  const items = widget.items || [];
  return (
    <section className="wms-section wms-stats" id={widget.anchor || undefined}>
      <div className="wms-section__intro">
        <Area doc={widget} name="intro" />
      </div>
      {items.length > 0 && (
        <ul className="wms-stats__list">
          {items.map(item => (
            <li className="wms-stats__item">
              <p className="wms-stats__value">{item.value}</p>
              <p className="wms-stats__label">{item.label}</p>
              {item.note && <p className="wms-stats__note">{item.note}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
