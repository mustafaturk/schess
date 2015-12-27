var express = require('express'),
	app = express(),
	morgan = require('morgan'),
	server = require('http').Server(app),
	io = require('socket.io').listen(server),
	port = Number(process.env.PORT||3000),
	bodyParser = require('body-parser'),
	path = require('path'),
	COLOURS = { WHITE:0, BLACK:1, BOTH:2 };
	//publicDir=require('path').join(__dirname + '/public');

//configure app
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

//use middleware
app.use(morgan('dev'));
app.use(bodyParser());
app.use(express.static(__dirname + '/public'));

//app.use(express.static(publicDir));

server.listen(port);


var selectedUserName='',
	selectedSide='',
	selectedPlayer=0;


var allPlayers = [];
var waitingList = [];

app.get('/', function(req, res){
	res.render('index', {waitingList: waitingList});
} );

/*app.get('/onePlayer', function(req, res){
	res.render('onePlayer', {userName: selectedUserName, player: selectedPlayer, side: selectedSide });
} );

app.get('/twoPlayer', function(req, res){	
	res.render('twoPlayer', {index: waitingList.length - 1, userName: selectedUserName, player: selectedPlayer, side: selectedSide});
} );

app.post('/gameSetup', function(req, res){
	selectedUserName = req.body.userId;
	selectedPlayer = req.body.player;
	selectedSide = req.body.side;	

	if ( selectedUserName !='' & selectedPlayer == 1 & selectedSide == 'white' ){
		res.redirect('onePlayer');	
		//console.log(userName +' ' + ' ' + selectedPlayer + ' ' + selectedSide);
	}

	if ( selectedUserName !='' & selectedPlayer == 2 ){
		waitingList.push(
			{
				name: selectedUserName,
				side: selectedSide
			});
		res.redirect('twoPlayer');	
		//console.log(userName +' ' + ' ' + selectedPlayer + ' ' + selectedSide);
	}

	
});*/

io.sockets.on('connection', function(socket){
	socket.on('new player', function(data, callback){
        if(data in allPlayers){//checking if new user name in the nicknames array
            callback(false);        
        }else{
        	socket.nickname = data;            
            allPlayers[socket.nickname] = socket;//nick name index olarak socket de onun datası olarak kullanıldı.
            io.sockets.emit('waitingList', waitingList);
            //io.sockets.emit('allPlayers', Object.keys(allPlayers) );
            //console.log('socket : ' + socket);
            callback(true);
        }
    });

	socket.on('Two Player Setup', function(data){
		console.log(data.name +' : '+ data.side);
		if (data.side == COLOURS.WHITE) {
			socket.side = 0;
		}else{
			socket.side = 1;
		}

		waitingList.push(
			{
				name: data.name,
				side: data.side,
				timing:data.timing,
				increment:data.increment
			});
		io.sockets.emit('waitingList', waitingList);
	});

	socket.on('opponent selected', function(opponentName){
		for (var i = 0 ; i < waitingList.length ; i++){
    		if(opponentName == waitingList[i].name){//rakibin hala waitingList'te olup olmadığı kontrolü yapılıyor.
    			socket.opponent = allPlayers[opponentName]; // karşı tarafın soket numarası, karşı tarafı rakip olarak seçen tarafa tanımlanıyor.
    			//socket.timing = waitingList[i].timing; // belirlenmiş olan timing ve increment rakibi seçen tarafın socket'ine bağlanıyor.
    			//socket.increment = waitingList[i].increment;
    			allPlayers[opponentName].emit('challenge accepted', {nickname:socket.nickname, timing:waitingList[i].timing, increment:waitingList[i].increment}); //challenger'a rakibin ismi gönderiliyor.
    			waitingList.splice(i, 1); //seçilen rakip waitingList'ten çıkarılıyor.    			
    			io.sockets.emit('waitingList', waitingList);
    			break;    			
    		}else if(i == waitingList.length){//seçilen rakibin başka biri tarafından daha önce seçilerek listeden çıkmış olma durumu
    			io.sockets.emit('waitingList', waitingList);
    			allPlayers[socket.nickname].emit('no opponent', opponentName );
    		}    			 
    	}    	
	});

	socket.on('move', function(move){//gelen hamlenin rakibe gönderilmesi
		socket.opponent.emit('opponent move', move);
	});


	socket.on('challenge confirmed', function(opponent){//Challenger'ın soket.opponent'ına karşı tarafın socket numarasının bağlanması.
		socket.opponent = allPlayers[opponent.nickname];
		allPlayers[opponent.nickname].emit('start game', {yourName: opponent.nickname, yourSide: socket.side^1, opponentName: socket.nickname, opponentSide: socket.side, timing:opponent.timing, increment:opponent.increment});// karşı tarafa oyuna başlama sinyali gönderiliyor
		allPlayers[socket.nickname].emit('start game', {yourName: socket.nickname, yourSide: socket.side , opponentName: opponent.nickname, opponentSide: socket.side^1, timing:opponent.timing, increment:opponent.increment});
	});	

	socket.on('disconnect', function(data){
    	if(!socket.nickname)return;
    	if ( socket.opponent != null ){
    		socket.opponent.emit('Disconneted', socket.nickname);
    	}
    	console.log(socket.nickname + ' DISCONNECTED');
  		delete allPlayers[socket.nickname];
    	//allPlayers.splice(socket.nickname, 1); 

    	for (var i = 0 ; i < waitingList.length ; i++){
    		if(socket.nickname == waitingList[i].name){
    			//console.log('socket.nickname == waitingList[i].name : ' + socket.nickname + ' == ' +  waitingList[i].name);
    			console.log('waitingList.length - before delete: ' + waitingList.length);
    			waitingList.splice(i, 1);
    			

    			console.log('waitingList.length - after delete : ' + waitingList.length);
    			io.sockets.emit('waitingList', waitingList);
    			break;
    		}    			 
    	}    	
    	//io.sockets.emit('allPlayers', Object.keys(allPlayers) );
	});

	socket.on('Resign', function(){//Oyuncu oyundan çekildeiğini 'Resign' ile bildiriyor. Bu bildirim karşı tarafa 'Opponent Resigned' ile bildiriliyor.
		socket.opponent.emit('Opponent Resigned');
	});

	socket.on('New Game Request', function(){//Oyuncunun yeniden oynama isteği rakibe iletiliyor
		socket.opponent.emit('New Game Request');
	});

	socket.on('New Game Request Accepted', function(){//Oyuncunun yeniden oynama isteğinin kabul edildiği iletiliyor
		socket.opponent.emit('New Game Request Accepted');
	});

	socket.on('New Game Request Rejected', function(){//Oyuncunun yeniden oynama isteğinin reddedildiği iletiliyor
		socket.opponent.emit('New Game Request Rejected');
	});

	socket.on('Time is up', function(){
		socket.opponent.emit('Time is up');
	});
	
	socket.on('Have time', function(){
		socket.opponent.emit('Have time');
	});
	
	socket.on('My time is up too', function(){
		socket.opponent.emit('My time is up too');
	});
	
});


