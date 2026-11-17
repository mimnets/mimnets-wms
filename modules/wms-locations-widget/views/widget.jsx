// Locations: name, organization, optional postal address, city and country,
// and business contact details only where the location allows it.
import EmptyHint from '../../../lib/views/EmptyHint.jsx';

function Location({
  location, showAddress, __t
}) {
  const address = location.address || {};
  const organization = location._organization?.[0];
  const phone = location.showContact && location.publicPhone;
  const email = location.showContact && location.publicEmail;
  const street = showAddress ? [ address.line1, address.line2 ].filter(Boolean) : [];
  const place = [
    showAddress && address.postalCode,
    location.city,
    showAddress && address.region
  ].filter(Boolean).join(' ');
  return (
    <li className="wms-location">
      <h3 className="wms-location__name">{location.title}</h3>
      {organization && <p className="wms-location__org">{organization.title}</p>}
      <address className="wms-location__address">
        {street.map(line => <span className="wms-location__line">{line}</span>)}
        {place && <span className="wms-location__line">{place}</span>}
        <span className="wms-location__line">{location.country}</span>
      </address>
      {(phone || email) && (
        <ul className="wms-location__contact" aria-label={__t('project:contactFor', { name: location.title })}>
          {phone && <li><a href={`tel:${phone.replace(/[^+0-9]/g, '')}`}>{phone}</a></li>}
          {email && <li><a href={`mailto:${email}`}>{email}</a></li>}
        </ul>
      )}
    </li>
  );
}

export default function ({ widget, user }, { Area, __t }) {
  const locations = widget._listed || [];
  // Nothing to list: editors get a hint, visitors get no section at all.
  if (!locations.length && !user) {
    return null;
  }
  return (
    <section className="wms-section wms-locations" id={widget.anchor || undefined}>
      <div className="wms-section__intro">
        <Area doc={widget} name="intro" />
      </div>
      {locations.length > 0
        ? (
          <ul className={`wms-grid wms-grid--cols-${widget.columns || '3'}`}>
            {locations.map(location => (
              <Location location={location} showAddress={widget.showAddress !== false} __t={__t} />
            ))}
          </ul>
        )
        : <EmptyHint user={user} text={__t(widget.mode === 'pick' ? 'project:emptyPick' : 'project:emptyListing')} />}
    </section>
  );
}
