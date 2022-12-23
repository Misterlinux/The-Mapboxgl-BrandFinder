
mapboxgl.accessToken =
"pk.eyJ1IjoibWlzdGVybGludXgiLCJhIjoiY2tnams0OGtzMDhqejJ4bGxmdWhia255YSJ9.htJI3nLHJoB62eOycK9KMA";

let mapboxClient= mapboxSdk({ accessToken: mapboxgl.accessToken });

let geoco = new mapboxgl.Map({
  container: "geoco",
  style: "mapbox://styles/misterlinux/clburrx6r006q14o773yfzcaz",
  center: [12.49395908933991, 41.88986297703349 ],
  zoom: 13,
  touchPitch: true
})


let mappa= document.getElementById("mappa")

/* geolocator current position */
const direct= new mapboxgl.GeolocateControl({
  positionOptions:{
    enableHighAccuracy: true
  },

  fitBoundsOptions:{
    maxZoom: 13
  },
  trackUserLocation: true,
  showUserHeading: true
})

geoco.addControl(direct, "top-right")

direct.on("geolocate", (e)=>{

  conta += 1

  if( testo.value && conta==1 ){

    centrino= [e.coords.longitude, e.coords.latitude]
    azione( centrino )
    conta+= 1
    geoco.removeControl(direct)

  }else if( !testo.value && conta==1 ){

    alert("Select a brand first")
    geoco.removeControl(direct)
  }

})
/* ---------------------------------- */
//input brand text
let testo= document.getElementById("testo")

let marchio;

//Chosen position and Store finder function with Text brand input
function azione( centro ){

  marchio = new mapboxgl.Marker()
    .setLngLat( centro )
    .addTo(geoco)

  //geocoding with chosen position 
  mapboxClient.geocoding
  .forwardGeocode({
    query: testo.value,
    proximity: centro,
    limit: 8
  })
  .send()
  .then((response) => {

    if (
      !response ||
      !response.body ||
      !response.body.features ||
      !response.body.features.length
    ) {
      alert("ERROR, incorect brand search")
      return;
    }

    async function mettere(){
      for( x of response.body.features ){

        let distanza= turf.distance( centro, x.center ) 

        //we only get brands in 6km and start the async images
        if( distanza< 6 ){

          //we get the photoes using foursquare API fetch
          const foto= await immaggini( x.properties.foursquare )
          //we create also the complete object data for the store
          let gian= {
            'type': 'Feature',
            'properties': {
              'address': x.properties.address,
              'category': x.properties.category,
              'foursquare': foto
            },
            'geometry': {
              'type': 'Point',
              'coordinates': x.center
            }
          }
        
          lontano.push( distanza )
          feta.push( gian )
        }

      }
    }

    //drawing icons on map function 
    async function icone(){

      await mettere()

      //if brands between 6km are returned
      if( feta.length ){

        const iacobo = {
          type: 'FeatureCollection',
          features: feta
        };

        let icon= 'https://img.icons8.com/sf-regular-filled/512/shop.png'

        geoco.loadImage(
          icon,
          (error, image) => {
          if (error) throw error;
            //we addImage to the Style, with its ID
            geoco.addImage('catt', image);
          }
        )

        //iacobo has the coords of each stores
        geoco.addLayer({
          id: 'running',
          type: 'symbol',
          source: {
            type: 'geojson',
            data: iacobo
          },
          layout: {
            'icon-image': 'catt', // ID image
            'icon-size': 0.075    // for size too
          }
        })

        //to draw the radius 6km
        let cerchio = turf.circle( centro, 6 );

        geoco.addLayer({
          id: 'circolo',
          type: 'fill',
          source: {
            type: 'geojson',
            data: cerchio
          },
          paint: {
            "fill-color": "#cbdaf2",
            "fill-opacity": 0.25
          }
        })

        //zoom based on most distant store
        let vedere= Math.max( ...lontano )

        let logaritmo= Math.pow(2, 11)/ ((vedere)/8) 
        zoomin= Math.log(logaritmo)/ Math.log(2)   

        geoco.flyTo({ 
          center: centro,
          zoom: zoomin
        });
      
      }else{
        marchio.remove()
        alert("No stores in a 6KM radius")
      }

    }

    //returned drawing async function
    icone()

    //click on createdLayer 
  geoco.on("click", "running", (e)=>{

    //feature properties have GEOjson properties e.features[0]
    //also azione(centrino) seems to store old values and repeat directions fetches, so I had to
    if( centro == centrino ){

      //distance used for zoom to also show popUp
      let dist= turf.distance( centro, [e.lngLat.lng, e.lngLat.lat] ) 

      let logarit= Math.pow(2, 11)/ ((dist)/10) 
      zoom= Math.log( logarit)/ Math.log(2)   

      geoco.flyTo({ 
        center: e.lngLat,
        zoom: zoom
      });

      //PopUp image and properties
      let unico= document.createElement("div")
      unico.className= "deluchi"

      let imma= document.createElement("img")
      imma.className= "tessera py-2"
      imma.src= e.features[0].properties.foursquare

      let desc= document.createElement("ul")
      desc.className= "nonlist ps-1"

      desc.innerHTML = `
      <li class="my-2"> 
        <b>Type:</b> 
        ${e.features[0].properties.category}
      </li>
      <li>
        <b>Address:</b>
        ${e.features[0].properties.address}
      </li>`;
      
      unico.appendChild( imma )
      unico.appendChild( desc )

      prop
        .setLngLat( e.lngLat )
        .setDOMContent( unico )
        .addTo( geoco )

      //directions function
      andiamo2( [ centro, [e.lngLat.lng, e.lngLat.lat] ] )

    }

  })
});

  testo.placeholder= testo.value
  testo.value= ""

}

/* ------------------------------- */
//conta click count, centrino chosen place, lontano for icon distances and feta for properties
let conta= 0
let centrino;
let lontano= []
let feta= []

//popup that happens when icon clicked
let popup={
  offset: [0, -10]
}
let prop= new mapboxgl.Popup(popup)

//reset input for each brand
testo.addEventListener("input", (e)=>{
  
  mappa.classList= "col-sm-12";
  content.style.display= "none"

  conta= 0
  centrino= []
  lontano= []

  if( geoco.getSource('running')  ){

    geoco.removeLayer('circolo')
    geoco.removeSource('circolo')

    feta=[]
    geoco.removeImage('catt')
    marchio.remove()

    geoco.removeLayer('running')
    geoco.removeSource('running')

    //this will work only if a direction was drawn, remove() will just close popup
    if( geoco.getSource('route') ){
      prop.remove()
      geoco.removeLayer('route')
      geoco.removeSource('route')  

      content.innerHTML= ""
    }
  }

  //to remove the GEOlocator
  if(geoco.hasControl(direct)){
    geoco.removeControl(direct)
    geoco.addControl(direct)
  }else{
    geoco.addControl(direct)
  }

})

/* ----------------------------------------- */

//on user map click
geoco.on("load", ()=>{

  geoco.on("click", (e)=>{

    conta+= 1
    //azione contains async funcions that make the event repeat, so I had to add teh counter before
    if( conta== 1 && testo.value ){

      centrino= [e.lngLat.lng, e.lngLat.lat]
      azione( centrino )
      conta+= 1

    }else if( conta==1 && !testo.value ){
      alert("First put a brand to search")  
    }
  
  })
})

// ------------------------------------

//content for the bootstrap columns on directions API
let content= document.getElementById("content")

//Direction API function
function andiamo2(arrivo){

  mapboxClient.directions 
  .getDirections({

    profile: 'driving-traffic',
    steps: true,

    //we choose to get the directions in geoJSON, if not we get polyline
    geometries: "geojson",
    waypoints: [
      {
        coordinates: arrivo[0],
        approach: 'unrestricted'
      },
      {
        coordinates: arrivo[1]
      }
    ]

  })
  .send()
  .then( (response) => {
    
    mappa.classList= "col-sm-9 p-sm-0";
    content.style.display= "block"

    //we get the new response body and delete the old
    const directions = response.body;
    content.innerHTML= ""

    //we need routes[0] for direction coordinates and steps
    let ruta= directions.routes[0]
    let punti= ruta.geometry.coordinates

    //the number of steps is not the number of coordinates for the directions
    let dritte= ruta.legs[0].steps

    //foreach works better to create instaces of loop elements
    dritte.forEach( (x,i) => {

      //kee the variables inside if you want to use each one
      let direzione= document.createElement("div")
      direzione.className= "py-2 direct"

      location.href= '#content'

      direzione.innerHTML=     
      `
        <div class="row m-1">
          <div class="col-1 p-1">
            <p> <b>${i}</b> </p>
          </div>
          <div class="col-11">
          
            <p> ${x.maneuver.instruction} for ${Math.round( x.distance)} m </p>

          </div>
        </div>

        <div class="bordo"></div>
      `

      content.appendChild(direzione)

      //bearing if for the zoom on each direction
      let bearing;

      direzione.addEventListener("click", ()=>{

        const activeItem = document.getElementsByClassName('active');

        if (activeItem[0]) {
          activeItem[0].classList.remove('active');
        }

        direzione.classList.add('active');
        
        //we need to create a popUp here for the mobile version
        prop.remove()

        if( i == (dritte.length -1) ){
          bearing= x.maneuver.bearing_before

        }else{
          bearing= x.maneuver.bearing_after
        }

        geoco.flyTo({ 
          center: x.maneuver.location,
          zoom: 18,
          bearing: bearing,
          pitch: 65
        });

      })

    });

    //Direction coords are drawn in a GEOjson source
    const geojson = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: punti 
      }
    };
    

  //if the route is not reseted we just set the new data
  if (geoco.getSource('route')) {

    geoco.getSource('route').setData(geojson);
    
  }else {
  //we draw the LINE using the geoJSON points
    geoco.addLayer({
      id: 'route',
      type: 'line',
      source: {
        type: 'geojson',
        data: geojson,
        lineMetrics: true,
      },
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-opacity': 0.8,
        'line-color': '#ffffff',
        'line-width': 7,
        //line-gradient using line-progress property
        'line-gradient': [
            'interpolate',
            ['linear'],
            ['line-progress'],
            0,
            '#8ab4f8',
            0.5,
            '#669df6',
            1,
            '#8ab4f8'
          ]
        },

    });
  }

  });  
}

// --------------------------

//using the code to get a store image stored
async function immaggini(avend){

  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: 'fsq3MaFyW40YVhwowCxVNW3e0ygYN9PVFFadJLePT8FplDQ='
    }
  };
  
  let preso= await fetch(`https://api.foursquare.com/v3/places/${avend}/photos`, options)

  if (preso.status >= 200 && preso.status <= 299) {

    let jsonato= await preso.json()
    let fine= await jsonato 
    
    if( fine.length> 0 ){
      return (fine[0].prefix+ "300x300" + fine[0].suffix)
    }else{
      return "https://shutr.bz/3hPX0YT"
    }

  }else{
    return "https://shutr.bz/3hPX0YT"
  }

}

/* ---------------------- */

if( mappa.getBoundingClientRect().width< 600 ){

  const navigato = new mapboxgl.NavigationControl()
  geoco.addControl(navigato, "top-left");
}
