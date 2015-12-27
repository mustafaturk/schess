$(function($){//shorthand for document.ready();
	var socket = io.connect();
	var $choiceForm = $('#choiceForm');			
    var $name = $('#name'); 
    var $lastname = $('#lastname');
    //var $player = $("input[type='radio'][name='player']:checked").val();
	//var $side = $("input[type='radio'][name='side']:checked").val();
	var $deneme = $('#deneme');
		
	$choiceForm.submit(function(e){
		e.preventDefault();//we don't want to refresh the page
		if( $name.val() !='' && $('input[name="player"]:checked').val() == 1 )  {	
			window.open('http://127.0.0.1:3000/one', '_self');
		}

		//socket.emit('client choices', {'name': $name.val(), 'player': $("input[type='radio'][name='player']:checked").val(), 'side': $("input[type='radio'][name='side']:checked").val() } );
		//$name.val('');			
	});

	socket.on('new choices', function(data){
		$deneme.append(data.name + "<br/>" + data.player + "<br/>" + data.side + "<br/>");
	});

});