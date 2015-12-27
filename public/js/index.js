$(document).ready(function(){
	var userName = '';
	var wListLength = 0;
	
	//$('.mode').hide();
	disableButtons();
	//$('#Resign').attr("disabled", true);
	$('#nickCheck').click( function(){
		checkNick();
	});

	$('#userId').change(function(){
		checkNick();
	});

	$('#selectionForm').submit(function(e){
		e.preventDefault();//we don't want to refresh the page
		if(userName != '' & player == 1 & side == COLOURS.WHITE ){			
			GameBoard.side = COLOURS.BLACK;
			PreSearch(); // start engine at the beginning of the game
			GameBoard.side = COLOURS.WHITE;	
			$('#side1').append('Bilgisayar');
			$('#side0').append(userName);
			$('#lbUserMoves').append(userName);
			$('#lbEngineMoves').append('Bilgisayar');
			$('#form').hide();
			$('#wrapper').show();
			if(mode == 1){
				$('#Timer').hide();	
				$('#TimerComp').hide();	
			}else if(mode == 2){				
				$('#TimerUserName').append('<b>('+userName+'):</b>');
				TotalSeconds = timing * 60;
				TotalSecondsComp = timing*60;
				Increments = increment;
				$('#ThinkingTime').hide();
				$('#TimeInfo').show();	
				if(timing == 0){					
					$('#TimeInfo').append('Sınırsız');					
					$('#Timer').hide();
					$('#TimerComp').hide();
				}else{
					$('#TimeInfo').append(timing  +  ' dk. ve ' + increment + ' sn. artışlı');	
					$('#Timer').show();				
					$('#TimerComp').show();
					TimerOnComp = BOOL.TRUE;
					Tick();//Sayaç başlatılıyor.
					//Aşagıdaki 3 satır ile bilgisayarın yeniden bir hamle için karar vermesi sağlanarak. Karar sonrası sayacı durduruluyor.
					GameBoard.side = COLOURS.BLACK;
					PreSearch(); // start engine at the beginning of the game
					if(uMv == NOMOVE){
						TimerOnComp = BOOL.FALSE;
					}
					GameBoard.side = COLOURS.WHITE;						
				}						
			}			
		}else if (userName != '' & player == 1 & side == COLOURS.BLACK ){			
			GameController.BoardFlipped = BOOL.TRUE;
			SetInitialBoardPieces();
			GameBoard.side = COLOURS.WHITE;
			PreSearch(); // start engine at the beginning of the game
			GameBoard.side = COLOURS.BLACK;	
			$('#side1').append('Bilgisayar');
			$('#side0').append(userName);
			$('#lbUserMoves').append(userName);
			$('#lbEngineMoves').append('Bilgisayar');
			$('#form').hide();
			$('#wrapper').show();
			if(mode == 1){
				$('#Timer').hide();	
				$('#TimerComp').hide();	
			}else if(mode == 2){				
				$('#TimerUserName').append('<b>('+userName+'):</b>');
				TotalSeconds = timing * 60;
				TotalSecondsComp = timing*60;
				Increments = increment;
				$('#ThinkingTime').hide();
				$('#TimeInfo').show();	
				if(timing == 0){					
					$('#TimeInfo').append('Sınırsız');					
					$('#Timer').hide();
					$('#TimerComp').hide();
				}else{
					$('#TimeInfo').append(timing  +  ' dk. ve ' + increment + ' sn. artışlı');	
					$('#Timer').show();				
					$('#TimerComp').show();
					TimerOnComp = BOOL.TRUE;
					Tick();//Sayaç başlatılıyor.
					//Aşagıdaki 3 satır ile bilgisayarın yeniden bir hamle için karar vermesi sağlanarak. Karar sonrası sayacı durduruluyor.
					GameBoard.side = COLOURS.WHITE;
					PreSearch(); // start engine at the beginning of the game
					TotalSecondsComp += parseInt(Increments);//geçerli hareket yapıldığında artış miktarı toplam zamana ekleniyor.
					if(uMv == NOMOVE){
						TimerOnComp = BOOL.FALSE;
					}					
					GameBoard.side = COLOURS.BLACK;						
				}						
			}
		}

		if(userName != '' & player == 2 & side != ''){
			console.log('Timing: '  + timing);
			socket.emit('Two Player Setup', {name: userName, player:player, side:side, timing:timing, increment:increment});
			//$('#TimerComp').hide();
			$('#opponentWait').show();
			$('#form').hide();
			$('#wrapper').hide();	
		}
	});

	$('input[name="player"]').change(function(e) { // Select the radio input group
		player = $( this).val();
		if (userName != ''){
			if(player == 2 ){
				$('.timing').show();
				$('.increment').show();
				$('.mode').hide();
				if( wListLength > 0 ){
					$('#nickWarning').html('');
					$('.waitingListWrapper').show();
				}				
			}else if(player == 1){
				$('.timing').hide();
				$('.increment').hide();
				if (mode == 2){
					$('.timing').show();
					$('.increment').show();
				}
				$('.mode').show();
				$('.waitingListWrapper').hide();
			}
		}else{
			//$('.mode').hide();
			$('.waitingListWrapper').hide();
			$('#nickWarning').html('Lütfen bir isim giriniz!');
		}		
	});//player change

	$('input[name="side"]').change(function(e) { // Select the radio input group
		side = $( this).val(); 
	});

	$('input[name="mode"]').change(function(e) { // Select the radio input group
		mode = $( this).val();
		if( mode == 1 ){
			$('.timing').hide();
			$('.increment').hide();
			$('#NewGameButton').attr("disabled", false);
			$('#MoveButton').attr("disabled", false);
			$('#ForwardButton').attr("disabled", false);
			$('#TakeButton').attr("disabled", false);
		}else if ( mode == 2 ){			
			$('.timing').show();
			$('.increment').show();
		}		
	});

	function disableButtons(){
		$('#NewGameButton').attr("disabled", true);
		$('#MoveButton').attr("disabled", true);
		$('#ForwardButton').attr("disabled", true);
		$('#TakeButton').attr("disabled", true);
	}


	$('select[name="timing"]').change(function(e) {
		timing = $( this).val(); 
	});

	$('select[name="increment"]').change(function(e) {
		increment = $( this).val(); 
	});

	function checkNick(){
		userName = cleanInput($('#userId').val().trim());
		if( userName != ''){
			socket.emit('new player', userName, function(data){
				if(data){
					$('#nickWarning').html('Geçerli Kullanıcı İsmi!');					
					$('#userId').attr("readonly", true);
					$('#userId').css('background-color' , '#DEDEDE');
					$('#nickCheck').hide();
					if(player == 2 & wListLength > 0){
						$('#nickWarning').html('');
						$('.waitingListWrapper').show();
					}
				}else{
					$('#nickWarning').html('Bu isim daha önce alınmış. Lütfen başka isim deneyiniz!');
				}
			});	
		}else{
			$('#nickWarning').html('Lütfen bir isim giriniz!');
		}		
	}//checkNick
	
	socket.on('waitingList', function(data){
		wListLength = data.length;
		if (wListLength == 0){
			$('.waitingListWrapper').hide();
		}else if(wListLength > 0){
			//	alert(wListLength);
		
			$('.waitingList').html('<h3>İsim : </h3>');
		    $('.waitingListSide').html('<h3>Taraf : </h3>');
		    $('.waitingListTiming').html('<h3>Süre : </h3>');
	        var wListHtml ='<h3>İsim : </h3>';
	        var wListSideHtml ='<h3>Taraf : </h3>';
	        var wListTimingHtml ='<h3>Süre : </h3>';
	        
	        for(var i=0; i < data.length; i++ ){
	          wListHtml += '<p>' + data[i].name + '</p>';
	          wListSideHtml += '<p>' + SideColourString[data[i].side] + '</p>';
	          if( data[i].timing == 0 ){
	          	wListTimingHtml += '<p>' + "Sınırsız" + '</p>';
	          }else{
	          	wListTimingHtml += '<p>' + data[i].timing + 'dk.' + ' + ' + data[i].increment + 'sn.' + '</p>';
	          }	          
	        }

	        $('.waitingList').html(wListHtml);
	        $('.waitingListSide').html(wListSideHtml);
	        $('.waitingListTiming').html(wListTimingHtml);
	        if(player == 2)	$('.waitingListWrapper').show();
	        $(".waitingList p").click(function() { // waitingList'teki rakiplerden biri seçiliyor.
		    	var opponentName = $( this ).html();
		    	socket.emit('opponent selected', opponentName );
		 	});		 		
		}

	});//socket.on waitingList

	socket.on('challenge accepted', function(opponent){
		socket.emit('challenge confirmed', {nickname:opponent.nickname, timing:opponent.timing, increment:opponent.increment} );
	});

	socket.on('start game', function(data){
		player = 2;
		console.log('data.yourSide : ' + data.yourSide);
		if( data.yourSide == COLOURS.BLACK){
			GameController.BoardFlipped = BOOL.TRUE;
			SetInitialBoardPieces();
		}
		
		GameBoard.side = data.yourSide;
		sideInfoFromServer = data.yourSide; 
		side = data.yourSide;
		if(   data.yourSide == 0 ){
			$('#side0').append(data.yourName);
			$('#side1').append(data.opponentName);
			
			$('#lbUserMoves').append(data.yourName);
			$('#lbEngineMoves').append(data.opponentName);
		}else{
			$('#side0').append( data.yourName );
			$('#side1').append( data.opponentName );
			
			$('#lbUserMoves').append( data.yourName );
			$('#lbEngineMoves').append( data.opponentName );
		}

		$('.waitingListWrapper').hide();
		$('#opponentWait').hide();
		$('#form').hide();
		$('#FenInDiv').hide();
		//$('#ThinkingTime').html('<h3>Oyun Süresi</h3>');
		console.log('data.timing : ' + data.timing);
		
		if(data.timing == 0){
			$('#TimeInfo').append('Sınırsız');
			$('#Timer').hide();
		}else{
			$('#TimeInfo').append(data.timing  +  ' dk. ve ' + data.increment + ' sn. artışlı');
		} 	
		
		$('#ThinkingTime').hide();
		$('#TimeInfo').show();

		$('#wrapper').show();

		console.log('data.timing : ' + typeof data.timing);
		timing = data.timing;//Aynı oyun tekrar otnandığında kullanıldı 
		increment = data.increment;//Aynı oyun tekrar otnandığında kullanıldı
		TotalSeconds = data.timing * 60;
		Increments = data.increment;
		if(TotalSeconds > 0){
			Tick();//Sayaç başlatılıyor.
		}	

		//alert('MyName : ' + data.yourName + ' ' + 'My Side : ' + data.yourSide + ' opponentName : ' + data.opponentName + ' ' + 'opponent Side : ' + data.opponentSide);
	});			
	
	socket.on('Opponent Resigned', function(){//Rakibin oyundan çekilmesi durumunda alınacak olan mesaj
		GameController.GameOver = BOOL.TRUE;
		TimerOn = BOOL.FALSE;
		$('#NewGameButton').attr("disabled", false);
		$('#Resign').attr("disabled", true);
		if( side == 0 ){			
			$("#GameStatus").text("Rakibiniz oyundan çekildi {Kazanan taraf BEYAZ}");		
		}else if( side == 1 ){
			$("#GameStatus").text("Rakibiniz oyundan çekildi {Kazanan taraf SİYAH}");
		}
	});

	socket.on('New Game Request',function(){//Rakibin tekrar oynama isteği
		if (confirm ('Rakibinizin tekrar oynama isteğini kabul ediyor musunuz?') ){
			socket.emit('New Game Request Accepted');
			DeselectSq(UserMove.from);//move yapıldığında karşı taraf move yapmazsa yeni oyun isteğinde hali hazırdaki selection silnmiyordu. Bu durumu düzeltmek için eklendi
			DeselectSq(UserMove.to);//move yapıldığında karşı taraf move yapmazsa yeni oyun isteğinde hali hazırdaki selection silnmiyordu. Bu durumu düzeltmek için eklendi
			NewGame(START_FEN);
			$("#GameStatus").text("");
			$('#NewGameButton').attr("disabled", true);
			$('#Resign').attr("disabled", false);
			TotalSeconds = timing*60;			
			Increments = increment;
			window.clearTimeout(setClearTime);//halihazırda çalışan timer'ı durdurmak için
			Tick();			
			TimerOn = BOOL.TRUE;			
		}else{
			socket.emit('New Game Request Rejected');
		}
	});

	socket.on('New Game Request Accepted', function(){
		DeselectSq(UserMove.from);//move yapıldığında karşı taraf move yapmazsa yeni oyun isteğinde hali hazırdaki selection silnmiyordu. Bu durumu düzeltmek için eklendi
		DeselectSq(UserMove.to);//move yapıldığında karşı taraf move yapmazsa yeni oyun isteğinde hali hazırdaki selection silnmiyordu. Bu durumu düzeltmek için eklendi
		NewGame(START_FEN);
		$("#GameStatus").text("");
		$('#NewGameButton').attr("disabled", true);
		$('#Resign').attr("disabled", false);
		TotalSeconds = timing*60;
		Increments = increment;
		window.clearTimeout(setClearTime);//halihazırda çalışan timer'ı durdurmak için
		Tick();	
		TimerOn = BOOL.TRUE;
	}); 

	socket.on('New Game Request Rejected', function(){
		alert('Tekrar oynama isteğiniz kabul edilmedi!');
	});

	socket.on('Disconneted', function(data){//Rakibin oyundan çekilmesi durumunda alınacak olan mesaj
		if (GameController.GameOver == BOOL.FALSE){
			GameController.GameOver = BOOL.TRUE;
			$('#NewGameButton').attr("disabled", true);
			$('#Resign').attr("disabled", true);
			if( side == 0 ){
				$("#GameStatus").text("Rakibiniz oyunu terketti {Kazanan taraf BEYAZ}");		
			}else if( side == 1 ){
				$("#GameStatus").text("Rakibiniz oyunu terketti {Kazanan taraf SİYAH}");
			}	
		}		
	});

	socket.on('Time is up', function(){
		TimerOn = BOOL.FALSE;
		if(TotalSeconds > 0){
			socket.emit('Have time');
			GameController.GameOver = BOOL.TRUE;
			if( side == 0 ){
				$("#GameStatus").text("Süre doldu {Kazanan taraf BEYAZ}");		
			}else if( side == 1 ){
				$("#GameStatus").text("Süre doldu {Kazanan taraf SİYAH}");
			}
		}else{
			socket.emit('My time is up too');
			GameController.GameOver = BOOL.TRUE;
			$("#GameStatus").text("Karşılıklı süre doldu { SONUÇ: PAT }");
		}
		$('#NewGameButton').attr("disabled", false);
		$('#Resign').attr("disabled", true);
	});
	
	socket.on('Have time', function(){
		GameController.GameOver = BOOL.TRUE;
		if( side == 0 ){
			$("#GameStatus").text("Süre doldu {Kazanan taraf SİYAH}");		
		}else if( side == 1 ){
			$("#GameStatus").text("Süre doldu {Kazanan taraf BEYAZ}");
		}
		$('#NewGameButton').attr("disabled", false);
		$('#Resign').attr("disabled", true);	
	});

	socket.on('My time is up too', function(){
		GameController.GameOver = BOOL.TRUE;
		$("#GameStatus").text("Karşılıklı süre doldu { SONUÇ: PAT }");
		$('#NewGameButton').attr("disabled", false);
		$('#Resign').attr("disabled", true);
	});

	// Prevents input from having injected markup
	function cleanInput (input) {
	    return $('<div/>').text(input).text();
	}

});//document.ready()

	