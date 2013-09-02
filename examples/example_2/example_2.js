
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
        belongsTo: true
      }
    );
    return Post;
});


angular.module('MainCtrl', ['User', 'Post']).
controller('MainCtrl', function($rootScope, $scope, User, Post) {

  $scope.user = new User({name: 'Test User'});
  $scope.user.save()

  $scope.user.posts().query();

  var post1 = $scope.user.posts().new({content: 'test post 1'});
  post1.save();
  var post2 = $scope.user.posts().new({content: 'test post 2'});
  post2.save()

  $scope.addPost = function() {
    var newPost = $scope.user.posts().new({content: 'another post!'});
    newPost.save()
  }

})

