```js
/*****************************/  
/******* myClientArray *******/
var myClientArray = [
    {ip, socketId, x, y, isRed}
]


//////////////////////////////////////  
//////// Server sended Events ////////

createSucces ( {id, playerList} );
playerJoined ( {id, playerList} );
playerLeaved ( {id, playerList} );
objectMoved  ( {id, x, y} );

toutchedRedCircle ( {id, playerList} );
endInvicibility   ( {id, playerList} );


//////////////////////////////////////  
//////// Client sended Events ////////

mouseMove( {mouseX, mouseY} );


```
