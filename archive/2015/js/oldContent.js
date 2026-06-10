  var map;
  var service;
  var infowindow;
  var longitude;
  var latitude;
  var hasLocation = false;
  var itemCount;
  var callCount = 0;
  
  function clickModal(){
    $("#firstData > *, #secondData > *, #thirdData > *").click(function()
    {
      /*var columnNum = parseInt($(this).index() + 1 );
      var rowNum = parseInt($(this.)parent().index() + 1);
      */
      var options = {
        "keyboard" : "true",
        "show" : "true" 
      }
      var tableDesc = $(this).children();
      document.getElementById("rowName").innerHTML = tableDesc[0].innerHTML;
      $('#myModal').modal(options);
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
      map = new google.maps.Map(document.getElementById('map'), 
        {
          center: tallahassee,
          zoom: 15
        });

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
    //~ Use this whenever you want to display object/array arguments.
    var tBody = ["firstData","secondData","thirdData"];
    var currentDistances = calculateDistance(locations,latitude,longitude);
    for (var i = 0; i < locations.length; i++)
        { 
          itemCount += 1;
          if(locations[i].rating == undefined) continue;
          /*if(currentDistances[i] < 2 )
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
          */
        document.getElementById("firstData").innerHTML += "<tr>" + "<td>" + locations[i].name + "</td>" + "<td>" + locations[i].rating + "</td>" + "<td>" + currentDistances[i].toFixed(2)+ "</td>" + "<tr>";
        }
        document.getElementById(tBody[callCount - 1]).innerHTML +="<tr class=\"space\" style=\"height : 100px; border: 0px;\">" + "</tr>";
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
  

