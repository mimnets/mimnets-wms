// Entrance animation (m1-072): a style select whose value core adds as a
// class on the widget's styles wrapper (`class: true`). Add it to a module
// with `styles: { add: { entrance: entranceStyle } }`. Only widgets that sit
// directly in an area get it: a styles wrapper adds a <div> around the
// widget, which would change the markup of widgets nested inside others.
// The browser side is modules/asset/ui/src/motion.js and _motion.scss.
export const entranceStyle = {
  label: 'project:entranceAnimation',
  type: 'select',
  class: true,
  def: '',
  choices: [
    {
      label: 'project:entranceNone',
      value: ''
    },
    {
      label: 'project:entranceFade',
      value: 'assurer-enter-fade'
    },
    {
      label: 'project:entranceRise',
      value: 'assurer-enter-rise'
    }
  ]
};
