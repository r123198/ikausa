// Adds universal links (iOS) and verified App Links (Android) for the invite
// domain on top of app.json. Nothing is added until the domain is set.
const { inviteHost } = require('./invite-domain');

module.exports = ({ config }) => {
  const host = inviteHost();
  if (!host) return config;

  return {
    ...config,
    ios: {
      ...config.ios,
      associatedDomains: [...(config.ios?.associatedDomains ?? []), `applinks:${host}`],
    },
    android: {
      ...config.android,
      intentFilters: [
        ...(config.android?.intentFilters ?? []),
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
