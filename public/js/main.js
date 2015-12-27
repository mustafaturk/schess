$(function() {
	init();
	console.log("Main Init Called");	
	NewGame(START_FEN);	
});


//var MirrorFiles = [ FILES.FILE_H, FILES.FILE_G, FILES.FILE_F, FILES.FILE_E, FILES.FILE_D, FILES.FILE_C, FILES.FILE_B, FILES.FILE_A ];
//var MirrorRanks = [ RANKS.RANK_8, RANKS.RANK_7, RANKS.RANK_6, RANKS.RANK_5, RANKS.RANK_4, RANKS.RANK_3, RANKS.RANK_2, RANKS.RANK_1 ];

function MIRROR120(sq) {
	return 119 - sq; //Orijinal fonksiyon gereksiz uzun olduğu için bu şekilde değiştirildi.
	//var file = MirrorFiles[FilesBrd[sq]];
	//var rank = MirrorRanks[RanksBrd[sq]];
	//return FR2SQ(file,rank);
}


function InitFilesRanksBrd() {
	
	var index = 0;
	var file = FILES.FILE_A;
	var rank = RANKS.RANK_1;
	var sq = SQUARES.A1;
	
	for(index = 0; index < BRD_SQ_NUM; ++index) {
		FilesBrd[index] = SQUARES.OFFBOARD;
		RanksBrd[index] = SQUARES.OFFBOARD;
	}
	
	for(rank = RANKS.RANK_1; rank <= RANKS.RANK_8; ++rank) {
		for(file = FILES.FILE_A; file <= FILES.FILE_H; ++file) {
			sq = FR2SQ(file,rank);
			FilesBrd[sq] = file;
			RanksBrd[sq] = rank;
		}
	}
}

function InitHashKeys() {
    var index = 0;
	
	for(index = 0; index < 14 * 120; ++index) {				
		PieceKeys[index] = RAND_32();
	}
	
	//SideKey = RAND_32();
	
	for(index = 0; index < 16; ++index) {
		CastleKeys[index] = RAND_32();
	}
}

function InitSq120To64() {

	var index = 0;
	var file = FILES.FILE_A;
	var rank = RANKS.RANK_1;
	var sq = SQUARES.A1;
	var sq64 = 0;

	for(index = 0; index < BRD_SQ_NUM; ++index) {
		Sq120ToSq64[index] = 65;
	}
	
	for(index = 0; index < 64; ++index) {
		Sq64ToSq120[index] = 120;
	}
	
	for(rank = RANKS.RANK_1; rank <= RANKS.RANK_8; ++rank) {
		for(file = FILES.FILE_A; file <= FILES.FILE_H; ++file) {
			sq = FR2SQ(file,rank);
			Sq64ToSq120[sq64] = sq;
			Sq120ToSq64[sq] = sq64;
			sq64++;
		}
	}

}

function InitBoardVars() {

	var index = 0;
	for(index = 0; index < MAXGAMEMOVES; ++index) {//struct arrray oluşturuluyor.
		GameBoard.history.push( {
			uMove : NOMOVE,
			eMove : NOMOVE,
			castlePerm : 0,
			uEnPas : SQUARES.NO_SQ,
			eEnPas : SQUARES.NO_SQ,
			fiftyMove : 0,
			posKey : 0
		});
	}	
	var i = 0;
	
	for(index = 0; index < MAXGAMEMOVES; ++index) {//struct array sıfırlanıyor.
		GameBoard.history[index].uMove = NOMOVE;
		GameBoard.history[index].eMove = NOMOVE;
		GameBoard.history[index].castlePerm = 0;
		GameBoard.history[index].uEnPas = SQUARES.NO_SQ;
		GameBoard.history[index].eEnPas = SQUARES.NO_SQ;
		GameBoard.history[index].fiftyMove = 0;
		GameBoard.history[index].posKey = 0;
	}
	/*
	while(GameBoard.history[i].uMove != NOMOVE){
			console.log("GameBoard.history[i]uMove : "+GameBoard.history[i].uMove);
			i++;
	}*/
	for(index = 0; index < PVENTRIES; ++index) {
		GameBoard.PvTable.push({
			move : NOMOVE,
			posKey : 0
		});
	}
	
	for(index = 0; index < PVENTRIES; ++index) {
		GameBoard.PvTable[index].move = NOMOVE;
		GameBoard.PvTable[index].posKey = 0;
	}
}

/*function InitBoardVars() {

	var index = 0;
	for(index = 0; index < MAXGAMEMOVES; ++index) {
		GameBoard.history[index].uMove = NOMOVE;
		GameBoard.history[index].eMove = NOMOVE;
		GameBoard.history[index].castlePerm = 0;
		GameBoard.history[index].uEnPas = SQUARES.NO_SQ;
		GameBoard.history[index].eEnPas = SQUARES.NO_SQ;
		GameBoard.history[index].fiftyMove = 0;
		GameBoard.history[index].posKey = 0;
	}
	var i = 0;
	while(GameBoard.history[i].uMove != NOMOVE){
			console.log("GameBoard.history[i]uMove : "+GameBoard.history[i].uMove);
			i++;
	}
	
	
	for(index = 0; index < PVENTRIES; ++index) {
		GameBoard.PvTable[index].move = NOMOVE;
		GameBoard.PvTable[index].posKey = 0;
	}
}
*/
/*
function InitBoardSquares() {
	var light = 0;
	var rankName;
	var fileName;
	var divString;
	var lastLight = 0;
	var rankIter = 0;
	var fileIter = 0;
	var lightString;
	
	for(rankIter = RANKS.RANK_8; rankIter >= RANKS.RANK_1; rankIter--) {
		light = lastLight ^ 1;
		lastLight ^= 1;
		rankName = "rank" + (rankIter+1);
		for(fileIter = FILES.FILE_A; fileIter <= FILES.FILE_H; fileIter++) {
			fileName = "file" + (fileIter+1);
			
			if(light==0) lightString="Light";
			else lightString = "Dark";
			divString = "<div class=\"Square " + rankName + " " + fileName + " " + lightString + "\"/>";
			light^=1;
			$("#Board").append(divString);
 		}
 	}
}
*/
function InitBoardSquares() {
	var light = 1;
	var rankName;
	var fileName;
	var divString;
	var rankIter;
	var fileIter;
	var lightString;
	
	for(rankIter = RANKS.RANK_8; rankIter >= RANKS.RANK_1; rankIter--) {
		light ^= 1;
		rankName = "rank" + (rankIter + 1);
		for(fileIter = FILES.FILE_A; fileIter <= FILES.FILE_H; fileIter++) {
			fileName = "file" + (fileIter + 1);
			if(light == 0) lightString="Light";
			else lightString = "Dark";
			light^=1;
			divString = "<div class=\"Square " + rankName + " " + fileName + " " + lightString + "\"/>";
			$("#Board").append(divString);
		}
	}
	
}

function init() {
	console.log("init() called");
	InitFilesRanksBrd();
	InitHashKeys();
	InitSq120To64();
	InitBoardVars();
	InitMvvLva();
	InitBoardSquares();
}



function ClearAllPieces() {
	console.log("Removing pieces");
	$(".Piece").remove();
}

/*
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
	for( sq = 0; sq < 64; ++sq) {
		
		sq120 = SQ120(sq);
		
		pce = GameBoard.pieces[sq120]; // crucial here
		
		if(GameController.BoardFlipped == BOOL.TRUE) {
			sq120 = MIRROR120(sq120);
		}
		
		file = FilesBrd[sq120];
		rank = RanksBrd[sq120];
		
		
		if(pce>=PIECES.wP && pce<=PIECES.bK) {				
			rankName = "rank" + (rank + 1);	
			fileName = "file" + (file + 1);
			
			pieceFileName = "images/" + SideChar[PieceCol[pce]] + PceChar[pce].toUpperCase() + ".png";
			imageString = "<image src=\"" + pieceFileName + "\" class=\"Piece " + rankName + " " + fileName + "\"/>";
			//console.log(imageString);
			$("#Board").append(imageString);
		}
	}

}
*/