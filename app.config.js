// Adds universal links (iOS) and verified App Links (Android) for the invite
// domain on top of app.json. Nothing is added until the domain is set.
const { inviteHost } = require('./invite-domain');

const APPLE_TARGETS_PLUGIN = '@bacons/apple-targets';

// The App Clip target can't be signed by a free (personal) Apple team, so it is
// only built once ios.appleTeamId is set for the paid developer account.
function withoutClipUnlessTeam(config) {
  if (config.ios?.appleTeamId) return config;
  return {
    ...config,
    plugins: (config.plugins ?? []).filter(
      (plugin) => (Array.isArray(plugin) ? plugin[0] : plugin) !== APPLE_TARGETS_PLUGIN
    ),
  };
}

module.exports = ({ config }) => {
  const host = inviteHost();
  const base = withoutClipUnlessTeam(config);
  if (!host) return base;

  return {
    ...base,
    ios: {
      ...base.ios,
      associatedDomains: [...(base.ios?.associatedDomains ?? []), `applinks:${host}`],
    },
    android: {
      ...base.android,
      intentFilters: [
        ...(base.android?.intentFilters ?? []),
        {
          action: 'VIEW',
          autoVerify: true,
          data: [{ scheme: 'https', host, pathPrefix: '/join/' }],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
  };
};
