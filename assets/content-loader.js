(function () {
  'use strict';
  window.ContentLoader = window.ContentLoader || {};

  window.ContentLoader.getConfig = function () {
    return window.APP && window.APP.defaultConfig;
  };

  window.ContentLoader.getTranslations = function () {
    return window.APP && window.APP.translations;
  };

  var KNOWN_DATASETS = [
    'emergencyServices',
    'dailyEssentials',
    'bovecProviders',
    'tripIdeasData',
    'tripIdeasPlaces',
    'attractions',
    'taxiBus'
  ];

  window.ContentLoader.getDataset = function (name) {
    if (!window.APP_DATA) return null;
    if (KNOWN_DATASETS.indexOf(name) === -1) return null;
    return (name in window.APP_DATA) ? window.APP_DATA[name] : null;
  };

  window.ContentLoader.isReady = function () {
    return !!(
      window.APP &&
      window.APP.defaultConfig &&
      window.APP.translations &&
      window.APP_DATA
    );
  };
})();
