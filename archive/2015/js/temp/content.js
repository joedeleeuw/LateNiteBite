  var modalMap;
  var service;
  var longitude;
  var latitude;
  var totalLocations = new Array();
  var callCount = 0;
  

  function clickModal(){
    console.log(totalLocations);
    $("#firstData > *, #secondData > *, #thirdData > *").click(function()
    {
      var myservice;
      var currLat;
      var currLong;
      $('#myModal').modal({
        keyboard: true
      });
      var tableDesc = $(this).children();
      for(var i = 0; i < totalLocations.length; i++)
      {
        //console.log(tableDesc[0].innerHTML);
        //console.log(locations[i].name);
        //console.log("clickLocations:",locations[i].name);
        if(totalLocations[i].name == tableDesc[0].innerHTML)
        {
          currLat = totalLocations[i].geometry.location.k;
          currLong = totalLocations[i].geometry.location.B;
          //console.log(currLat,currLong);
          }
        else {
          //console.log("bad locations:",currLat,currLong);
        }
      }
    var restLocation = new google.maps.LatLng(currLat,currLong);
    
    modalMap = new google.maps.Map(document.getElementById('rowDesc'),{
          center: restLocation,
          zoom: 15
        });
    var marker = new google.maps.Marker({ 
      position: restLocation,
      map: modalMap
    });
    document.getElementById("rowName").innerHTML = tableDesc[0].innerHTML;
    
  $('#myModal').on('show.bs.modal', function() {
   resizeMap();
});

function resizeMap() {
   if(typeof modalMap =="undefined") return;
   setTimeout( function(){resizingMap();} , 400);
}

function resizingMap() {
   if(typeof modalMap =="undefined") return;
   var center = modalMap.getCenter();
   google.maps.event.trigger(modalMap, "resize");
   modalMap.setCenter(center); 
    }
  });
}

  navigator.geolocation.getCurrentPosition(success, error);
  
  function success(position){
    latitude = position.coords.latitude;
    longitude = position.coords.longitude;
    initialize();
  }
  function error(){
    document.getElementById("click").innerHTML = "Could not retrieve your current location";
    docuemnt.getElementById("mobile").innerHTML = "Try enabling location services on your device.";
  }

  function initialize() 
  {
      itemCount = 0;
      var tallahassee = new google.maps.LatLng(latitude,longitude);
      var request = 
        {
          location: tallahassee,
          radius: '12000',
          types: ['restaurant'],
          openNow: true 
        };
    service = new google.maps.places.PlacesService(map);
    service.nearbySearch(request,callback);
  }

function callback(results, status, info) 
  {
    if(info.hasNextPage === true) 
        {
          info.nextPage();
        }
        //~ Use this whenever you want to see what args you're getting.
        //console.log("Got arguments", arguments);
        
      if (status == google.maps.places.PlacesServiceStatus.OK) 
        {
         callCount +=1;
         parseLocations(results,callCount);
        }
        
  }
  
  function parseLocations(locations,callCount)
  {
    var counter = 0;
    if (callCount == 2)
    {
        counter = 20;
    }
    else if (callCount == 3)
    {
      counter = 40;
    }
    console.log(counter);
    //~ Use this whenever you want to display object/array arguments.
    var tBody = ["firstData","secondData","thirdData"];
    var currentDistances = calculateDistance(locations,latitude,longitude);
    for (var i = 0; i < locations.length; i++, counter++)
        { 
          totalLocations[counter] = locations[i];
          console.log("parseLocations:", locations[i].name);
          if(locations[i].rating == undefined) continue;
          if(currentDistances[i] < 2 )
          {
            document.getElementById(tBody[callCount - 1]).innerHTML += "<tr>" + "<td>" + locations[i].name + "</td>" + "<td>" + locations[i].rating + "</td>" + "<td>" + currentDistances[i].toFixed(2)+ "</td>" + "<tr>";
          }
          else if ( currentDistances[i] < 7)  
          {
            document.getElementById(tBody[callCount - 1]).innerHTML += "<tr>" + "<td>" + locations[i].name + "</td>" + "<td>" + locations[i].rating + "</td>" + "<td>" + currentDistances[i].toFixed(2) + "</td>" + "<tr>";
          }
          else 
          {
            document.getElementById(tBody[callCount - 1]).innerHTML += "<tr>" + "<td>" + locations[i].name + "</td>" + "<td>" + locations[i].rating + "</td>" + "<td>" + currentDistances[i].toFixed(2)+ "</td>" + "<tr>";
          }
          
        }
        //document.getElementById(tBody[callCount - 1]).innerHTML +="<tr class=\"space\" style=\"height : 100px; border: 0px;\">" + "</tr>";
        progressBar(callCount);
        $("#dataTable").trigger("update");
        clickModal();
        

  }
   function progressBar(callCount)
  {
    if (callCount == 1)
      {
        document.getElementById('bar').style.width = "33.3%";
      }
    else if (callCount == 2)
      {
        document.getElementById('bar').style.width = "66.6%"; 
      }
    else
      {
        document.getElementById('bar').style.width = "100%"; 
        $("#bar").delay(1000).fadeOut("slow");
      }
  }

  function calculateDistance(locations,latitude,longitude)
   {  
      var distanceArray = new Array();
      for (var i=0; i < locations.length; i++)
      {
        distanceArray[i] = getDistanceFromLatLonInKm(latitude, longitude, locations[i].geometry.location.k, locations[i].geometry.location.B)
      }
      return distanceArray;
   }
  
  function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) 
    {
      //var r = 6378100; //Radius of the earth in m
      var R = 6371; // Radius of the earth in km
      var kmtoMi = 0.621371;
      var dLat = deg2rad(lat2-lat1);  // deg2rad below
      var dLon = deg2rad(lon2-lon1); 
      var a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      var d = R * c; // Distance in km
      return d * 0.621371;
    }

  function deg2rad(deg) 
    {
      return deg * (Math.PI/180)
    }
  

