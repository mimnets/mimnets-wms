// People: photo, name, position, organization and short biography. Never
// any contact details (D-CONTENT-4).
import EmptyHint from '../../../lib/views/EmptyHint.jsx';

function Person({ person, apos }) {
  const photo = apos.image.first(person._photo);
  const organization = person._organization?.[0];
  return (
    <li className="wms-person">
      {photo && (
        <img
          className="wms-person__photo"
          src={apos.attachment.url(photo, { size: 'one-third' })}
          alt=""
          loading="lazy"
        />
      )}
      <h3 className="wms-person__name">{person.title}</h3>
      {person.jobTitle && <p className="wms-person__job">{person.jobTitle}</p>}
      {organization && <p className="wms-person__org">{organization.title}</p>}
      {person.bio && <p className="wms-person__bio">{person.bio}</p>}
    </li>
  );
}

export default function ({ widget, user }, {
  Area, apos, __t
}) {
  const people = widget._listed || [];
  // Nothing to list: editors get a hint, visitors get no section at all.
  if (!people.length && !user) {
    return null;
  }
  return (
    <section className="wms-section wms-people" id={widget.anchor || undefined}>
      <div className="wms-section__intro">
        <Area doc={widget} name="intro" />
      </div>
      {people.length > 0
        ? (
          <ul className={`wms-grid wms-grid--cols-${widget.columns || '3'}`}>
            {people.map(person => <Person person={person} apos={apos} />)}
          </ul>
        )
        : <EmptyHint user={user} text={__t(widget.mode === 'pick' ? 'project:emptyPick' : 'project:emptyListing')} />}
    </section>
  );
}
