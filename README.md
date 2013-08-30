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
        
      });
      
Define options for the resource. These include

* path - this is the actual Firebase path of the resource in question. 
* hasMany - an array of associations. These are other models defined as firebase-resources.
* perPage - how many results are retrieved per page
