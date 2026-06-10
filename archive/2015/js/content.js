  var modalMap;
  var longitude;
  var latitude;
  var totalLocations = new Array();
  var totalLocationNames = new Array();
  var totalLocationDistances = new Array();
  var callCount = 0;
  var currLat;
  var currLong;
  var mapUrl;
  var tableDesc;
  var isDetails = false;
  var userLocation;
  var isMobile = { 
    Android: function() { return navigator.userAgent.match(/Android/i); }, 
    BlackBerry: function() { return navigator.userAgent.match(/BlackBerry/i); }, 
    iOS: function() { return navigator.userAgent.match(/iPhone|iPad|iPod/i); }, 
    Opera: function() { return navigator.userAgent.match(/Opera Mini/i); }, 
    Windows: function() { return navigator.userAgent.match(/IEMobile/i); }, 
    any: function() { return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows()); } };
  function clickModal(){
    $("#firstData > *").click(function()
    {
      
      var service; 
      var combinedDescription;
      var phoneRequest;
      $('#myModal').modal({
        keyboard: true
      });
      tableDesc = $(this).children();
      for(var i = 0; i < totalLocations.length; i++)
      {
         //console.log(tableDesc[3].childNodes[0].innerHTML);         
        //refers to the third column of the row selected, containing the distance.
        combinedDescription = tableDesc[3].childNodes[0].innerHTML;
        /*else
        {
          combinedDescription = tableDesc[3].childNodes[0].innerHTML + tableDesc[3].childNodes[1].outerHTML;
        }*/

        if(totalLocations[i].distance == combinedDescription)
        {
          currLat = totalLocations[i].geometry.location.A;
          currLong = totalLocations[i].geometry.location.F;
          var phoneRequest = 
          {
            placeId: totalLocations[i].place_id
          };
          break;
        }
      }
    //location from array of total locations to instantiate map. 
    var restLocation = new google.maps.LatLng(currLat, currLong);
    //finding average latitutde and longitute for map center
    var centerLocation = new google.maps.LatLng((currLat + latitude)/2, (currLong + longitude)/2);
    
    modalMap = new google.maps.Map(document.getElementById('rowDesc'),{
          center: centerLocation,
          zoom: 13
        });

    
    var targetDistance = getDistanceFromLatLonInKm(latitude,longitude,currLat,currLong);
    if(targetDistance > 4.0)
    {
      zoomLevel = 12;
      modalMap.setZoom(zoomLevel);
    }

   
     var origMarker = new google.maps.Marker({ 
      position: userLocation,
      map: modalMap,
      icon:  "../images/mapMarkers/green_MarkerA.png"
    });
     var marker = new google.maps.Marker({ 
      position: restLocation,
      map: modalMap,
      icon: "../images/mapMarkers/red_MarkerB.png"
    });

      service = new google.maps.places.PlacesService(map);
      service.getDetails(phoneRequest,function(results){
        
        document.getElementById("phoneNumber").innerHTML = "<a id=\"realPhone\"href=\"tel:" + results.international_phone_number +  "\"/>" + results.international_phone_number + "</a>";
        
        
      });

document.getElementById("rowName").innerHTML = tableDesc[0].innerHTML;
    
});

}

/*STARTS here man*/
$(document).ready(function(){
   
  //instantiation of arrow back to top
  $('.selectpicker').selectpicker();

  $(document).ready(function() {
  $("#dataTable").tablesorter({
    sortList: [[2,0]],     
    cssAsc: 'headerSortUp',   
    cssDesc: 'headerSortDown', 
    cssHeader: 'header',
    widgets : ['stickyHeaders','reflow'],
    headers: {
      2: {sorter: "text"}
    },
    widgetOptions : {
    stickyHeaders_attachTo : '.table-responsive',
    reflow_className    : 'ui-table-reflow',
    reflow_dataAttrib : 'data-title'
      
  }
  });
});

  if(navigator.geolocation == undefined)
    {
      document.getElementById("click").innerHTML = "Could not retrieve your current location";
      document.getElementById("mobile").innerHTML = "Try enabling geolocation in your browser";
    }
  else 
    {
    
    navigator.geolocation.getCurrentPosition(success, error);
    }
  });

function changeSearch(){

  $('.fa-arrow-up').click(function () {
  $('html,body').animate({scrollTop: 0}, 500);
    return false;
  });
  }
  function success(position)
  {
     
    /*latitude and longitude contain the users current location. */
    latitude = position.coords.latitude;
    longitude = position.coords.longitude;
    
    initialize();
    
  }
  function error()
  {
   
    document.getElementById("click").innerHTML = "Could not retrieve your current location";
    document.getElementById("mobile").innerHTML = "Try enabling location services on your device.";
  }

function initialize() 
  {
      
      userLocation = new google.maps.LatLng(latitude,longitude);
      var request = 
        {
          /*don't be a dummy tallahassee is a variable name, but its not that anymore, but you want this to be here forever */
          location: userLocation,
          radius: '6000',
          types: ['restaurant'],
          openNow: true 
        };

    service = new google.maps.places.PlacesService(map);
    service.nearbySearch(request,callback);   
  }

function grabclosePlaces()
{
  var request = 
        {
          //don't be a dummy tallahassee is a variable name, but its not that anymore, but you want this to be here forever 
          location: userLocation,
          radius: '1200',
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
         
         if(callCount < 7)
         parseLocations(results,callCount,info);
        }
        
  }
  function parseLocations(locations,callCount,info)
  {
    //this attaches a back to top event when the up arrow is pressed.
   
  
   var hourRequest = {}
   var locationClosingTime; 
   changeSearch();
   var starHTML, decimal;
    var counter = 0;
    if (callCount == 2)
    {
        counter = 20;
    }
    else if (callCount == 3)
    {
      counter = 40;
    }
    //console.log("call count" + counter);
    //~ Use this whenever you want to display object/array arguments.
    
    for(var i = 0; i < locations.length; i++)
      {
        for (var j = 0; j < totalLocations.length; j++)
          {
            if (locations[i].place_id == totalLocations[j].place_id)
            {
              locations[i]["id"] = "rid";  
              
            }
          }       
      }
    
    var currentDistances = calculateDistance(locations,latitude,longitude);
    for (var i = 0; i < locations.length; i++, counter++)
        { 
          if(locations[i]["id"] == "rid")
          {
            continue; 
          }
          totalLocations[counter] = locations[i];
          totalLocationNames[counter] =locations[i].name;
          /*var distanceandDescription = undefined;
          
          var x = $.inArray(locations[i].name,totalLocationNames,0);
          if(x > -1 && x != counter)
          {
            //if (locations[x].vicinity.length == 0 && locations[i].vicinity.length == 0) break; 
            locations[i].vicinity = locations[i].vicinity.replace(/[0-9#]/g, '');
            locations[i].vicinity = locations[i].vicinity.substr(0,locations[i].vicinity.indexOf(','));
            distanceandDescription = currentDistances[i].toFixed(2) + "<br>" + "<p id=\"withDescription\">" + "(" + locations[i].vicinity + ")" + "</p>";
            totalLocations[counter]["distance"] = distanceandDescription;
          }*/
        //else 
        //{
          totalLocations[counter]["distance"] = currentDistances[i].toFixed(2);
          
        //}  
        
            
           decimal = locations[i].rating % 1;
           decimal = Math.floor(decimal * 100 )/100;
           console.log("Name: " + locations[i].name + "rating: "+ locations[i].rating + " decimal " + decimal + " Distance: " + locations[i].distance);
           
           if(decimal == 0) {
            starHTML = "<img class=\"starRating\" src=\"../images/" + locations[i].rating + ".0.png" + "\"" + "/>";
          }
          else if(decimal <= 0.25)starHTML= "<img class=\"starRating\" src=\"../images/" + Math.floor(locations[i].rating) + ".25.png" + "\"" + "/>";
          else if(decimal == 0.50)starHTML= "<img class=\"starRating\" src=\"../images/" + Math.floor(locations[i].rating) + ".25.png" + "\"" + "/>";
          else if(.26 < decimal <= 0.5) starHTML="<img class=\"starRating\" src=\"../images/" + Math.floor(locations[i].rating) + ".5.png" + "\"" + "/>";
          else if (decimal >= 0.75) starHTML = "<img class=\"starRating\" src=\"../images/" + Math.floor(locations[i].rating) + ".75.png" + "\"" + "/>";
          if(locations[i].rating == undefined){
            starHTML = "<p>" + "No Reviews Yet.." + "</p>";
            decimal = -1;
           }
           

           /*if(distanceandDescription == undefined)
           {
            
            distanceandDescription = currentDistances[i].toFixed(2);           
           }*/
            
            document.getElementById("firstData").innerHTML += "<tr class=\"rowborder\">" + "<td id=\"bold\">" + "<p>" + locations[i].name + "</p>" + "</td>" + "<td class=\"ratingSize\">" +  starHTML + "<p class=\"openFor\">" +/* "Closing in" + locationClosingTime + "Hrs." +  */"</p>" + "</td>"  
            + "<td class=\"distanceborder\">" +"<div>" + "</div>" +"</td>" + "<td class=\"distanceSize\">"  +  "<p>" + locations[i].distance +  "</p>" + "<p>" + "Miles Away" + "</p>" + "<img class=\"placeArrow\" src=\"../images/placeArrow.png\">" +"</td>" + "</tr>";
            
        }
        
        progressBar(callCount);
        //fills the progress bar because there are no more locations available
        $("#dataTable").trigger("update");
        if(info.hasNextPage === false)
        {
          
          progressBar(3);
          setTimeout(searchBar(),1500);
        }
         
        
        clickModal();
  }
   
  //this function gets the current day of the week, and the closing hours for each location(for each given day)
  function parseHours(location)
  { 
   
    var locationClosingTime ={}; 
    var timetoclose;
    var date = new Date();
    var hour = date.getHours();
    var minutes = date.getMinutes();
    var day = date.getDay();
    var noclose = true;
    var hourRequest = { 
            placeId: location.place_id
          };
          service = new google.maps.places.PlacesService(map);
          service.getDetails(hourRequest,function(results, status){
          console.log(status);
          if(results == null){ 
            noclose = false;
            return;
          }
          //console.log("location name" + location.name + results.opening_hours.periods[day].close.hours);
          locationClosingTime.hours = results.opening_hours.periods[day].close.hours;
          console.log("1:" + locationClosingTime.hours);
          locationClosingTime.minutes = results.opening_hours.periods[day].close.minutes;
          });
         console.log("2:" + locationClosingTime.hours);
         //(timetoclose <= 1) ? timetoclose = locationClosingTime.minutes - minutes : timetoclose = timetoclose.toString() + (locationClosingTime)
        
        console.log(timetoclose);
        return (noclose == true) ?  timetoclose : "Closing time unlisted";

  }


   function progressBar(callCount)
  {
    if (callCount == 1)
      {
        document.getElementById('activeBar').style.width = "33.3%";
      }
    else if (callCount == 2)
      {
        document.getElementById('activeBar').style.width = "66.6%"; 
      }
    else
      {
        document.getElementById('activeBar').style.width = "100%"; 
        $("#activeBar").delay(1000).fadeOut("slow", function()
          {
            $("#bar").css('visibility','hidden');
        });
        /* This is another api call to grab more places to list, this will probably be disabled until i refactor all of the generated html :D D: 
        setTimeout(function(){grabclosePlaces();},5000);
        */
      }
  }
  function parseReviews()
  {
    
    var service; 
    isDetails = true;
    for(var i = 0; i < totalLocations.length; i++)
    {
      
      if(tableDesc[3].childNodes[0].innerHTML == totalLocations[i].distance)
      {
        
        var request = 
        {
          placeId: totalLocations[i].place_id
        };
      console.log("test");
      service = new google.maps.places.PlacesService(map);
      service.getDetails(request,setReviewModal)
      }
  }
}

  function setReviewModal(results,status,info)
  {
    console.log(results);
    $("#headreview").show();
    document.getElementById('bodyreview').innerHTML = "";
    document.getElementById('headreview').innerHTML = "<tr><th>" + "Author" + "</th>" + "<th>" + "Experience" + "</th>" + "<th>" + "Rating / 5" + "</th>" + "</tr>";
    var allReviews = $.extend(true, [], results);
    

    for(var i = 0; i < results.reviews.length; i++)
    {
      //console.log("allReviews Before: " + allReviews[i].text);
      if(results.reviews[i].text.length < 5 )break;
      if(results.reviews[i].text.length > 100)
        results.reviews[i].text = results.reviews[i].text.substr(0,100);
      //console.log("allReviews After: " + allReviews[i].text);
      document.getElementById('bodyreview').innerHTML += "<tr class=\"reviewrows\">" + "<td class=\"reviewauthor\">" + results.reviews[i].author_name + "</td>" +  "<td class=\"reviewtext\">" + results.reviews[i].text + "...." + "</td>" 
      + "<td class=\"reviewrating\">" + results.reviews[i].rating  + "</td>" + "</tr>"; 

    }
     
    flip(false);
    moreInfo(allReviews);
  }
  
  function moreInfo(allResults)
  {
    
    $(".reviewrows").click(function(){

      //clicked results object is the children of the tr, so the author text and rating td's 
      var clickedResult = $(this).children();
      for(var i=0; i < allResults.reviews.length; i++)
      {
        if (allResults.reviews[i].author_name == clickedResult[0].innerHTML )
        {
          $("#headreview").hide();
          document.getElementById('bodyreview').innerHTML = allResults.reviews[i].text;
          
        }
      }
    });
  }

  

  function calculateDistance(locations,latitude,longitude)
   {  
      var distanceArray = new Array();
      for (var i=0; i < locations.length; i++)
      {
        distanceArray[i] = getDistanceFromLatLonInKm(latitude, longitude, locations[i].geometry.location.A, locations[i].geometry.location.F)
        //console.log("Distance Value" + distanceArray[i]);
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
  
 
function navigate()
  {
    
    
    var mobileMap = "http://maps.google.com/maps?saddr="+latitude + "," + longitude + "&daddr=" + currLat + "," + currLong;
    var x = document.getElementById('vehicle').value;
    var  mapUrl = "comgooglemaps://?saddr=" + latitude + "," + longitude + "&daddr=" + currLat + "," + currLong + "&directionsmode=" + x;
    if (isMobile.iOS())
    {
      setTimeout(function () { window.location = mapUrl; }, 25);
      
      window.location = "http://maps.apple.com/maps?saddr=" + latitude + "," + longitude + "&daddr=" + currLat + "," + currLong;
    }
  
   if(isMobile.Android())
     window.location = "http://maps.google.com/maps?saddr="+ latitude + "," + longitude+ "&daddr="+currLat+","+currLong;
  
   window.location = mobileMap;
  }


jQuery(document).ready(function($){
  
  //how long to wait to make the arrow visible.
  var offset = 300,
    //reduce the opacity of the arrow once we reach this point.
    offset_opacity = 1200,
    
    scroll_top_duration = 700,
    //back to top arrow.
    $back_to_top = $('.cd-top');

  //show or hide the arrow.
  $(window).scroll(function(){
    ( $(this).scrollTop() > offset ) ? $back_to_top.addClass('cd-is-visible') : $back_to_top.removeClass('cd-is-visible cd-fade-out');
    if( $(this).scrollTop() > offset_opacity ) { 
      $back_to_top.addClass('cd-fade-out');
    }
  });

  //smooth scroll to top
  $back_to_top.on('click', function(event){
    event.preventDefault();
    $('body,html').animate({
      scrollTop: 0 ,
      }, scroll_top_duration
    );
  });

});

  function flip(back)
  {
    if (back === true)
    {
      $(".modal").modal('hide');
       setTimeout(function(){$("#myModal").modal('show');},1500);
    }
    //var front = document.getElementById('myModal');
    
    //var back_content = $('#reviewmodal').html();
    /*var back;
    back = flippant.flip(front, back_content,'card');
    */
    if(back === false)
    {
    $("#myModal").modal('hide');

    setTimeout(function(){
      $('#modaltest').modal({
        keyboard: true
      });
    },500);
    
    }
}

function searchBar(){
    $('#search').css("display", "block");
  var $rows = $('.rowborder');
   $ ('#search').keyup(function() {
    var val = $.trim($(this).val()).replace(/ +/g, ' ').toLowerCase();
    console.log("value: " + val);
    $rows.show().filter(function() {
        var text = $(this).children("#bold").text().replace(/\s+/g, ' ').toLowerCase();
        return !~text.indexOf(val);
    }).hide();
}); 
}

