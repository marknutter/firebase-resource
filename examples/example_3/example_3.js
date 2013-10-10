
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



  for (var i=0;i<10;i++) {
    var post = $scope.user.posts().new({content: 'test post ' + i});
    post.save().then(function() {
      Post.clearAll();
    });
  }

  $scope.nextPage = function() {
    $scope.current_page++;
    $scope.user.posts().query({page: $scope.current_page});
  }


})

