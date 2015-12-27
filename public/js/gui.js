$("#SetFen").click(function () {
	var fenStr = $("#fenIn").val();
	if (fenStr == ''){
		NewGame(START_FEN);//Oyuncunun herhangi bir FEN değeri girmeden SET FEN butonuna basması durumunda default başlangıç durumu işleme alınıyor.
	}else{
		NewGame(fenStr);
	}	
});

$('#TakeButton').click( function () {
	if(GameBoard.hisPly > 0) {
		TakeSimMove();
		GameBoard.ply = 0;
		SetInitialBoardPieces();
	}
});

$('#ForwardButton').click( function () {
		ForwardSimMove();
		GameBoard.ply = 0;
		SetInitialBoardPieces();
});

$('#MoveButton').click( function () {
	var EngineMove = SearchController.best;
	GameBoard.side = GameController.PlayerSide;		
	PreSearch();
	var UserMove = SearchController.best;
	MakeSimMove(UserMove,EngineMove);
});

$('#NewGameButton').click( function () {
	if(player == 1){
		NewGame(START_FEN);
		if (mode == 2){
			$('#NewGameButton').attr("disabled", true);
			$('#Resign').attr("disabled", false);
			TotalSeconds = timing * 60;
			window.clearTimeout(setClearTime);//halihazırda çalışan timer'ı durdurmak için
			Tick();			
			TimerOn = BOOL.TRUE;
		}
	}else if(player == 2){
		socket.emit('New Game Request');
	}
	
});

$("#FlipButton").click(function () {	
	GameController.BoardFlipped ^= 1;
	console.log("Flipped:" + GameController.BoardFlipped);
	SetInitialBoardPieces();
});

$('#Resign').click(function(){
	GameController.GameOver = BOOL.TRUE;
	TimerOn = BOOL.FALSE;
	$('#NewGameButton').attr("disabled", false);
	$('#Resign').attr("disabled", true);
	if(side == COLOURS.WHITE & player == 1){
	    $("#GameStatus").text("Oyundan çekildiniz {Kazanan taraf SİYAH}");
    }else if(side == COLOURS.BLACK & player == 1){
	   	$("#GameStatus").text("Oyundan çekildiniz {Kazanan taraf BEYAZ}");
	}else if(side == COLOURS.WHITE & player == 2){
		$("#GameStatus").text("Oyundan çekildiniz {Kazanan taraf SİYAH}");
		socket.emit('Resign', side);
	}else if(side == COLOURS.BLACK & player == 2){
		$("#GameStatus").text("Oyundan çekildiniz {Kazanan taraf BEYAZ}");
		socket.emit('Resign');
	}
});

function NewGame(fenStr) {
	ParseFen(fenStr);
	PrintBoard();
	ClearMoveDisplay();
	InitBoardVars();
	SetInitialBoardPieces();
	CheckAndSet();
	if (player == 2){//Oyun tipi kontrolü ve side ataması
		GameBoard.side = sideInfoFromServer;
	}else{
		if(side == COLOURS.WHITE ){
			GameBoard.side = COLOURS.BLACK;
			PreSearch(); // start engine at the beginning of the game
			GameBoard.side = COLOURS.WHITE;	
		}else if (side == COLOURS.BLACK){
			GameBoard.side = COLOURS.WHITE;
			PreSearch(); // start engine at the beginning of the game
			GameBoard.side = COLOURS.BLACK;	
		}
	}
}

function ClearMoveDisplay(){
		
	cMoves = ""; 
	hMoves = "";

	$("#EngineMoves").text('' + cMoves);
	$("#UserMoves").text('' + hMoves);
}

function ClearAllPieces() {
	$(".Piece").remove();
}

function SetInitialBoardPieces() {

	var sq;
	var sq120;
	var file,rank;
	var rankName;
	var fileName;
	var imageString;
	var pieceFileName;
	var pce;
	
	ClearAllPieces();
	
	for(sq = 0; sq < 64; ++sq) {
		sq120 = SQ120(sq);
		pce = GameBoard.pieces[sq120];

		if(GameController.BoardFlipped == BOOL.TRUE) {
			sq120 = MIRROR120(sq120);
		}

		if(pce >= PIECES.wP && pce <= PIECES.bK) {
			AddGUIPiece(sq120, pce);
		}
	}
}

function ClickedSquare(pageX, pageY) {
	console.log('ClickedSquare() at ' + pageX + ',' + pageY);
	var position = $('#Board').position();
	
	var workedX = Math.floor(position.left);
	var workedY = Math.floor(position.top);
	
	pageX = Math.floor(pageX);
	pageY = Math.floor(pageY);
	
	var file = Math.floor((pageX-workedX) / 60);
	var rank = 7 - Math.floor((pageY-workedY) / 60);
	
	var sq = FR2SQ(file,rank);
	
	if(GameController.BoardFlipped == BOOL.TRUE) {
		sq = MIRROR120(sq);
	}
	
	console.log('Clicked sq:' + PrSq(sq));
	console.log('moveDone : '+ moveDone);
	console.log("GameController.GameOver : " + GameController.GameOver);
	if (GameController.GameOver == BOOL.FALSE & moveDone == BOOL.FALSE){
		console.log('return sq' + sq);
		SetSqSelected(sq);
		return sq;
	}	
	
}

$(document).on('click','.Piece', function (e) {
	if ( moveDone == BOOL.FALSE ){
		console.log('Piece Click');
		
		if(UserMove.from == SQUARES.NO_SQ) {
			UserMove.from = ClickedSquare(e.pageX, e.pageY);
		} else {
			UserMove.to = ClickedSquare(e.pageX, e.pageY);
		}
		
		if(UserMove.from != SQUARES.NO_SQ && UserMove.to != SQUARES.NO_SQ){
			if(player == 2){
				checkOppMoveAndPlay();
			}else{
				StopEngChangeSide();	
			}				
		}	
	}	
});

$(document).on('click','.Square', function (e) {
	if( moveDone == BOOL.FALSE ){
		console.log('Square Click');	
		if(UserMove.from != SQUARES.NO_SQ) {
			UserMove.to = ClickedSquare(e.pageX, e.pageY);		
			if(player == 2){
				checkOppMoveAndPlay();
			}else{
				StopEngChangeSide();	
			}	
		}	
	}	
});


socket.on('opponent move', function(move){//server'dan rakibin hamlesi alındıktan sonra ve kendi hamlen de yapılmışsa MakeSimMove() çağrılıyor.
	TimerOn = BOOL.TRUE;//Rakip bir move belirlediğinde timer tekrar çalıştırılıyor
	oppMove = move;
	if(uMv != NOMOVE){
		MakeSimMove(uMv, oppMove);
	}	
});


function checkOppMoveAndPlay(){//2 Player modunda kendi hamlenin doğruluğu doğruysa karşıya gönderilmesi ve rakibin hamle yapıp yapmadığının kontrolü ve yapmışsa MakeSimMove() cağırmak için kullanıldı. 
	StopEngChangeSide();
	if (uMv != NOMOVE){
		socket.emit('move', uMv );// yapılan hareket karşıya gönderiliyor.
		if ( oppMove != NOMOVE){////
			MakeSimMove(uMv, oppMove);//siyaz beyaz durumu kontrol edilecek.
		}	
	}
	
}

function StopEngChangeSide(){
	if(player == 1 & side == COLOURS.WHITE){
		//stop engine thinking
		SearchController.stop = BOOL.TRUE;
		//change side
		GameBoard.side = COLOURS.WHITE;
	}else if (player == 1 & side == COLOURS.BLACK){
		//stop engine thinking
		SearchController.stop = BOOL.TRUE;
		//change side
		GameBoard.side = COLOURS.BLACK;
	}
	
	uMv = ParseMove(UserMove.from,UserMove.to);	

	if (uMv != NOMOVE){//User Move yaptıktan sonra Forward butonuna basarsa history'de ileriye doğru olan hareketlerin silinmesi için eklendi.
		//CLOCK STOP EKLENECEK.
		moveDone = BOOL.TRUE;//Geçerli hamle yapıldıktan sonra değiştirilmemesi için kontrol flag'ı.

		if(timing != 0){
			if ( (player == 2 & oppMove == NOMOVE) || (player == 1 & SearchController.best == NOMOVE) ){
			TimerOn = BOOL.FALSE;//Geçerli hamle yapılıp rakibin hamle yapması beklenirken sayaç durduruluyor.	
			}
		}
		
		TotalSeconds += parseInt(Increments);//geçerli hareket yapıldığında artış miktarı toplam zamana ekleniyor.
		
		var index;
		for(index = GameBoard.hisPly ; index < MAXGAMEMOVES; ++index) {
			GameBoard.history[index].uMove = NOMOVE;
			GameBoard.history[index].eMove = NOMOVE;
			GameBoard.history[index].castlePerm = 0;
			GameBoard.history[index].uEnPas = SQUARES.NO_SQ;
			GameBoard.history[index].eEnPas = SQUARES.NO_SQ;
			GameBoard.history[index].fiftyMove = 0;
			GameBoard.history[index].posKey = 0;
		}
		if(player == 1){ 
			MakeSimMove(uMv, SearchController.best); 
			//SearchController.best = NOMOVE;//Bir sonraki hamle için bilgisayarın yeni move belirleyip belirlemediğini yukarıdaki if ile test etmek için NOMOVE yapılıyor.	
		}
	}else{
		DeselectSq(UserMove.from);
		DeselectSq(UserMove.to);		
		UserMove.from = SQUARES.NO_SQ;
		UserMove.to = SQUARES.NO_SQ;
		moveDone = BOOL.FALSE;
	}		
}

//MakeUserMove is replaced as MakeSimMove
function MakeSimMove(uM, eM) {


	var uMove = uM; //
	var eMove = eM; //SearchController.best;
	//CHANGE 1 
	if( (uMove != NOMOVE) && (eMove != NOMOVE) && (GameController.GameOver == BOOL.FALSE) ) {

		var eFrom = FROMSQ(eMove);
		var eTo = TOSQ(eMove);
		var uFrom = FROMSQ(uMove);
		var uTo = TOSQ(uMove);
		
		//var side = GameBoard.side;
		var userSide = COLOURS.BOTH;
		var engineSide = COLOURS.BOTH;
		if(player == 2){
			userSide = sideInfoFromServer;
			engineSide = sideInfoFromServer^1;
		}else if (player == 1 && side == COLOURS.WHITE){
			userSide = COLOURS.WHITE;
			engineSide = COLOURS.BLACK;
			//userSide = GameController.PlayerSide;
			//engineSide = GameController.EngineSide;		
		}else if (player == 1 && side == COLOURS.BLACK){
			userSide = COLOURS.BLACK;
			engineSide = COLOURS.WHITE;
		}

		var isUPcePawn = PiecePawn[GameBoard.pieces[uFrom]];//FityMove = 0 yapmak için kullanıldı.
		var isEPcePawn = PiecePawn[GameBoard.pieces[eFrom]];

		GameBoard.history[GameBoard.hisPly].posKey = GameBoard.posKey;		
		GameBoard.history[GameBoard.hisPly].uMove = uMove; //Her iki move kaydı için 2 elemanlı array tutulmaya başlanmıştır.
		GameBoard.history[GameBoard.hisPly].eMove = eMove; 
		GameBoard.history[GameBoard.hisPly].fiftyMove = GameBoard.fiftyMove;
		GameBoard.history[GameBoard.hisPly].uEnPas = GameBoard.enPas[0]; //Her iki enPas kaydı için 2 elemanlı array tutulmaya başlanmıştır.
		GameBoard.history[GameBoard.hisPly].eEnPas = GameBoard.enPas[1]; 
		GameBoard.history[GameBoard.hisPly].castlePerm = GameBoard.castlePerm;
		
		//console.log("MAKESIMMOVE ENPASS");
		//console.log("GameBoard.history[GameBoard.hisPly].uEnPas: "+GameBoard.history[GameBoard.hisPly].uEnPas);
		//console.log("GameBoard.enPas[GameController.PlayerSide]: "+ GameBoard.enPas[GameController.PlayerSide]);
		
		//wK ve bK'in yanyana gelip gelmediği kontrolü CheckResult()'da yapılıyor. Legal move varsa yapılıyor. Yoksa sonuç belirleniyor.
		if( (eTo == uTo) || (uTo == eFrom && eTo == uFrom) ){//Aynı kareye hareket veya birbirini yeme durumu			
			//Şah ve Piyon'un aynı kareye hareket etme durumu
			if( (GameBoard.pieces[eFrom]== PIECES.bK && GameBoard.pieces[uFrom]== PIECES.wP) || (GameBoard.pieces[eFrom]== PIECES.wK && GameBoard.pieces[uFrom]== PIECES.bP)){
				eMove = eMove | (MOVE(eFrom, eTo, GameBoard.pieces[uFrom], PIECES.EMPTY, 0));	
				ClearPiece(uFrom);
				MovePiece(eFrom, eTo);
			}else if( (GameBoard.pieces[uFrom]== PIECES.bK && GameBoard.pieces[eFrom]== PIECES.wP) || (GameBoard.pieces[uFrom]== PIECES.wK && GameBoard.pieces[eFrom]== PIECES.bP) ){
				uMove = uMove | (MOVE(uFrom, uTo, GameBoard.pieces[eFrom], PIECES.EMPTY, 0));
				ClearPiece(eFrom);
				MovePiece(uFrom, uTo);
			}else{		
				//function MOVE(from, to, captured, promoted, flag)
				//CAPTURE var mı yok mu sorusuna cevap verebilmek için move'lar sMove sonucu çıkan duruma göre capture yapıp yapmadıkları tekrar değerlendiriliyor. 
				//Capture varsa ekleniyor. FLAG varsa kaybolmaması için de || yapılıyor.
				uMove = uMove | (MOVE(uFrom, uTo, GameBoard.pieces[eFrom], PIECES.EMPTY, 0));
				eMove = eMove | (MOVE(eFrom, eTo, GameBoard.pieces[uFrom], PIECES.EMPTY, 0));
				ClearPiece(eFrom);
				ClearPiece(uFrom);						
			}
			
			//Capture durumları değiştiği için history update ediliyor.
			GameBoard.history[GameBoard.hisPly].uMove = uMove; 
			GameBoard.history[GameBoard.hisPly].eMove = eMove;
		} else if (uTo == eFrom && eTo != uFrom){
			if (GameBoard.pieces[eTo] != PIECES.EMPTY) ClearPiece(eTo);
			ClearPiece(eFrom);
			MovePiece(uFrom, uTo);
		}else if (uTo != eFrom && eTo == uFrom){
			if (GameBoard.pieces[uTo] != PIECES.EMPTY) ClearPiece(uTo);
			ClearPiece(uFrom);
			MovePiece(eFrom, eTo);
		}else {
			if (CAPTURED(uMove) != PIECES.EMPTY) {
				ClearPiece(uTo);
			}
			if (CAPTURED(eMove) != PIECES.EMPTY) {
				ClearPiece(eTo);
			}
	
			MovePiece(uFrom, uTo);
			MovePiece(eFrom, eTo);		
		}

		if( (uMove & MFLAGEP) != 0) {
			if(userSide == COLOURS.WHITE) {
				if(eFrom == uTo-10){//n zamanında enPas Move ile tahtadan çıkarılacak Pawn n+1'de bir ileri hamle yapıyorsa tespit edilip tahtadan çıkarılıyor. 
					ClearPiece(eTo);
				}
				else{
					ClearPiece(uTo-10);
				}
			} else {
				if(eFrom == uTo+10){//n zamanında enPas Move ile tahtadan çıkarılacak Pawn n+1'de bir ileri hamle yapıyorsa tespit edilip tahtadan çıkarılıyor. 
					ClearPiece(eTo);
				}
				else{
					ClearPiece(uTo+10);
				}				
			}
			//MovePiece(uFrom, uTo);		//Yukarıda halledildi.
		}
		
		if( (eMove & MFLAGEP) != 0) {
			if(engineSide == COLOURS.WHITE) {
				if(uFrom == eTo-10){//n zamanında enPas Move ile tahtadan çıkarılacak Pawn n+1'de bir ileri hamle yapıyorsa tespit edilip tahtadan çıkarılıyor. 
					ClearPiece(uTo);
				}
				else{
					ClearPiece(eTo-10);
				}
			} else {
				if(uFrom == eTo+10){//n zamanında enPas Move ile tahtadan çıkarılacak Pawn n+1'de bir ileri hamle yapıyorsa tespit edilip tahtadan çıkarılıyor. 
					ClearPiece(uTo);
				}
				else{
					ClearPiece(eTo+10);
				}				
			}
		}		
		
		// CHANGE 5		
		if( (uMove & MFLAGCA) != 0) {
			switch(uTo) {
				case SQUARES.C1:
					MovePiece(SQUARES.A1, SQUARES.D1);
				break;
				case SQUARES.C8:
					MovePiece(SQUARES.A8, SQUARES.D8);
				break;
				case SQUARES.G1:
					MovePiece(SQUARES.H1, SQUARES.F1);
				break;
				case SQUARES.G8:
					MovePiece(SQUARES.H8, SQUARES.F8);
				break;
				default: break;
			}
			//MovePiece(uFrom, uTo);
			
		}
		//CHANGE 6
		if( (eMove & MFLAGCA) != 0) {
			switch(eTo) {
				case SQUARES.C1:
					MovePiece(SQUARES.A1, SQUARES.D1);
				break;
				case SQUARES.C8:
					MovePiece(SQUARES.A8, SQUARES.D8);
				break;
				case SQUARES.G1:
					MovePiece(SQUARES.H1, SQUARES.F1);
				break;
				case SQUARES.G8:
					MovePiece(SQUARES.H8, SQUARES.F8);
				break;
				default: break;
			}
			//MovePiece(eFrom, eTo);
		}
	
		HASH_EP();		
		
		HASH_CA();//Mevcut CA-Key çıkarılıyor.
		
		GameBoard.castlePerm &= CastlePerm[uFrom];
		GameBoard.castlePerm &= CastlePerm[uTo];
		GameBoard.castlePerm &= CastlePerm[eFrom];
		GameBoard.castlePerm &= CastlePerm[eTo];
		
		GameBoard.enPas[COLOURS.WHITE] = SQUARES.NO_SQ;
		GameBoard.enPas[COLOURS.BLACK] = SQUARES.NO_SQ;
		
		HASH_CA();//Yeni veya aynı CA-Key ekleniyor.
	
		GameBoard.fiftyMove++;

		if(CAPTURED(uMove) != PIECES.EMPTY || CAPTURED(eMove) != PIECES.EMPTY) {
			//ClearPiece(to); // if else statement larda halledildi.			
			GameBoard.fiftyMove = 0;
		}
		
		GameBoard.hisPly++;
		//GameBoard.ply++; //search algoritması mevcut MakeMove()'u kullandığı için şu an için kaldırıldı. sSearch() geliştirilirse tekrar değerlendirilecek.
		
		if (isUPcePawn == BOOL.TRUE || isEPcePawn == BOOL.TRUE){
			GameBoard.fiftyMove = 0;
			if( (uMove & MFLAGPS) != 0 ) {
				if(GameController.BoardFlipped == BOOL.FALSE){//Bu durumda uMove tarafı beyaz oluyor
					GameBoard.enPas[COLOURS.WHITE]=uFrom+10;
				}else if(GameController.BoardFlipped == BOOL.TRUE){
					GameBoard.enPas[COLOURS.BLACK]=uFrom-10;	
				}
				HASH_EP();
			}
			if( (eMove & MFLAGPS) != 0 ) {
				if(GameController.BoardFlipped == BOOL.FALSE){//Bu durumda eMove tarafı beyaz oluyor
					GameBoard.enPas[COLOURS.BLACK]=eFrom-10;
				}else if(GameController.BoardFlipped == BOOL.TRUE){
					GameBoard.enPas[COLOURS.WHITE]=eFrom+10;	
				}
				HASH_EP();
			}
		}
						//çakışma durumunda board'dan çıkarılmış olma ihtimali kontrolü
		if(PROMOTED(uMove) != PIECES.EMPTY && uTo != eTo && uFrom != eTo)   {       
			ClearPiece(uTo);
			AddPiece(uTo, PROMOTED(uMove));
		}		
											//çakışma durumunda board'dan çıkarılmış olma ihtimali kontrolü
		if(PROMOTED(eMove) != PIECES.EMPTY && eTo != uTo && eFrom != uTo)   {       
			ClearPiece(eTo);
			AddPiece(eTo, PROMOTED(eMove));
		}
		
		console.log("GameBoard.history[GameBoard.hisPly].uEnPas: "+GameBoard.history[GameBoard.hisPly].uEnPas);
		console.log("GameBoard.enPas[GameController.PlayerSide]: "+GameBoard.enPas[GameController.PlayerSide]);
		
		cMoves += (GameBoard.hisPly +"."+ PrMove(eMove)+" "); 
		hMoves += (GameBoard.hisPly +"."+ PrMove(uMove)+" ");
		
		$("#EngineMoves").text('' + cMoves);
		$("#UserMoves").text('' + hMoves);
		$('textarea').scrollTop($('textarea')[0].scrollHeight);//textarea'nın en son move u gostermek uzere asagı dogru scroll etmesi için kullanıldı.

		PrintBoard();
		SetInitialBoardPieces();	
		CheckAndSet();	
		
		if (player == 1 & side == COLOURS.WHITE){
			GameBoard.side = COLOURS.BLACK;	
			PreSearch();
			TotalSecondsComp += parseInt(Increments);
			TimerOnComp = BOOL.FALSE;//Bilgisayar bir move belirlediğinde bilgisayar timerı durduruluyor
			TimerOn = BOOL.TRUE;//Bilgisayar bir move belirlediğinde oyuncu timerı tekrar çalıştırılıyor
			GameBoard.side = COLOURS.WHITE;	
		}else if (player == 1 & side == COLOURS.BLACK){
			GameBoard.side = COLOURS.WHITE;	
			PreSearch();
			TotalSecondsComp += parseInt(Increments);
			TimerOnComp = BOOL.FALSE;//Bilgisayar bir move belirlediğinde bilgisayar timerı durduruluyor
			TimerOn = BOOL.TRUE;//Bilgisayar bir move belirlediğinde oyuncu timerı tekrar çalıştırılıyor
			GameBoard.side = COLOURS.BLACK;	
		}
	}
	CountDownTimerComp.innerHTML = UpdateTimer(TotalSecondsComp);//TimerOnComp true olamadığı için update işlemi burada yapıldı
	console.log("TotalSecondsComp" + TotalSecondsComp);
	DeselectSq(UserMove.from);
	DeselectSq(UserMove.to);		
	UserMove.from = SQUARES.NO_SQ;
	UserMove.to = SQUARES.NO_SQ;
	uMv = NOMOVE;
	oppMove = NOMOVE;

	if ( player == 2){
		GameBoard.side = GameBoard.side^1;// iki kişilik oyunda GameBoard.side orjinal durumuna getiriliyor.
	}

	moveDone = BOOL.FALSE;
	//TimerOn = BOOL.TRUE;//Tek oyuncuda tekrar timer'ı aktif hale getirmek için
}//end of MakeSimMove()

function ForwardSimMove(){
	console.log("GameBoard.hisPly: "+GameBoard.hisPly);
	console.log("GameBoard.history[GameBoard.hisPly].uMove: "+GameBoard.history[GameBoard.hisPly].uMove);
	if(GameBoard.history[GameBoard.hisPly].uMove !=0 || GameBoard.history[GameBoard.hisPly].eMove !=0){
	MakeSimMove(GameBoard.history[GameBoard.hisPly].uMove, GameBoard.history[GameBoard.hisPly].eMove);
	}
}

function TakeSimMove(){
		
	GameBoard.hisPly--;
//    GameBoard.ply--;
	var userSide = GameController.PlayerSide;
	var engineSide = GameController.EngineSide;	
    
    var uMove = GameBoard.history[GameBoard.hisPly].uMove;
	var eMove = GameBoard.history[GameBoard.hisPly].eMove;
	var eFrom = FROMSQ(eMove);
	var eTo = TOSQ(eMove);
	var uFrom = FROMSQ(uMove);
	var uTo = TOSQ(uMove);
	
	HASH_EP();//Mevcut EnPas Key değerini çıkart.	
    HASH_CA();//Mevcut Castling değerini çıkart.
    
    GameBoard.castlePerm = GameBoard.history[GameBoard.hisPly].castlePerm;
    GameBoard.fiftyMove = GameBoard.history[GameBoard.hisPly].fiftyMove;
    GameBoard.enPas[GameController.PlayerSide] = GameBoard.history[GameBoard.hisPly].uEnPas;
    GameBoard.enPas[GameController.EngineSide] = GameBoard.history[GameBoard.hisPly].eEnPas;
	
	//console.log( " GameBoard.enPas[GameController.PlayerSide]: "+GameBoard.enPas[GameController.PlayerSide]);
	//console.log( " GameBoard.enPas[GameController.EngineSide]: "+GameBoard.enPas[GameController.EngineSide]);
	
    HASH_EP();
    HASH_CA();
    
    //GameBoard.side ^= 1;
    //CHANGE 4
	//HASH_SIDE();
	
	if( (eTo == uTo) || (uTo == eFrom && eTo == uFrom) ){//Aynı kareye hareket veya birbirini yeme durumu

		   	//King ve Pawn aynı kareye hareketinin geri alınması
	   if( (GameBoard.pieces[eTo]== PIECES.bK && CAPTURED(eMove) == PIECES.wP) || (GameBoard.pieces[eTo]== PIECES.wK && CAPTURED(eMove)== PIECES.bP)){
			console.log( " eTo: "+ eTo + " eFrom: "+eFrom+" CAPTURE(eMove): " +CAPTURED(eMove) );
			console.log( " uTo: "+ uTo + " uFrom: "+uFrom+" CAPTURE(uMove): " +CAPTURED(uMove) );
			MovePiece(eTo, eFrom);
			AddPiece(uFrom, CAPTURED(eMove));
		}else if( (GameBoard.pieces[uTo]== PIECES.bK && CAPTURED(uMove) == PIECES.wP) || (GameBoard.pieces[uTo]== PIECES.wK && CAPTURED(uMove)== PIECES.bP ) ){
			console.log( " eTo: "+ eTo + " eFrom: "+eFrom+" CAPTURE(eMove): " +CAPTURED(eMove) );
			console.log( " uTo: "+ uTo + " uFrom: "+uFrom+" CAPTURE(uMove): " +CAPTURED(uMove) );
			MovePiece(uTo, uFrom);
			AddPiece(eFrom, CAPTURED(uMove));
		}else{	
			AddPiece(uFrom, CAPTURED(eMove));
			AddPiece(eFrom, CAPTURED(uMove));			
		}
	} else if (uTo == eFrom && eTo != uFrom){
		MovePiece(uTo, uFrom);
		AddPiece(uTo, CAPTURED(uMove));
		if ( CAPTURED(eMove) != PIECES.EMPTY) AddPiece(eTo, CAPTURED(eMove));
	}else if (uTo != eFrom && eTo == uFrom){
		MovePiece(eTo, eFrom);
		AddPiece(eTo, CAPTURED(eMove));
		if ( CAPTURED(uMove) != PIECES.EMPTY) AddPiece(uTo, CAPTURED(uMove));
	}else {
		if (CAPTURED(uMove) != PIECES.EMPTY) {
			MovePiece(uTo, uFrom);
			AddPiece(uTo, CAPTURED(uMove));						
		}else{
			MovePiece(uTo, uFrom);
		}
		if (CAPTURED(eMove) != PIECES.EMPTY) {
			MovePiece(eTo, eFrom);
			AddPiece(eTo, CAPTURED(eMove));
		}else{
			MovePiece(eTo, eFrom);
		}		
	}
	
	if( (uMove & MFLAGEP) != 0) {
		if(userSide == COLOURS.WHITE) {
			AddPiece(uTo-10, PIECES.bP);
		} else {
			AddPiece(uTo+10, PIECES.wP);
		}
		//MovePiece(uTo, uFrom);	//yukarıda halledildi.	
	}
	if( (eMove & MFLAGEP) != 0) {
		if(engineSide == COLOURS.WHITE) {
			AddPiece(eTo-10, PIECES.bP);
		} else {
			AddPiece(eTo+10, PIECES.wP);
		}	
		//MovePiece(eFrom, eTo);     //yukarıda halledildi.
	}
	
    if( (MFLAGCA & uMove) != 0) {
        switch(uTo) {
        	case SQUARES.C1: MovePiece(SQUARES.D1, SQUARES.A1); break;
            case SQUARES.C8: MovePiece(SQUARES.D8, SQUARES.A8); break;
            case SQUARES.G1: MovePiece(SQUARES.F1, SQUARES.H1); break;
            case SQUARES.G8: MovePiece(SQUARES.F8, SQUARES.H8); break;
            default: break;
        }
    }
	if( (MFLAGCA & eMove) != 0) {
        switch(eTo) {
        	case SQUARES.C1: MovePiece(SQUARES.D1, SQUARES.A1); break;
            case SQUARES.C8: MovePiece(SQUARES.D8, SQUARES.A8); break;
            case SQUARES.G1: MovePiece(SQUARES.F1, SQUARES.H1); break;
            case SQUARES.G8: MovePiece(SQUARES.F8, SQUARES.H8); break;
            default: break;
        }
    }
	
	if(PROMOTED(uMove) != PIECES.EMPTY)   {       
		ClearPiece(uFrom);
		AddPiece(uFrom, (PieceCol[PROMOTED(uMove)] == COLOURS.WHITE ? PIECES.wP : PIECES.bP));
	}		
	if(PROMOTED(eMove) != PIECES.EMPTY)   {       
		ClearPiece(eFrom);
		AddPiece(eFrom, (PieceCol[PROMOTED(eMove)] == COLOURS.WHITE ? PIECES.wP : PIECES.bP));
	}	

	PrintBoard();
	SetInitialBoardPieces();	
	
	//promotion olduğunda hangi taşa promote edildiği move'un sonunda belirtildiği için son karakter silinerek normal format elde ediliyor.
	
	if(PROMOTED(eMove)) cMoves = cMoves.substr(0,cMoves.length-1);
	if(PROMOTED(uMove)) hMoves = hMoves.substr(0,hMoves.length-1);
	cMoves = cMoves.substr( 0, (cMoves.length - (GameBoard.hisPly >= 9 ? (GameBoard.hisPly >= 99?9:8) : 7)) );//Move çıktılarını geri almak için kullanıldı.
	hMoves = hMoves.substr( 0, (hMoves.length - (GameBoard.hisPly >= 9 ? (GameBoard.hisPly >= 99?9:8) : 7)) );
	$("#EngineMoves").text('' + cMoves);
	$("#UserMoves").text('' + hMoves);
	
	if(GameController.GameOver == BOOL.TRUE){//oyun sonlanmışsa ve geri alınmak istenirse ihtiyaç duyuluyor.
		GameController.GameOver = BOOL.FALSE;
		$("#GameStatus").text('');
	}
	SearchController.best = eMove;//Yeni seçilmiş bestmove yerine history'deki bestmove atanıyor.
		
}//End of TakeSimMove()


function PieceIsOnSq(sq, top, left) {

	if( (RanksBrd[sq] == 7 - Math.round(top/60) ) && 
		FilesBrd[sq] == Math.round(left/60) ) {
		return BOOL.TRUE;
	}
		
	return BOOL.FALSE;

}

function RemoveGUIPiece(sq) {

	$('.Piece').each( function(index) {
		if(PieceIsOnSq(sq, $(this).position().top, $(this).position().left) == BOOL.TRUE) {
			$(this).remove();
		}
	} );
	
}

function AddGUIPiece(sq, pce) {

	var file = FilesBrd[sq];
	var rank = RanksBrd[sq];
	var rankName = "rank" + (rank+1);
	var	fileName = "file" + (file+1);
	var pieceFileName = "images/" + SideChar[PieceCol[pce]] + PceChar[pce].toUpperCase() + ".png";
	var	imageString = "<image src=\"" + pieceFileName + "\" class=\"Piece " + rankName + " " + fileName + "\"/>";
	$("#Board").append(imageString);
}

/*
function MoveGUIPiece(move) {
	
	var from = FROMSQ(move);
	var to = TOSQ(move);	
	
	if(move & MFLAGEP) {
		var epRemove;
		if(GameBoard.side == COLOURS.BLACK) {
			epRemove = to - 10;
		} else {
			epRemove = to + 10;
		}
		RemoveGUIPiece(epRemove);
	} else if(CAPTURED(move)) {
		RemoveGUIPiece(to);
	}
	
	var file = FilesBrd[to];
	var rank = RanksBrd[to];
	var rankName = "rank" + (rank+1);
	var	fileName = "file" + (file+1);
	
	$('.Piece').each( function(index) {
		if(PieceIsOnSq(from, $(this).position().top, $(this).position().left) == BOOL.TRUE) {
			$(this).removeClass();
			$(this).addClass("Piece " + rankName + " " + fileName);
		}
	} );
	
	if(move & MFLAGCA) {
		switch(to) {
			case SQUARES.G1: RemoveGUIPiece(SQUARES.H1); AddGUIPiece(SQUARES.F1, PIECES.wR); break;
			case SQUARES.C1: RemoveGUIPiece(SQUARES.A1); AddGUIPiece(SQUARES.D1, PIECES.wR); break;
			case SQUARES.G8: RemoveGUIPiece(SQUARES.H8); AddGUIPiece(SQUARES.F8, PIECES.bR); break;
			case SQUARES.C8: RemoveGUIPiece(SQUARES.A8); AddGUIPiece(SQUARES.D8, PIECES.bR); break;
		}
	} else if (PROMOTED(move)) {
		RemoveGUIPiece(to);
		AddGUIPiece(to, PROMOTED(move));
	}	
}
*/

function MoveGUIPiece(move) {
	var from = FROMSQ(move);
	var to = TOSQ(move);
	
	var flippedFrom = from;
	var flippedTo = to;
	var epWhite = -10;
	var epBlack = 10;
	
	if(GameController.BoardFlipped == BOOL.TRUE) {
		flippedFrom = MIRROR120(from);
		flippedTo = MIRROR120(to);
		epWhite = 10;
		epBlack = -10;
	}
	
	if(move & MFLAGEP) {	
		var epRemove;			
		if(brd_side == COLOURS.BLACK) {
			epRemove = flippedTo + epWhite;
		} else {
			epRemove = flippedTo + epBlack;
		}
		console.log("en pas removing from " + PrSq(epRemove));
		RemoveGUIPiece(epRemove);
	} else if(CAPTURED(move)) {
		RemoveGUIPiece(flippedTo);
	}
	
	var rank = RanksBrd[flippedTo];
	var file = FilesBrd[flippedTo];
	var rankName = "rank" + (rank + 1);	
	var fileName = "file" + (file + 1);
	
	/*if(GameController.BoardFlipped == BOOL.TRUE) {
		rankName += "flip";
		fileName += "flip";
	}*/
	
	$( ".Piece" ).each(function( index ) {
     //console.log( "Picture:" + index + ": " + $(this).position().top + "," + $(this).position().left );
     if( (RanksBrd[flippedFrom] == 7 - Math.round($(this).position().top/60)) && (FilesBrd[flippedFrom] == Math.round($(this).position().left/60)) ){
     	//console.log("Setting pic ff:" + FilesBrd[from] + " rf:" + RanksBrd[from] + " tf:" + FilesBrd[to] + " rt:" + RanksBrd[to]);
     	$(this).removeClass();
     	$(this).addClass("Piece clickElement " + rankName + " " + fileName);     
     }
    });
    
    if(move & MFLAGCA) {  
    	if(GameController.BoardFlipped == BOOL.TRUE) {  	
			switch (to) {
				case SQUARES.G1: RemoveGUIPiece(MIRROR120(SQUARES.H1));AddGUIPiece(MIRROR120(SQUARES.F1),PIECES.wR); break;
				case SQUARES.C1: RemoveGUIPiece(MIRROR120(SQUARES.A1));AddGUIPiece(MIRROR120(SQUARES.D1),PIECES.wR); break;
				case SQUARES.G8: RemoveGUIPiece(MIRROR120(SQUARES.H8));AddGUIPiece(MIRROR120(SQUARES.F8),PIECES.bR); break;
				case SQUARES.C8: RemoveGUIPiece(MIRROR120(SQUARES.A8));AddGUIPiece(MIRROR120(SQUARES.D8),PIECES.bR); break;    			
			}  
		} else {
			switch (to) {
				case SQUARES.G1: RemoveGUIPiece(SQUARES.H1);AddGUIPiece(SQUARES.F1,PIECES.wR); break;
				case SQUARES.C1: RemoveGUIPiece(SQUARES.A1);AddGUIPiece(SQUARES.D1,PIECES.wR); break;
				case SQUARES.G8: RemoveGUIPiece(SQUARES.H8);AddGUIPiece(SQUARES.F8,PIECES.bR); break;
				case SQUARES.C8: RemoveGUIPiece(SQUARES.A8);AddGUIPiece(SQUARES.D8,PIECES.bR); break;    			
			}  
		}  	
    }
    var prom = PROMOTED(move);
    console.log("PromPce:" + prom);
    if(prom != PIECES.EMPTY) {
		console.log("prom removing from " + PrSq(flippedTo));
    	RemoveGUIPiece(flippedTo);
    	AddGUIPiece(flippedTo,prom);
    }
    
  //  printGameLine();
}

function DeselectSq(sq) {

	if(GameController.BoardFlipped == BOOL.TRUE) {
		sq = MIRROR120(sq);
	}
	
	$( ".Square" ).each(function( index ) {     
     if( (RanksBrd[sq] == 7 - Math.round($(this).position().top/60)) && (FilesBrd[sq] == Math.round($(this).position().left/60)) ){     	
     	$(this).removeClass('SqSelected');    
     }
    });
}

function SetSqSelected(sq) {
	
	if(GameController.BoardFlipped == BOOL.TRUE) {
		sq = MIRROR120(sq);
	}
	
	$( ".Square" ).each(function( index ) {    
	//console.log("Looking Sq Selected RanksBrd[sq] " + RanksBrd[sq] + " FilesBrd[sq] " + FilesBrd[sq] + " position " + Math.round($(this).position().left/60) + "," + Math.round($(this).position().top/60));	
     if( (RanksBrd[sq] == 7 - Math.round($(this).position().top/60)) && (FilesBrd[sq] == Math.round($(this).position().left/60)) ){   
		//console.log("Setting Selected Sq");
     	$(this).addClass('SqSelected');    
     }
    });
}



function DrawMaterial() {

	if (GameBoard.pceNum[PIECES.wP]!=0 || GameBoard.pceNum[PIECES.bP]!=0) return BOOL.FALSE;
	if (GameBoard.pceNum[PIECES.wQ]!=0 || GameBoard.pceNum[PIECES.bQ]!=0 ||
					GameBoard.pceNum[PIECES.wR]!=0 || GameBoard.pceNum[PIECES.bR]!=0) return BOOL.FALSE;
	if (GameBoard.pceNum[PIECES.wB] > 1 || GameBoard.pceNum[PIECES.bB] > 1) {return BOOL.FALSE;}
    if (GameBoard.pceNum[PIECES.wN] > 1 || GameBoard.pceNum[PIECES.bN] > 1) {return BOOL.FALSE;}
	
	if (GameBoard.pceNum[PIECES.wN]!=0 && GameBoard.pceNum[PIECES.wB]!=0) {return BOOL.FALSE;}
	if (GameBoard.pceNum[PIECES.bN]!=0 && GameBoard.pceNum[PIECES.bB]!=0) {return BOOL.FALSE;}
	 
	return BOOL.TRUE;
}

function ThreeFoldRep() {
	var i = 0, r = 0;
	
	for(i = 0; i < GameBoard.hisPly; ++i) {
		if (GameBoard.history[i].posKey == GameBoard.posKey) {
		    r++;
		}
	}
	return r;
}

function AnyMoveExist(){//CheckResult()'da her iki taraf için de çağırıldığı için kod tekrarını önlemek amacaıyla yeni bir fonksiyon olarak oluşturuldu.
	GameBoard.ply = 0;//ply'in bir önceki search işleminde MAXDEPTH'e ulaşması ihtimaline karşı sıfırlanmasında tedbiren fayda var.
	GenerateMoves();
	var index = 0;
	for( index = GameBoard.moveListStart[GameBoard.ply]; index < GameBoard.moveListStart[GameBoard.ply + 1]; ++index )  {	
       
        if ( MakeMove(GameBoard.moveList[index]) == BOOL.FALSE)  {
            continue;
        }       
		TakeMove();
		MoveFound[GameBoard.side]++;
		break;
    }
}

function CheckResult() {     //her arttırımda full move olduğu için 100 değeri 50 olarak değiştirildi.
	if(GameBoard.fiftyMove >= 50) {
		$('#NewGameButton').attr("disabled", false);
		$("#GameStatus").text("GAME DRAWN {fifty move rule}"); 
		return BOOL.TRUE;
	}
	
	if (ThreeFoldRep() >= 2) {
		$('#NewGameButton').attr("disabled", false);
     	$("#GameStatus").text("GAME DRAWN {3-fold repetition}"); 
     	return BOOL.TRUE;
    }
	
	if (DrawMaterial() == BOOL.TRUE) {
		$('#NewGameButton').attr("disabled", false);
     	$("#GameStatus").text("GAME DRAWN {insufficient material to mate}"); 
     	return BOOL.TRUE;
    }
    
	//HER İKİ SIDE İÇİN DE GenerateMoves YAPILACAK VE SON DURUM KONTROL EDİLECEK.
	MoveFound = [0,0];	
	AnyMoveExist();
	GameBoard.side = GameBoard.side^1;//Diğer side'ın legal move'unun olup olmadığına bakıldı.
	AnyMoveExist();
	
	//console.log('GameBoard.side: ' + GameBoard.side);
	//console.log('MoveFound[0]: ' +MoveFound[0]);
	//console.log('MoveFound[1]: ' +MoveFound[1]);
	//GameBoard.side = GameBoard.side^1;

	if( (MoveFound[0] != 0) && (MoveFound[1] != 0)) return BOOL.FALSE;


	var SideInCheck = SqAttacked(GameBoard.pList[PCEINDEX(Kings[GameBoard.side],0)], GameBoard.side^1);
	var OpSideInCheck = SqAttacked(GameBoard.pList[PCEINDEX(Kings[GameBoard.side^1],0)], GameBoard.side);
	
	if ( (SideInCheck == BOOL.TRUE) && (MoveFound[GameBoard.side] == 0) && (OpSideInCheck == BOOL.TRUE) && (MoveFound[GameBoard.side^1] == 0) ){
		$('#NewGameButton').attr("disabled", false);
		$("#GameStatus").text("GAME DRAWN {mutual mate}");//yeni bir kavram
	    return BOOL.TRUE;
	}else if( (SideInCheck == BOOL.TRUE) && (MoveFound[GameBoard.side] == 0) ){
		$('#NewGameButton').attr("disabled", false);
		if(GameBoard.side == COLOURS.WHITE) {			
	     	$("#GameStatus").text("GAME OVER {black mates}");
	      	return BOOL.TRUE;
        } else {	     	
	     	$("#GameStatus").text("GAME OVER {white mates}");
	     	return BOOL.TRUE;
        }
	} else if( (OpSideInCheck == BOOL.TRUE) && (MoveFound[GameBoard.side^1] == 0) ){
		$('#NewGameButton').attr("disabled", false);
		if(GameBoard.side^1 == COLOURS.WHITE) {
	      $("#GameStatus").text("GAME OVER {black mates}");
	      return BOOL.TRUE;
        } else {
	      $("#GameStatus").text("GAME OVER {white mates}");
	      return BOOL.TRUE;
        }
	} else if( (MoveFound[0] == 0) || (MoveFound[1] == 0)) {
		$('#NewGameButton').attr("disabled", false);
		$("#GameStatus").text("GAME DRAWN {stalemate}");
		return BOOL.TRUE;
	}
		
	return BOOL.FALSE;	
}

function CheckAndSet() {
	if(CheckResult() == BOOL.TRUE) {
		GameController.GameOver = BOOL.TRUE;
	} else {
		GameController.GameOver = BOOL.FALSE;
		$("#GameStatus").text('');
	}
}

function PreSearch() {
	if(GameController.GameOver == BOOL.FALSE) {
		SearchController.thinking = BOOL.TRUE;
		StartSearch(); // no need waiting
		//setTimeout( function() { StartSearch(); }, 200 );
	}
}

$('#SearchButton').click( function () {	
	GameController.PlayerSide = GameController.side ^ 1;
	PreSearch();
});

function StartSearch() {

	SearchController.depth = MAXDEPTH;
	var t = $.now();
	var tt = $('#ThinkTimeChoice').val();
	//var tt = 10;
	SearchController.time = parseInt(tt) * 1000;
	SearchPosition();
	
	//MakeMove(SearchController.best);    // moved to MakeUserMove()
	//MoveGUIPiece(SearchController.best); // moved to MakeUserMove()
	//CheckAndSet(); // moved to MakeUserMove()	
}
