// Single source for the invite link domain, shared by app.config.js and the
// App Clip target. Set EXPO_PUBLIC_INVITE_BASE_URL (e.g. https://ikausa.app)
// in .env; until then links use the ikausa:// scheme and no domains are linked.
function inviteHost() {
  const base = process.env.EXPO_PUBLIC_INVITE_BASE_URL;
  if (!base) return null;
  const url = new URL(base);
  if (url.protocol !== 'https:') {
    throw new Error('EXPO_PUBLIC_INVITE_BASE_URL must be an https URL for universal links and App Clips.');
  }
  return url.hostname;
}

module.exports = { inviteHost };
