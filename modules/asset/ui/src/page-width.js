// The page width without the vertical scrollbar, as `--wms-vw` on <html>
// (m1-072). `100vw` includes the scrollbar on Windows, so a full-width
// section sized with it scrolls the page sideways. Used by the slideshow's
// "Full width" option (_slideshow.scss); without it that option stays
// content width.

function update() {
  const root = document.documentElement;
  root.style.setProperty('--wms-vw', `${root.clientWidth}px`);
  root.classList.add('has-wms-vw');
}

export default () => {
  update();
  // `ResizeObserver` on <html> also catches a scrollbar appearing or going.
  new ResizeObserver(update).observe(document.documentElement);
};
