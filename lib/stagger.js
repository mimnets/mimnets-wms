// Stagger (m1-085, D-CONTENT-30): a style select whose value core adds as a
// class on the layout widget's styles wrapper (`class: true`), like
// `bandStyle` in lib/band.js. On desktop every second column moves down by
// half the section space (_stagger.scss); tablet and phone keep the core
// arrangement. "Every second" counts columns in document order.
export const staggerStyle = {
  label: 'project:stagger',
  help: 'project:staggerHelp',
  type: 'select',
  class: true,
  def: '',
  choices: [
    {
      label: 'project:staggerOff',
      value: ''
    },
    {
      label: 'project:staggerOn',
      value: 'wms-layout-stagger'
    }
  ]
};
