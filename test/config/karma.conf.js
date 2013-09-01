basePath = '../../';

files = [
  JASMINE,
  JASMINE_ADAPTER,
  'lib/angular.js',
  'test/lib/angular-mocks.js',
  'firebase-resource.js',
  'test/firebase-resource-spec.js'
];

// server port
port = 8081;

autoWatch = true;

// runner port
runnerPort = 9100;

browsers = ['PhantomJS'];

reporters = ['dots'];
