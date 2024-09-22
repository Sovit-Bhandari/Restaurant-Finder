let map;
let markers = []; 
let infoWindow;
let nextPageToken = null;
let apiKey = null; 

// Function to load the Google Maps API script dynamically
async function loadGoogleMapsScript() {
    try {
        const response = await fetch('https://restaurant-finder-backend-p7v1.onrender.com/maps-api-key'); 
        const data = await response.json();
        apiKey = data.apiKey; 
        

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    } catch (error) {
        console.error('Failed to load Google Maps API script:', error);
    }
}

// Initialize the Google Map
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 27.9506, lng: -82.4572 },
        zoom: 12,
    });

    infoWindow = new google.maps.InfoWindow();

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            };
            map.setCenter(userLocation); 
            fetchNearbyRestaurants(userLocation);
        }, () => {
            console.error("Geolocation service failed. Showing default location.");
            fetchNearbyRestaurants({ lat: 27.9506, lng: -82.4572 }); 
        });
    } else {
        console.error("Browser doesn't support geolocation. Showing default location.");
        fetchNearbyRestaurants({ lat: 27.9506, lng: -82.4572 }); 
    }
}

// Fetch nearby restaurants using Google Places API
async function fetchNearbyRestaurants(location) {
    try {
        const response = await fetch(`https://restaurant-finder-backend-p7v1.onrender.com/restaurants?location=${location.lat},${location.lng}&term=restaurant`);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            displayRestaurants(data.results);
        } else {
            console.error('No nearby restaurants found.');
        }
    } catch (error) {
        console.error('Error fetching nearby restaurant data:', error);
    }
}

// Fetch restaurants based on user preference
async function findRestaurants() {
    clearMarkers(); 
    const preferenceInput = document.getElementById('preferenceInput').value.trim().toLowerCase();
    const locationInput = document.getElementById('locationInput').value.trim();

    if (!preferenceInput || !locationInput) {
        alert('Please provide both a preference and a location.');
        return;
    }

    try {
        const response = await fetch(`https://restaurant-finder-backend-p7v1.onrender.com/restaurants?location=${locationInput}&term=${preferenceInput}`);
        const data = await response.json();

        console.log('Search API response:', data); 

        if (data.results && data.results.length > 0) {
            nextPageToken = data.next_page_token; 
            displayRestaurants(data.results);
        } else {
            document.getElementById('restaurantList').innerHTML = '<li>No restaurants match your dietary preference or location.</li>';
        }
    } catch (error) {
        console.error('Error fetching restaurant data:', error);
    }
}

// Function to create a marker for each restaurant
function addMarker(restaurant) {
    const marker = new google.maps.Marker({
        position: restaurant.geometry.location,
        map: map,
        title: restaurant.name,
    });

    // Add click event listener to show an info window when the marker is clicked
    marker.addListener('click', () => {
        infoWindow.setContent(`
            <div>
                <strong>${restaurant.name}</strong><br>
                Address: ${restaurant.formatted_address}<br>
                Rating: ${restaurant.rating || 'N/A'} / 5
            </div>
        `);
        infoWindow.open(map, marker);
    });

    markers.push(marker);
}

// Function to clear all existing markers
function clearMarkers() {
    markers.forEach(marker => marker.setMap(null));
    markers = [];
}

// Display restaurant data on the map and in the list
function displayRestaurants(restaurants) {
    clearMarkers(); // Clear any previous markers
    const restaurantList = document.getElementById('restaurantList');
    restaurantList.innerHTML = ''; // Clear the list

    if (!restaurants || restaurants.length === 0) {
        console.error('No restaurant data available');
        return;
    }

    restaurants.forEach(restaurant => {

        const li = document.createElement('li');
        li.innerHTML = `
            <strong>${restaurant.name}</strong><br>
            Address: ${restaurant.formatted_address}<br>
            Rating: ${restaurant.rating || 'N/A'} / 5<br>
            Total Ratings: ${restaurant.user_ratings_total || 'N/A'}<br>
            ${restaurant.photos && restaurant.photos.length > 0 
                ? `<img src="${getPhotoUrl(restaurant.photos[0].photo_reference)}" alt="${restaurant.name}" width="300" />` 
                : ''}
            <br>
            <a href="https://www.google.com/maps/search/?api=1&query=${restaurant.name} ${restaurant.formatted_address}" target="_blank">View on Map</a>
        `;
        restaurantList.appendChild(li);


        addMarker(restaurant);
    });


    if (restaurants.length > 0) {
        const firstRestaurantLocation = restaurants[0].geometry.location;
        map.setCenter(firstRestaurantLocation);
    }
}


function getPhotoUrl(photoReference) {
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${apiKey}`;
}

window.onload = loadGoogleMapsScript;


document.addEventListener("DOMContentLoaded", function () {
    const footer = document.getElementById("footer");

    window.addEventListener("scroll", function () {

        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
            footer.style.display = "block";
            footer.style.display = "none";
        }
    });
});
