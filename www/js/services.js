
angular.module('todo.services', [])
/**
 * The Projects factory handles saving and loading projects
 * from local storage, and also lets us save and load the
 * last active project index.
 */
.factory('Projects', function() {
  return {
    all: function() {
      var projectString = window.localStorage['projects'];
      if(projectString) {
        return angular.fromJson(projectString);
      }
      return [];
    },  
    save: function(projects) {
      window.localStorage['projects'] = angular.toJson(projects);
    },  
    newProject: function(projectTitle, projectType, projectCategory, projectCode) {
      // Add a new project
      if (projectType)
      {
        return {
          title: projectTitle,
          tasks: [],
          collaborators: [],
          type: projectType,
          category: projectCategory,
          code: projectCode
        };        
      }
      else
      {
        return {
          title: projectTitle,
          tasks: [],
          collaborators: []
        };        
      }

    }, 
    getLastActiveIndex: function() {
      return parseInt(window.localStorage['lastActiveProject']) || 0;
    },
    setLastActiveIndex: function(index) {
      window.localStorage['lastActiveProject'] = index;
    },
    getLastTaskIndex: function() {
      return parseInt(window.localStorage['lastActiveTask']) || 0;
    },
    setLastTaskIndex: function(index) {
      window.localStorage['lastActiveTask'] = index;
    },       
    getLastActiveModal: function() {
      return (window.localStorage['lastActiveModal']);
    },    
    setLastActiveModal: function(modalName) {
      window.localStorage['lastActiveModal'] = modalName;
    },
    getAccomplishmentDays: function() {
      return (window.localStorage['accomplishmentDay']) || 7;
    },    
    setAccomplishmentDays: function(daysAgo) {
      window.localStorage['accomplishmentDay'] = daysAgo;
    },
    getUpcomingDays: function() {
      return (window.localStorage['upcomingDays']) || 7;
    },    
    setUpcomingDays: function(daysAgo) {
      window.localStorage['upcomingDays'] = daysAgo;
    },    
    getNewItemIsTop: function() {
      return (window.localStorage['newItemIsTop']);
    }, 
    setNewItemIsTop: function(newItemIsTop) {
      window.localStorage['newItemIsTop'] = newItemIsTop;
    },
    getCompleteHidden: function() {
      return (window.localStorage['completehidden']) || 'false';
    }, 
    setCompleteHidden: function(completehidden) {
      window.localStorage['completehidden'] = completehidden;
    },  
    getEnableBackground: function() {
      return (window.localStorage['enablebackground']) || 'true';
    }, 
    setEnableBackground: function(enablebackground) {
      window.localStorage['enablebackground'] = enablebackground;
    },  
    getDefaultProject: function() {
      return (window.localStorage['defaultProject']) || 'false';
    }, 
    setDefaultProject: function(defaultproject) {
      window.localStorage['defaultProject'] = defaultproject;
    }, 
    getKeyValue: function() {
      return (window.localStorage['lastKeyValue']) || 0;
    },
    setKeyValue: function(restorekeyvalue) {
      window.localStorage['lastKeyValue'] = restorekeyvalue;
    },    
    getNextKeyValue: function() {
      var lastKeyValue = parseInt(window.localStorage['lastKeyValue']) || 0;
      window.localStorage['lastKeyValue'] = ++lastKeyValue;
      return lastKeyValue;
    },
    getStepCount: function() {
      return (window.localStorage['stepCount']) || 0;
    },    
    setStepCount: function(steps) {
      window.localStorage['stepCount'] = steps;
    },
    getStepAvg: function() {
      return (window.localStorage['stepAvg']) || 0;
    },    
    setStepAvg: function(steps) {
      window.localStorage['stepAvg'] = steps;
    },    
    getStepDate: function() {
      return (window.localStorage['stepDate']) || 0;
    },    
    setStepDate: function(newDay) {
      window.localStorage['stepDate'] = newDay;
    },
    getWalkMessageId: function() {
      return (window.localStorage['walkMessageId']) || 0;
    },    
    setWalkMessageId: function(taskId) {
      window.localStorage['walkMessageId'] = taskId;
    },    
    getActiveHealthDate: function() {
      return (window.localStorage['activeHealthDate']) || 0;
    },    
    setActiveHealthDate: function(newDay) {
      window.localStorage['activeHealthDate'] = newDay;
    },
    getThemeString: function() {
      return (window.localStorage['themeString']) || 'splash';
    },
    setThemeString: function(themeString) {
      window.localStorage['themeString'] = themeString;
    }            
  }
})



.factory('TempImages', function() {
  return {
    all: function() {
      var tempImagesString = window.localStorage['TempImages'];
      if(tempImagesString) {
        return angular.fromJson(tempImagesString);
      }
      return [];
    },
    save: function(tempimages) {
      window.localStorage['TempImages'] = angular.toJson(tempimages);
    },
    clear: function() {
      window.localStorage['TempImages'] = angular.toJson([]);
    },    
    newTempImage: function(imagedata) {
      return {
        imageURI: imagedata
      };
    }
  }
})

.factory('TempPlaces', function() {
  return {
    all: function() {
      var tempPlacesString = window.localStorage['TempPlaces'];
      if(tempPlacesString) {
        return angular.fromJson(tempPlacesString);
      }
      return [];
    },
    save: function(tempplaces) {
      window.localStorage['TempPlaces'] = angular.toJson(tempplaces);
    },
    clear: function() {
      window.localStorage['TempPlaces'] = angular.toJson([]);
    }
  }
})

.factory('TempProjects', function() {
  return {
    all: function() {
      var tempProjectsString = window.localStorage['TempProjects'];
      if(tempProjectsString) {
        return angular.fromJson(tempProjectsString);
      }
      return [];
    },
    save: function(tempprojects) {
      window.localStorage['TempProjects'] = angular.toJson(tempprojects);
    },
    clear: function() {
      window.localStorage['TempProjects'] = angular.toJson([]);
    }
  }
})