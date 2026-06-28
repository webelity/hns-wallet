let Sentry, app;

if (process.type === 'renderer') {
  Sentry = require('@sentry/electron/renderer');
  app = require('@electron/remote').app;
} else {
  Sentry = require('@sentry/electron/main');
  app = require('electron').app;
}

const pkg = require('../package.json');

(function () {
  if (!app.isPackaged) {
    return;
  }

  Sentry.init({
    dsn: '',
    release: 'hns-wallet@' + pkg.version,
  });
})();
