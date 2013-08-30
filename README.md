firebase-resource
=================

Angular wrapper for Firebase in the style of ng-resource and active-record


####Getting Started
Include firebase-resource.js in your index.html file. Suggest creating a services folder.

    <script src="/services/firebase_resource.js"></script>
    
firebase-resource assumes you are defining your models as separate modules, much like ng-resource assumes. 
Inject firebase-resource into your where you might otherwise inject ng-resource.

    angular.module('Post', ['firebaseResource']).
      factory('Post', function (firebaseResource) {

      });
      
Create a resource using the resource factory defined in firebase-resource (again, like you would using ng-resource).

    angular.module('Post', ['firebaseResource']).
      factory('Post', function (firebaseResource) {
      
        var Post = firebaseResource(
          {
            path: 'posts'
          }
        );
        
        return Post;
        
      });

Define options for the resource. These include

* path - this is the actual Firebase path of the resource in question. 
* hasMany - an array of associations. These are other models defined as firebase-resources.
* perPage - how many results are retrieved per page.
* limit - used to limit number of results coming back from a query. Redundant when using pagination.
* belongsTo - determines whether a resource is defined within the context of a parent resource.

Inject the resource into controllers where needed

    angular.module('PostsCtrl', []).
      controller('PostsCtrl', function($scope, Post) {
        
        $scope.posts = Post.query({page: 1});
        
      });

Defining and using associations:


    angular.module('User', ['firebaseResource']).
      factory('User', function (firebaseResource) {
      
        var User = firebaseResource(
          {
            path: 'users',
            hasMany: ['Post']
          }
        );
        
        return User;
        
      });
      
    angular.module('Post', ['firebaseResource']).
      factory('Post', function (firebaseResource) {
      
        var Post = firebaseResource(
          {
            path: 'posts',
            belongsTo: true,
            perPage: 10
          }
        );
        
        return Post;
        
      });
      
    angular.module('PostsCtrl', []).
      controller('PostsCtrl', function($scope, Post, User) {
        
        $scope.user = User.query()[0];
        $scope.posts = $scope.user.posts().query({page: 1});
        
      });
      
      
Creating content in context of an assocation:

    var post = user.posts().new({content: 'hello world!'});
    post.save().
    then(function() {
      // do something
     })
     
Define lifecycle callbacks within the model definition:


    angular.module('Post', ['firebaseResource']).
      factory('Post', function (firebaseResource) {
      
        var Post = firebaseResource(
          {
            path: 'posts',
          }
        );
        
        Post.prototype.init = function(error) {
            // happens when model is instantiated from Firebase data
        };
        
        Post.prototype.afterCreate = function(error) {
            // happens only the first time an object is added to Firebase
        };
        
        Post.prototype.beforeSave = function(error) {
            // happens immediately before saving data to Firebase
        };
        
        Post.prototype.afterSave = function(error) {
            // happens after data is written to Firebase
        };
        
        return Post;
        
      });
