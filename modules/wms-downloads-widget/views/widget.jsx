// Downloads: one row per file, with its title as the link, the description,
// and the type and size from the attachment.
import { fileSize, fileType } from '../../../lib/file-meta.js';
import EmptyHint from '../../../lib/views/EmptyHint.jsx';

function Download({ file, apos }) {
  const attachment = file.attachment;
  if (!attachment) {
    return null;
  }
  const meta = [ fileType(attachment), fileSize(attachment.length) ].filter(Boolean).join(', ');
  return (
    <li className="wms-download">
      <a className="wms-download__link" href={apos.attachment.url(attachment, { size: 'original' })}>
        {file.title}
        {meta && <span className="wms-download__meta"> ({meta})</span>}
      </a>
      {file.description && <p className="wms-download__description">{file.description}</p>}
    </li>
  );
}

export default function ({ widget, user }, {
  Area, apos, __t
}) {
  const files = (widget._listed || []).filter(file => file.attachment);
  // Nothing to list: editors get a hint, visitors get no section at all.
  if (!files.length && !user) {
    return null;
  }
  return (
    <section className="wms-section wms-downloads" id={widget.anchor || undefined}>
      <div className="wms-section__intro">
        <Area doc={widget} name="intro" />
      </div>
      {files.length > 0
        ? (
          <ul className="wms-download-list">
            {files.map(file => <Download file={file} apos={apos} />)}
          </ul>
        )
        : <EmptyHint user={user} text={__t(widget.mode === 'pick' ? 'project:emptyPick' : 'project:emptyListing')} />}
    </section>
  );
}
