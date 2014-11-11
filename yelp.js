var lastYelpSearch;

function yelpSendRequest( action, parameters ) {

	var oauth = OAuth({
		consumer: {
			public: auth.consumerKey,
			secret: auth.consumerSecret
		},
		signature_method: 'HMAC-SHA1'
	});
	
	var token = {
		public: auth.accessToken,
		secret: auth.accessTokenSecret
	};
	
	var requestData = {
		url: action,
		method: 'GET',
		data: parameters
	};

	$.ajax({
		url: requestData.url,
		data: oauth.authorize( requestData, token ),
		dataType: "jsonp",
		cache: true,
		crossDomain: true,
		type: "GET",
		jsonp: false,
		jsonpCallback: false
	});

}

function yelpShowReviews( data ) {
	console.log( data );
	$( '#' + data.id + 'ReviewsRow' ).empty();
	$( '#' + data.id + 'ReviewsRow' ).attr( 'loaded', 'true' );
	
	var reviews = '';
	var style = 'style="background: #fafafa"';
	
	for( var i=0; i < data.reviews.length; i++ ) {
		reviews += '<div class="col-sm-12" ' + ((i%2)?(''):(style)) + '>';
		reviews += '<span style="font-style: italic">"' + data.reviews[i].excerpt +'"</span>';
		reviews += '<img style="margin-left: 5px" src="' + data.reviews[i].rating_image_small_url + '"></div>';
		reviews += '<div class="col-sm-12"' + ((i%2)?(''):(style)) + '>' + data.reviews[i].user.name + '</div>';
	}
	
	reviews += '<div class="col-sm-offset-4 col-sm-4" style="text-align: right">' + '<a target="_yelp" href="' + data.url + '">View all ' + data.review_count + ' review(s) on Yelp</a></div>';
	
	$( '#' + data.id + 'ReviewsRow' ).append( reviews );
		
}

function yelpFindReviews( id ) {

	var parameters = {
		callback: 'yelpShowReviews'
	};
	
	yelpSendRequest( 'http://api.yelp.com/v2/business/' + id, parameters );
}

var results = new Array();

function yelpFormatString( jsonString ) {

	var formattedString = new String;
	var length = jsonString.length;
	var indent = 0;
	
	for( var i=0; i<length; i++ ) {
	
		formattedString += jsonString[i];

		if( (indent > 0) 
				&& ((jsonString[i] == "}") || (jsonString[i] == "]")) ) {
			formattedString += '</span>';
			indent--;
		}
		
		if( (i < length) &&
				((jsonString[i+1] == "{") || (jsonString[i+1] == "[")) ) {
			indent++;
			formattedString += '<br><span style="margin-left: ' + (indent * 5) + 'px">';
		}
		
		if( jsonString[i] == "," )
			formattedString += "<br>";
	}
			
	return( formattedString );		
}


function yelpShowBusinesses( data ) {

	console.log( data );
	results = results.concat( data.businesses );
	
	var formattedString = (JSON.stringify( data, null )).replace( /,/g, ",<br>" ).replace( /\:\{/g, ":<br>{" ).replace( /\:\[/g, ":<br>[" );
	
	$( '#yelpResponse' ).empty();
	$( "#yelpResponse" ).append( yelpFormatString( JSON.stringify( data, null ) ) );
	
	$( '#yelpHeader > a' ).empty();
	$( '#yelpHeader > a' ).append( 'Yelp Results (' + data.total + ')' );
	$( '#yelpResults' ).empty();
	$( '#yelpResults' ).append( '<div class="row" style="font-weight: bold"><div class="col-sm-5">Name</div><div class="col-sm-3">Address</div><div class="col-sm-3">Phone</div><div class="col-sm-1">Rating</div></div>' 
	);
	for( var i=0; i < data.businesses.length; i++ ) {
		var business = data.businesses[i];
		var bizRow = '<div id="' + business.id + 'Row" class="row panel panel-default">';
		var reviewsRowId = business.id + 'ReviewsRow';
		
		bizRow += '<div class="col-sm-4 panel-heading"><a data-toggle="collapse" data-parent="#yelpReviews" href="#' + reviewsRowId +'">' + business.name + '</a></div>';
		bizRow += '<div class="col-sm-3">';
		for( var j=0; j < business.location.display_address.length; j++ ) {
			bizRow += business.location.display_address[j];
			if( (j+1) < business.location.display_address.length )
				bizRow += '<br>';
		}
		bizRow += '</div><div class="col-sm-3">' + business.display_phone + '</div>';
		bizRow += '<div class="col-sm-1"><img src="' + business.rating_img_url_small + '"></div>';
		$( '#yelpResults' ).append( bizRow );
		$( '#yelpResults' ).append( '<div id="' + reviewsRowId +'" class="row panel-collapse collapse" loaded="false" style="border: solid 1px; padding: 2px"><div class="col-sm-offset-2 col-sm-3" style="font-weight: bold">Loading Reviews...</div></div>' );
		$( '#' + reviewsRowId ).on( 'show.bs.collapse', function( ev ) {
				var businessId = this.id.replace( 'ReviewsRow', '' );
				if( $( '#' + this.id ).attr( 'loaded' ) == "false" )
					yelpFindReviews( businessId );
			});
		}
}


function yelpFindBusinesses( newSearch ) {

	newSearch.callback = 'yelpShowBusinesses';
	yelpSendRequest( 'http://api.yelp.com/v2/search', newSearch );
	delete newSearch.callback;

	lastYelpSearch = newSearch;
}
