
angular.module('User', ['firebaseResource']).
  factory('User', function ($rootScope, firebaseResource) {
    var User = firebaseResource(
      {
        path: 'users',
        hasMany: ['Post']
      }
    );
    return User;
});

angular.module('Post', ['firebaseResource']).
  factory('Post', function ($rootScope, firebaseResource) {
    var Post = firebaseResource(
      {
        path: 'posts',
        belongsTo: true,
        perPage: 3
      }
    );
    return Post;
});


angular.module('MainCtrl', ['User', 'Post']).
controller('MainCtrl', function($rootScope, $scope, User, Post) {

  $scope.user = new User({name: 'Test User'});
  $scope.user.save()
  $scope.current_page = 0;

  /*
   *  Pagination is a way to limit the number of objects coming back
   *  from Firebase for a given query. It is not intended to only show
   *  a certain number of objects in a given view; that will still need
   *  to be handled separatley. So whenever a new page is requested via
   *  the query() method, those objects are added to the full list of
   *  objects. For now, pagination is in reverse order, so the most
   *  recently created objects come back with page 1.
   */

  for (var i=0;i<10;i++) {
    var post = $scope.user.posts().new({content: 'test post ' + i});
    post.save().then(function() {
      Post.clearAll(); // clearing all cached objects so that pagination works for this demo
    });
  }

  $scope.nextPage = function() {
    $scope.current_page++;
    $scope.user.posts().query({page: $scope.current_page});
  }


})

