// Buttons from a `bannerButtons()` field (lib/banner.js). Items without a
// working link are left out; nothing renders when none are left.
import { linkHref } from '../link.js';

export default function BannerButtons({ items, className }) {
  const buttons = (items || [])
    .map(item => ({
      ...item,
      href: linkHref(item)
    }))
    .filter(item => item.href);
  if (!buttons.length) {
    return null;
  }
  return (
    <div className={className}>
      {buttons.map(item => (
        <a
          className={`assurer-button assurer-button--${item.style || 'primary'}`}
          href={item.href}
        >
          {item.linkText}
        </a>
      ))}
    </div>
  );
}
