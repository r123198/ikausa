// Xcode 27 rejects targets below iOS 15, but some pods (RevenueCat, SDWebImage)
// still declare resource-bundle targets for iOS 9/13. Raise those to the app's
// own minimum after `pod install`. Re-applied on every prebuild.
const { withPodfile } = require('expo/config-plugins');
const { mergeContents } = require('@expo/config-plugins/build/utils/generateCode');

const RAISE_POD_TARGETS = `
    min_target = podfile_properties['ios.deploymentTarget'] || '16.4'
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |build_config|
        current = build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
        if current.nil? || Gem::Version.new(current) < Gem::Version.new(min_target)
          build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = min_target
        end
      end
    end`;

module.exports = function withPodDeploymentTarget(config) {
  return withPodfile(config, (podfileConfig) => {
    podfileConfig.modResults.contents = mergeContents({
      tag: 'ikausa-pod-deployment-target',
      src: podfileConfig.modResults.contents,
      newSrc: RAISE_POD_TARGETS,
      anchor: /post_install do \|installer\|/,
      offset: 1,
      comment: '#',
    }).contents;
    return podfileConfig;
  });
};
