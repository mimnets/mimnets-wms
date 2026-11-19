// Band width (m1-081, D-CONTENT-26): a style select whose value core adds as a
// class on the widget's styles wrapper (`class: true`), like `entranceStyle`
// in lib/motion.js. "Full window width" runs the wrapper's background edge to
// edge while the widget inside stays at page width (_bands.scss). Add it with
// `styles: { add: { band: bandStyle } }`.
export const bandStyle = {
  label: 'project:bandWidth',
  help: 'project:bandWidthHelp',
  type: 'select',
  class: true,
  def: '',
  choices: [
    {
      label: 'project:bandContent',
      value: ''
    },
    {
      label: 'project:bandFull',
      value: 'wms-band-full'
    }
  ]
};
