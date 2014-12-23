angular.module('todo.controllers', [])
.controller('todoCtrl', function($scope, $ionicModal, Projects, $ionicSideMenuDelegate, $timeout, $ionicPopup, $ionicActionSheet) {
 
  // Create and load the Modal for new task
  $ionicModal.fromTemplateUrl('templates/new-task.html', function(modal) {
    $scope.taskModal = modal;
  }, {
    scope: $scope,
    animation: 'slide-in-up'
  });
  // Edit and load the Modal for edit task
  $ionicModal.fromTemplateUrl('templates/edit-task.html', function(modal) {
    $scope.editTaskModal = modal;
  }, {
    scope: $scope,
    animation: 'slide-in-up'
  });
  // Edit and load the Modal for edit project
  $ionicModal.fromTemplateUrl('templates/edit-project.html', function(modal) {
    $scope.editProjectModal = modal;
  }, {
    scope: $scope,
    animation: 'slide-in-up'
  });

  // Load or initialize projects
  $scope.projects = Projects.all();

  // A utility function for creating a new project
  // with the given projectTitle
  var createProject = function(projectTitle) {
    var newProject = Projects.newProject(projectTitle);
    $scope.projects.push(newProject);
    Projects.save($scope.projects);
    $scope.selectProject(newProject, $scope.projects.length-1);
  };

  // Grab the last active, or the first project
  $scope.activeProject = $scope.projects[Projects.getLastActiveIndex()];

  // Called to create a new project
  $scope.newProject = function() {
    var projectTitle = prompt('Project name');
    if(projectTitle) {
      createProject(projectTitle);
    }
  };

  // Called to select the given project
  $scope.selectProject = function(project, index) {
    $scope.activeProject = project;
    Projects.setLastActiveIndex(index);
    $ionicSideMenuDelegate.toggleLeft(false);
  };


  // Open our new task modal
  $scope.editProject = function(i, project) {
    $scope.project = {title: $scope.projects[i].title, tasks: $scope.projects[i].tasks};
    $scope.projectIndex = i;
    $scope.editProjectModal.show();
  };

  // Called when the form is submitted
  $scope.updateProject = function(i, project) {
    if (!$scope.projects || !project) {
      return;
    }
    $scope.projects[i] = project;
    $scope.editProjectModal.hide();

    // Inefficient, but save all the projects
    Projects.save($scope.projects);

  };

  // Called when the form is submitted
  $scope.createTask = function(task) {
    if (!$scope.activeProject || !task) {
      return;
    }
    $scope.activeProject.tasks.push({
      title: task.title
    });
    $scope.taskModal.hide();

    // Inefficient, but save all the projects
    Projects.save($scope.projects);

    task.title = "";
  };

// Called when the form is submitted
  $scope.updateTask = function(i, task) {
    if (!$scope.activeProject || !task) {
      return;
    }
    $scope.activeProject.tasks[i] = task;
    $scope.editTaskModal.hide();

    // Inefficient, but save all the projects
    Projects.save($scope.projects);

  };

  // Open our new task modal
  $scope.newTask = function() {
    $scope.task = {title:"", isDone:"NO"};
    $scope.taskModal.show();
  };

  // Open our new task modal
  $scope.editTask = function(i, task) {
    $scope.task = {title: task.title, isDone: task.isDone};
    $scope.taskIndex = i;
    $scope.editTaskModal.show();
  };

  // Make sure to persist the change after is done is toggled
  $scope.toggleDone = function(i, task) {
    //alert("toggle done task "+task.isDone)
    if (!$scope.activeProject || !task) {
      return;
    }
    $scope.activeProject.tasks[i].isDone = ($scope.activeProject.tasks[i].isDone=="YES")?"NO":"YES";
    Projects.save($scope.projects);
  }

  // Make sure to persist the change after is done is toggled
  $scope.doneClicked = function(i, task) {
    //alert("toggle done task "+task.isDone)
    if (!$scope.activeProject || !task) {
      return;
    }
    Projects.save($scope.projects);
  }

  // A confirm dialog
  $scope.showConfirm = function(onYes, onNo) {
   var confirmPopup = $ionicPopup.confirm({
     title: 'Delete Task',
     template: 'Are you sure you want to delete this task?'
   });
   confirmPopup.then(function(res) {
     if(res) {
       onYes();
     } else {
       if (onNo)
        onNo();
     }
   });
  };

  // delete selected task
  $scope.deleteTask = function(i, task) {
    if (!$scope.activeProject || !task ) {
      return;
    }
    console.log("start deleting");
    $scope.showConfirm(function() {
      console.log("confirmed to delete task "+i);
      $scope.activeProject.tasks.splice(i,1);
      Projects.save($scope.projects);
    });
  } 

  // Close the new task modal
  $scope.closeNewTask = function() {
    $scope.taskModal.hide();
  };

  // Close the edit task modal
  $scope.closeEditTask = function() {
    $scope.editTaskModal.hide();
  };


  // Close the edit task modal
  $scope.closeEditProject = function() {
    $scope.editProjectModal.hide();
  };
  $scope.toggleProjects = function() {
    $ionicSideMenuDelegate.toggleLeft();
  };

 // Triggered on a button click, or some other target
 $scope.showActions = function() {

   // Show the action sheet
   var hideSheet = $ionicActionSheet.show({
     buttons: [
       { text: '<b>Share</b> This' },
       { text: 'Move' }
     ],
     destructiveText: 'Delete',
     titleText: 'Modify your album',
     cancelText: 'Cancel',
     cancel: function() {
          // add cancel code..
        },
     buttonClicked: function(index) {
       return true;
     }
   });

   // For example's sake, hide the sheet after two seconds
   $timeout(function() {
     hideSheet();
   }, 2000);

 };
  // Try to create the first project, make sure to defer
  // this by using $timeout so everything is initialized
  // properly
  $timeout(function() {
    if($scope.projects.length == 0) {
      while(true) {
        var projectTitle = prompt('Your first project title:');
        if(projectTitle) {
          createProject(projectTitle);
          break;
        }
      }
    }
  });
});
