var util = require('util');
var app = require('http').createServer(handler);
var io = require('socket.io')(app);
var fs = require('fs');

const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
    console.log(`Our app is running on port ${ PORT }`);
});

const TIMEOUT_TIME = 1000;


function handler (req, res) {

    //console.log(req.headers.host)

    //Remove the "?" args in the url
    var interorationIndex = (req.url.indexOf("?") + 1 || undefined);

    if (interorationIndex)
        interorationIndex--;

    var slicedUrl = req.url.slice(0, interorationIndex);

    //Handle URL
    switch (slicedUrl) {
        case '/' :
            htmlRenderFile(res, __dirname + `/Client_Side/mcSymbole_1.html`, 'Error loading index.html');
            break;

        case '/calc1_init.js'  :
        case '/mcSymbole_1.js' :
            htmlRenderFile(res, __dirname + `/Client_Side${slicedUrl}`, `Error loading ${req.url}`);
            break;

        default :
            if (slicedUrl.indexOf('/images/') == 0)
                htmlRenderFile(res, __dirname + `/Client_Side${slicedUrl}`, `Error loading ${req.url}`);
            else {
                htmlRenderFile(res, __dirname + slicedUrl, `Error loading ${req.url}`);
            }
            //break;
    }
}



/* Socket */

let myClientArray = [];
let redPlayerId = -1;
let myRedPlayer;
let isInvicibility = false;
let timeOutId;

io.on('connection', function (socket) {

    //console.log("connection");
    var clientIp = socket.request.connection.remoteAddress;
    var clientId = myClientArray.length;

    let undefinedIndex = myClientArray.indexOf(undefined)
    if ( undefinedIndex != -1)
        clientId = undefinedIndex;

    //Check ip
    if (myClientArray.filter(filterClientIp).length == 0) {


        //Add the new client in the list
        myClientArray[clientId] = { ip: clientIp, socketId: socket.id, x: 0, y: 0, isRed: false};

        //Welcome, you are the new red player
        if(myClientArray.filter(filterDefined).length == 1) {
            redPlayerId = clientId;
            myRedPlayer = myClientArray[redPlayerId];

            myClientArray[redPlayerId].isRed = true;

            //Emit event
            io.emit('endInvicibility', {
                id: redPlayerId,
                playerList: myClientArray.map(mapPlayerList)
            });
        }

        //Send callback
        socket.emit('createSucces', {
            id: clientId,
            playerList: myClientArray.map(mapPlayerList)
        });

        //Broadcast playerJoined
        io.emit("playerJoined", {
            id: clientId,
            playerList: myClientArray.map(mapPlayerList)
        });
        clientInspect();

    } else {
        return socket.disconnect(true);
    }

    //MouseMove
    socket.on('mouseMove', function(pData) {
        var myClient = myClientArray[clientId];
        myClient.mouseX = pData.mouseX;
        myClient.mouseY = pData.mouseY;

        var myMove = movePlayer(myClient, pData);

        if (myMove === undefined)
            return;

        myClient.x += myMove.x;
        myClient.y += myMove.y;

        io.emit('objectMoved', {id:clientId, x: myClient.x, y: myClient.x});
    });

    //Disconnect
    socket.on('disconnect', function () {
        //console.log("disconnect");




        //Broadcast playerLeaved
        io.emit("playerLeaved", {
            id: clientId,
            playerList: myClientArray.map(mapPlayerList)
        });

        //Remove from clientList
        let lMyIndex = myClientArray.indexOf(
            myClientArray.filter(filterDisconnectedSocket )[0]
        );

        if (lMyIndex != -1)
            myClientArray[lMyIndex] = undefined;

        //Asign new red player
        let myFilteredArray = myClientArray.filter(filterDefined);
        if(clientId === redPlayerId) {

            if (myFilteredArray.length == 0) {
                redPlayerId = -1;
                myRedPlayer = undefined;

            } else {
                myRedPlayer = myFilteredArray[Math.floor( Math.random() * myFilteredArray.length)];
                redPlayerId = myClientArray.indexOf(myRedPlayer);
                myRedPlayer.isRed = true;

                io.emit('endInvicibility', {id: redPlayerId, playerList: myClientArray});

                //No timeout to avoid bug
            }
        }

        clientInspect();



    });

    ////////////////////////////////
    function filterClientIp(pData) {
        return pData ?
            pData.ip == clientIp :
            false;
    }

    ////////////////////////////////////////
    function filterDisconnectedSocket(pData) {
        return pData ?
            pData.socketId == socket.id :
            false;
    }

    ///////////////////////////////////////
    function executeCollision(pClient) {

        if (timeOutId === undefined) {

            redPlayerId = myClientArray.indexOf(pClient);
            myRedPlayer = pClient;
            myRedPlayer.isRed = true;
            isInvicibility = true;

            io.emit('toutchedRedCircle', {id: redPlayerId, playerList: myClientArray});


            timeOutId = setTimeout(function () {
                console.log("hello");
                io.emit('endInvicibility', {id: redPlayerId, playerList: myClientArray});

                clearTimeout(timeOutId);
                timeOutId = undefined;
                isInvicibility = false;
            }, TIMEOUT_TIME);
        }
    }
});


setInterval(gameLoop, 1); //0.008s

var myMove = {x:0, y:0};
const pow = Math.pow;
function gameLoop() {
    var lobjectId = myClientArray.length;

    let lMyClientPlayer;
    while (lobjectId-- > 0) {
        lMyClientPlayer = myClientArray[lobjectId];

        if (lMyClientPlayer === undefined || lMyClientPlayer.mouseX === undefined || lMyClientPlayer.mouseY === undefined)
            continue;

        //The redPlayer is hit by an enemy
        if (!isInvicibility) {
            if (lMyClientPlayer === myRedPlayer || lMyClientPlayer === undefined)
                continue;

            if(checkDistance(lMyClientPlayer, myRedPlayer, 50)) {
                executeCollision(lMyClientPlayer);
                break;
            }
        }

        myMove = movePlayer(lMyClientPlayer, lMyClientPlayer);

        //if (myMove.x.toString() == "NaN" || myMove.y.toString() == "NaN")
            console.log(util.inspect(myMove, { depth: null }));
        //console.log(util.inspect(lMyClientPlayer, { depth: null }));

        if (myMove === undefined || ( Math.abs(myMove.x) < 0.01 && Math.abs(myMove.y) < 0.01))
            continue;

        lMyClientPlayer.x += myMove.x;
        lMyClientPlayer.y += myMove.y;



        io.emit('objectMoved', {id:lobjectId, x: lMyClientPlayer.x, y: lMyClientPlayer.x});
    }
}
///////////////////////////////////////////////////////////////////////////////
function movePlayer(pPoint1, pMouseData) {
    var lMyVector = {
        x: pMouseData.mouseX - pPoint1.x,
        y: pMouseData.mouseY - pPoint1.y
     };
    var lDistance = Math.sqrt( pow(lMyVector.y, 2) + pow(lMyVector.x, 2) );

    if (lDistance == 0)
        return;

    var lRotation = Math.atan2(lMyVector.y / lDistance, lMyVector.x / lDistance);
    // ↑ In radius
    //console.log(lMyVector, lDistance, lRotation);

    return {x: Math.cos(lRotation) * lDistance / 50, y: Math.sin(lRotation) * lDistance / 50};
}
///////////////////////////////////////////////////////////////////////////////
function clientInspect() {
    console.log(util.inspect(myClientArray, { depth: null }));
}
///////////////////////////////////////////////////////////////////////////////
function filterDefined(pData) {
    return pData !== undefined;
}
///////////////////////////////////////////////////////////////////////////////
function mapPlayerList(pData) {
    return pData ?
        {
            x: pData.x,
            y: pData.y,
            isRed: pData.isRed
        }:
        undefined;
}
///////////////////////////////////////////////////////////////////////////////
function htmlRenderFile(pRes, pUrl, pErrorMessage = "Error loading the page") {
    fs.readFile(pUrl,
    function (err, data) {
        if (err) {
            console.log( new Error(`can't render ${pUrl}`) );
            pRes.writeHead(404);
            return pRes.end(pErrorMessage);
        }

        pRes.writeHead(200);
        pRes.end(data);
    });
}
///////////////////////////////////////////////////////////////////////////////
function checkDistance(pPoint1, pPoint2, pMinDistance) {

    var lDistance = Math.sqrt( pow(pPoint2.x - pPoint1.x, 2) + pow(pPoint2.y - pPoint1.y, 2) );

    return pMinDistance >= lDistance;
}
