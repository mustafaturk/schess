function Tick() {
	if (GameController.GameOver == BOOL.TRUE){
		TimerOn = BOOL.FALSE;
		return;
	}

	if(timing != 0 & player == 1 & TotalSeconds <= 0 & TotalSecondsComp <= 0){
		TimerOn = BOOL.FALSE;//Geçerli hamle yapılıp rakibin hamle yapması beklenirken sayaç durduruluyor.
		GameController.GameOver = BOOL.TRUE;
		$("#GameStatus").text("OYUN BERABERE {İki taraf için de oyun süresi doldu!}");
		$('#NewGameButton').attr("disabled", false);
		$('#Resign').attr("disabled", true);
		return;
	}else if (timing != 0 & TotalSeconds <= 0) {
		//alert("Time's up!")//Buraya kimin yendiği mesajı konulacak.
		TimerOn = BOOL.FALSE;//Geçerli hamle yapılıp rakibin hamle yapması beklenirken sayaç durduruluyor.
		GameController.GameOver = BOOL.TRUE;
		if(player == 2 ){
			socket.emit('Time is up');		
		}else if(player == 1){
			if(side == COLOURS.WHITE){
				$("#GameStatus").text("Kazanan taraf SİYAH {Beyaz için oyun süresi doldu!}");	
			}else if (side == COLOURS.BLACK){
				$("#GameStatus").text("Kazanan taraf BEYAZ {Siyah için oyun süresi doldu!}");
			}
			$('#NewGameButton').attr("disabled", false);
			$('#Resign').attr("disabled", true);				
		}
		return;
	}else if(timing != 0 & player == 1 & TotalSecondsComp <= 0 ){
		TimerOnComp = BOOL.FALSE;//Geçerli hamle yapılıp rakibin hamle yapması beklenirken sayaç durduruluyor.
		GameController.GameOver = BOOL.TRUE;
		if(side == COLOURS.WHITE){
			$("#GameStatus").text("Kazanan taraf BEYAZ {Siyah için oyun süresi doldu!}");	
		}else if (side == COLOURS.BLACK){
			$("#GameStatus").text("Kazanan taraf SİYAH {Beyaz için oyun süresi doldu!}");
		}
		$('#NewGameButton').attr("disabled", false);
		$('#Resign').attr("disabled", true);
		return;	
	}

	if(TimerOn == BOOL.TRUE){//Geçerli hamle yapılıp rakibin hamle yapması beklenirken sayaç durduruluyor.
		TotalSeconds -= 1;
		CountDownTimer.innerHTML = UpdateTimer(TotalSeconds);			
	}
	if(TimerOnComp == BOOL.TRUE){//Geçerli hamle yapılıp rakibin hamle yapması beklenirken sayaç durduruluyor.
		TotalSecondsComp -= 1;
		CountDownTimerComp.innerHTML = UpdateTimer(TotalSecondsComp);			
	}	
	setClearTime = window.setTimeout("Tick()", 1000);	
}//End of Tick Function

function UpdateTimer(sec) {
	var Seconds = sec;

	//var Days = Math.floor(Seconds / 86400);
	//Seconds -= Days * 86400;

	var Hours = Math.floor(Seconds / 3600);
	Seconds -= Hours * (3600);

	var Minutes = Math.floor(Seconds / 60);
	Seconds -= Minutes * (60);

	var TimeStr = ( (Hours > 0) ? Hours + " saat " : "") + LeadingZero(Hours) + ":" + LeadingZero(Minutes) + ":" + LeadingZero(Seconds)

	return TimeStr;
}//End of UpdateTimer Function

function LeadingZero(Time) {

	return (Time < 10) ? "0" + Time : + Time;

}