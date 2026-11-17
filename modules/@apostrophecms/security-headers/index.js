// HTTP security headers (m1-011), via the official
// @apostrophecms/security-headers module (MIT). The values and the reasons
// for them are in modules/wms-security/lib/config.js. The module only
// covers responses after core's static file server, so the asset module
// applies the same headers to /uploads and built assets.
import { readSecurityEnv, securityHeaderOptions } from '../../wms-security/lib/config.js';

export default {
  options: securityHeaderOptions(readSecurityEnv())
};
