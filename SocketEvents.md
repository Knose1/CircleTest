```js
/*****************************/  
/******* myClientArray *******/
var myClientArray = [
    {ip, socketId, x, y}
]


//////////////////////////////////////  
//////// Server sended Events ////////

createSucces ( {id, playerList} );
playerJoined ( {id, playerList} );
playerLeaved ( {id, playerList} );
objectMoved  ( {id, x, y} );


//////////////////////////////////////  
//////// Client sended Events ////////

mouseMove( {mouseX, mouseY} );


```
