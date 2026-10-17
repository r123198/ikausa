// App Clip: runs the full app bundle so an invite link (https://<domain>/join/<code>)
// opens the join screen without installing Ikausa. See targets/clip/README.md.
const { inviteHost } = require('../../invite-domain');

/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = () => {
  const host = inviteHost();
  return {
    type: 'clip',
    name: 'clip',
    displayName: 'Ikausa',
    icon: '../../assets/images/icon.png',
    bundleIdentifier: '.clip',
    deploymentTarget: '16.0',
    exportJs: true,
    entitlements: {
      // Without a domain the clip can still be opened from its default App Store link.
      ...(host && { 'com.apple.developer.associated-domains': [`appclips:${host}`] }),
    },
  };
};
