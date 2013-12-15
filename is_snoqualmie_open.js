//..is_snoqualmie_open.js, uly, dec2013..

/*jshint laxcomma:true, undef:true, supernew:true */
/*global require, setInterval, process, console */

/**
* This node.js server answers the following stupid question:
* "Is Snoqualmie Pass open yet for snowboarding?".
*
* Heroku Info:
* - App URL: http://is-snoqualmie-pass-open-yet.herokuapp.com/
* - Git URL: git@heroku.com:is-snoqualmie-pass-open-yet.git
*
* GitHub Info:
* - git@github.com:aschyiel/is_snoqualmie_open.git
*
* References:
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
// Faux-Constants, Scoped Variables, etc.
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
* Hit up the site for data on our fresh powder (or lack-there-of), bro.
*/
var scrape_data = function() {
  request( SNOQUALMIE_TRAILS_INFO_URL, function( err, resp, body ) {
    if ( err ) {
      throw err;
    }
    var $ = cheerio.load( body );

    //
    // Count the number of currently available trails and lifts.
    // You need at least a single lift and trail pair to be open;
    // otherwise for all intents and purposes it's closed.
    //

    var li        = $( '.lifts-snow-wrapper > .lifts-trails > .value' ).contents()

        // If either our CSS selector fails, or they change this part
        // of their page, hopefully we'll know and fail gracefully.
      , has_em    = 2 === li.length

      , trails    = has_em && parseInt( li[0].data, 10 ) || 0
      , lifts     = has_em && parseInt( li[1].data, 10 ) || 0
      , is_closed = !lifts || !trails
      ;
    if ( !has_em ) {
      var failure_message = 'Our CSS selector sucks!';
      console.warn( failure_message );
      update_fail_view( failure_message );
    } else {
      update_view(
      { 'is_open':       !is_closed
      , 'last_modified': (new Date).toString()
      , 'url':           SNOQUALMIE_TRAILS_INFO_URL
      });
    }
  });
};

/**
* Update our cached http response.
*/
var update_view = function( params ) {
  view.get_template_text( function( template_text ) {
    _response = _.template( template_text, params );
  });
};

/**
* Let me know that it failed for one reason or another.
*/
var update_fail_view = function( message ) {
  _response = 'Well, this is embarassing: ' + message +'\n\n'+
      'Lemme know and I\'ll fix it pronto (https://github.com/aschyiel).';
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
}).listen( process.env.PORT || 3000 );
