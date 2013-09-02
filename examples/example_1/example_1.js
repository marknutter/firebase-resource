

angular.module('Foo', ['firebaseResource']).
  factory('Foo', function ($rootScope, firebaseResource) {
    var Foo = firebaseResource(
      {
        path: 'foos'
      }
    );
    return Foo;
});


angular.module('MainCtrl', ['Foo']).
controller('MainCtrl', function($rootScope, $scope, Foo) {

  var foo1 = new Foo({name: 'foo1'});
  foo1.save();

  Foo.query({page: 1})

  $scope.foos = Foo.all();


})

