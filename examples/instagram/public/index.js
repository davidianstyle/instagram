$(function() {
    $.ajax({
	url: 'http://davidianstyle.ddns.net:3000/authcode',
	success: function(result, status, xhr) {
	    console.log(result);
	    document.location.href = 'https://api.instagram.com/oauth/authorize/?' + $.param(result);
	},
	error: function(xhr, status, error) {
	    console.log(error);
	}
    });
});
