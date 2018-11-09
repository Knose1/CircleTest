function calque1Play(lib) {

    const COLOR_LIB = {
        blue: new createjs.ColorFilter(1,1,1,1, 120, 158, 191, 0),
        red: new createjs.ColorFilter(1,1,1,1, 255,0, 0, 0),
    }

    document.body.style.backgroundColor = "#000000"

    var socket = io.connect(document.URL.split(/\//g).slice(0,3).join("/"));

	socket.on('createSucces', doStartPlaying);

	/*
		We can't play before recieving an id
		This function handle this async condition

    */


	function doStartPlaying(pData) {

        var myMove = {x: 0, y: 0};

        var redObjectId = -1;
        var objectId = pData.id;

		var playerList = pData.playerList;
        var playerPointerList = [];

        playerList.forEach(
            function(pData, pIndex) {
                if (!pData)
                    return

                if (pData.isRed)
                    redObjectId = pIndex;

                var myPlayerPointer = playerPointerList[pIndex] = createPlayerPointer(pData.x, pData.y);
                myPlayerPointer.filters = ( pData.isRed ? [COLOR_LIB.red] : null);
                myPlayerPointer.cache(-100,-100,200,200);
            }
        )

        socket.on('playerLeaved', doPlayerLeaved);
		socket.on('playerJoined', doPlayerJoined);
		socket.on('objectMoved', doObjectMoved);

		socket.on('toutchedRedCircle', updateBlueCircle);
		socket.on('endInvicibility', updateRedCircle);
		canvas.addEventListener("mousemove", doMouseMove);

        //console.log(stage);

		/*	Get Events Functions	*/
        function updateBlueCircle(pData) {
            console.log('toutchedRedCircle')
            upMyCircle(COLOR_LIB.blue, pData);
        }

        function updateRedCircle(pData) {
            console.log('endInvicibility')
            upMyCircle(COLOR_LIB.red, pData);
        }

        function upMyCircle(pColor, pData) {
            //Remove old red cache
            playerPointerList[redObjectId].uncache();

            //Set new red cache
            var myPlayerPointer = playerPointerList[pData.id];
            myPlayerPointer.filters = [pColor];
            myPlayerPointer.uncache();
            myPlayerPointer.cache(-100,-100,200,200);

            redObjectId = pData.id;
        }

        function doPlayerLeaved(pData) {
            playerList = pData.playerList;
            var myPlayerPointer = playerPointerList[pData.id];
            myPlayerPointer.uncache();
            stage.removeChild(myPlayerPointer);

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
            //console.log(lMyClientPlayer);
            var lCoordinates = {
                x: stage.mouseX / stage.scaleX,
                y: stage.mouseY / stage.scaleY
            }

            myMove = movePlayer(lMyClientPlayer, lCoordinates);

            if (myMove === undefined)
                return;

            lMyClientPlayer.x += myMove.x;
            lMyClientPlayer.y += myMove.y;

            //console.log(myMove);

			socket.emit('mouseMove', { mouseX: lCoordinates.x, mouseY: lCoordinates.y });
		}

        setInterval(gameLoop, 1); //0.008s

        function gameLoop() {
            var lMyClientPlayer = playerPointerList[objectId];
            var lCoordinates = {
                x: stage.mouseX / stage.scaleX,
                y: stage.mouseY / stage.scaleY
            }

            if (myMove === undefined)
                return;

            if ( Math.abs(myMove.x) < 0.01 && Math.abs(myMove.y) < 0.01)
                return;

            myMove = movePlayer(lMyClientPlayer, lCoordinates);

            lMyClientPlayer.x += myMove.x;
            lMyClientPlayer.y += myMove.y;
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

    ////////////////////////////////////////////////////////
    let pow = Math.pow;

    function movePlayer(pPoint1, pMouseData) {
        var lMyVector = {
            x: pMouseData.x - pPoint1.x,
            y: pMouseData.y - pPoint1.y
         };
        var lDistance = Math.sqrt( pow(lMyVector.y, 2) + pow(lMyVector.x, 2) );

        if (lDistance == 0)
            return;

        var lRotation = Math.atan2(lMyVector.y / lDistance, lMyVector.x / lDistance);
        // ↑ In radius
        //console.log(lMyVector, lDistance, lRotation);

        return {x: Math.cos(lRotation) * lDistance / 50, y: Math.sin(lRotation) * lDistance / 50};
    }
}
