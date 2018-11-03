function calque1Play(lib) {

    document.body.style.backgroundColor = "#000000"

    var socket = io.connect(document.URL.split(/\//g).slice(0,3).join("/"));

	socket.on('createSucces', doStartPlaying);

	/*
		We can't play before recieving an id
		This function handle this async condition
	*/
	function doStartPlaying(pData) {

        var objectId = pData.id;
		var playerList = pData.playerList;
        var playerPointerList = [];

        playerList.forEach(
            function(pData, pIndex) {
                playerPointerList[pIndex] = createPlayerPointer(pData.x, pData.y)
            }
        )

        socket.on('playerLeaved', doPlayerLeaved);
		socket.on('playerJoined', doPlayerJoined);
		socket.on('objectMoved', doObjectMoved);
		canvas.addEventListener("mousemove", doMouseMove);

        //console.log(stage);

		/*	Get Events Functions	*/
        function doPlayerLeaved(pData) {
            playerList = pData.playerList;
            stage.removeChild(playerPointerList[pData.id]);
            playerPointerList[pData.id] = undefined;
        }

		function doPlayerJoined(pData) {
            playerList = pData.playerList;

            if (objectId == pData.id)
                return;

            playerPointerList[pData.id] = createPlayerPointer(playerList[pData.id].x, playerList[pData.id].y);
		}

		function doObjectMoved(pData) {
            if (objectId == pData.id)
                return;

            var lMyClientPlayer = playerPointerList[pData.id];

            lMyClientPlayer.x = pData.x ;
            lMyClientPlayer.y = pData.y;
		}

		/*	Send Events Functions	*/
		function doMouseMove(pEvent) {
            var lMyClientPlayer = playerPointerList[objectId];
            lMyClientPlayer.x = stage.mouseX / stage.scaleX;
            lMyClientPlayer.y = stage.mouseY / stage.scaleY;

			socket.emit('mouseMove', { mouseX: stage.mouseX  / stage.scaleX, mouseY: stage.mouseY / stage.scaleY });
		}

    }



    ////////////////////////////////////////////////////////
    function createPlayerPointer(pX,pY) {
		var myPlayerPointer = new lib.PlayerPointer();
		myPlayerPointer.x = pX;
		myPlayerPointer.y = pY;

		stage.addChild(myPlayerPointer);
        return myPlayerPointer;
	}
}
