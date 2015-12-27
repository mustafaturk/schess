$(function(){
	

	
	$(window).unload( function(){
		socket.emit("unload" , {index: index, userName: userName} );
	});
});