angular.module('app', ['MainCtrl', 'fbrFirebase'])
  .run(function($rootScope, firebase) {

    // reset the database every time
    firebase.remove();

    $rootScope.safeApply = function(fn) {
      var phase = this.$root.$$phase;
      if(phase == '$apply' || phase == '$digest') {
        if(fn && (typeof(fn) === 'function')) {
          fn();
        }
      } else {
        this.$apply(fn);
      }
    };
  });

angular.module('fbrFirebase', []).
  value('firebase', (new Firebase('https://fbr.firebaseio.com/')));