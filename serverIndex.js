var util = require('util');
var app = require('http').createServer(handler);
var io = require('socket.io')(app);
var fs = require('fs');

//app.listen(80);

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

var myClientArray = [];

io.on('connection', function (socket) {
    //console.log("connection");
    var clientIp = socket.request.connection.remoteAddress;
    var clientId = myClientArray.length;

    let undefinedIndex = myClientArray.indexOf(undefined)
    if ( undefinedIndex != -1)
        clientId = undefinedIndex;

    if (myClientArray.filter(filterClientId).length == 0) {

        //Add the new client in the list
        myClientArray[clientId] = { ip: clientIp, socketId: socket.id, x: 0, y: 0};


        //Send callback
        socket.emit('createSucces', {
            id: clientId,
            playerList: myClientArray.map(mapPlayerList)
        });
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
        myClientArray[clientId].x = pData.mouseX;
        myClientArray[clientId].y = pData.mouseY;

        io.emit('objectMoved', {id:clientId, x: pData.mouseX, y: pData.mouseY});
        //clientInspect();
    });

    //Disconnect
    socket.on('disconnect', function () {
        //console.log("disconnect");

        io.emit("playerLeaved", {
            id: clientId,
            playerList: myClientArray.map(mapPlayerList)
        });

        let lMyIndex = myClientArray.indexOf(
            myClientArray.filter(filterDisconnectedSocket )[0]
        )
        if (lMyIndex != -1)
            myClientArray[lMyIndex] = undefined;


        clientInspect();



    });

    ////////////////////////////////
    function filterClientId(pData) {
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
});

/**/
function clientInspect() {
    console.log(util.inspect(myClientArray, { depth: null }));
}

///////////////////////////////////////////////////////////////////////////////
function mapPlayerList(pData) {
    return pData ?
        {x: pData.x, y: pData.y}:
        undefined;
}
///////////////////////////////////////////////////////////////////////////////
function htmlRenderFile(lRes, lUrl, lErrorMessage = "Error loading the page") {
    fs.readFile(lUrl,
    function (err, data) {
        if (err) {
            console.log( new Error(`can't render ${lUrl}`) );
            lRes.writeHead(404);
            return lRes.end(lErrorMessage);
        }

        lRes.writeHead(200);
        lRes.end(data);
    });
}
