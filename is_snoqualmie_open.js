//..is_snoqualmie_open.js, uly, dec2013..

/*jshint laxcomma:true, undef:true, supernew:true */
/*global require, setInterval */

/**
* This node.js server answers the following stupid question:
* "Is Snoqualmie Pass open yet for snowboarding?".
*
* @see http://www.summitatsnoqualmie.com/trails-lifts
* @see http://blog.miguelgrinberg.com/post/easy-web-scraping-with-nodejs
*/
var http    = require( 'http' )
  , request = require( 'request' )
  , cheerio = require( 'cheerio' )
  , _       = require( 'lodash' )

    // Local modules.
  , view    = require( 'view' )
  ;

//---------------------------------
//
// Constants, Scoped Variables, etc.
//
//---------------------------------

var SNOQUALMIE_TRAILS_INFO_URL = 'http://www.summitatsnoqualmie.com/trails-lifts'
  , INITIAL_RESPONSE           = 'doh!'

    /** The cached http response inbetween intervals. */
  , _response                  = INITIAL_RESPONSE

    /** 5 minute intervals (in msec). */
  , SCRAPE_INTERVAL = 1000 * 60 * 5
  ;

//---------------------------------
//
// Methods
//
//---------------------------------

/**
* Hit up the target site for data on our power, bro.
*/
var scrape_data = function() {
  request( SNOQUALMIE_TRAILS_INFO_URL, function( err, resp, body ) {
    if ( err ) {
      throw err;
    }
    var $ = cheerio.load( body );

    //
    // If nothing is available, that probably means they're closed;
    // ie. lifts & trails.
    //

    var is_closed = 0 === _.chain( $( '.lifts-snow-wrapper > .lifts-trails > .value' ).contents() )
        .collect( function( it ) {
          return parseInt( it.data, 10 );
        })
        .reduce( function( sum, n ) {
          return sum + n;
        })
        .value();

    update_view(
    { 'is_open':       !is_closed
    , 'last_modified': (new Date).toString()
    , 'url':           SNOQUALMIE_TRAILS_INFO_URL
    });
  });
};

/**
* Update our http response.
*/
var update_view = function( params ) {
  view.get_template_text( function( template_text ) {
    _response = _.template( template_text, params );
  });
};

//---------------------------------
//
// Main.
//
//---------------------------------

scrape_data();
setInterval( function() {
  scrape_data();
}, SCRAPE_INTERVAL );

http.createServer( function( request, response ) {
  response.writeHead( 200 );
  response.end( _response );
}).listen( 3000 );
