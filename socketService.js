
const WebSocketServer = require('websocket').server;
const authService = require('./authService');
const dbService = require('./dbService');
const http = require('http');
const { ObjectID } = require('mongodb');
const { CrossGame } = require('./cross');
const { ChessGame } = require('./chess/chess');
const { Vector } = require('./chess/vector');

const crossGame = new CrossGame();
const chessGame = new ChessGame();
class SocketRequest {
  constructor(rawData) {
    let obj = JSON.parse(rawData);

    /**
     * @type {string}
     */
    this.service = obj.service;

    /**
     * @type {string}
     */
    this.endpoint = obj.endpoint;

    /**
     * @type {any}
     */
    this.params = obj.params;
  }
}

class SocketServer {
  constructor() {
    this.clients = [];
    this.router = new SocketRouter();

    const server = http.createServer((request, response) => {
      response.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'X-PINGOTHER, Content-Type',
      });
      console.log((new Date()) + ' Received request for ' + request.url);
      response.writeHead(404);
      response.end();
    });
    server.listen(4080, () => {
      console.log((new Date()) + ' Server is listening on port 4080');
    });

    const wsServer = new WebSocketServer({
      httpServer: server,
      autoAcceptConnections: false
    });

    wsServer.on('request', (request) => {
      if (!originIsAllowed(request.origin)) {
        // Make sure we only accept requests from an allowed origin
        request.reject();
        console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
        return;
      }

      var connection = request.accept(null, request.origin);
      this.clients.push(connection);
      console.log((new Date()) + ' Connection accepted.');
      connection.on('message', (message) => {
        if (message.type === 'utf8') {
          console.log('Received Message: ' + message.utf8Data, 'clients -> ' + this.clients.length);
          //connection.sendUTF(message.utf8Data);
          let socketRequest = new SocketRequest(message.utf8Data);
          this.router.route(socketRequest.service, socketRequest.endpoint, connection, socketRequest.params);
          //this.clients.forEach(it => it.sendUTF(message.utf8Data))
        }
        else if (message.type === 'binary') {
          console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
          connection.sendBytes(message.binaryData);
        }
      });
      connection.on('close', (reasonCode, description) => {
        this.clients = this.clients.filter(it => it != connection);
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
        this.router.closeConnection(connection);
      });
    });
  }
}

class SocketRouter {

  constructor() {
    this.services = { chat: new ChatService() };
  }

  route(serviceName, endpointName, connection, params) {
    this.services[serviceName][endpointName](connection, params);
  }

  closeConnection(connection) {
    Object.keys(this.services).forEach(it => {
      this.services[it].closeConnection(connection);
    })
  }
}

class ChatService {
  constructor() {
    this.serviceName = 'chat';
    this.clients = [];
    this.channels = [
      new ChatChannel('qq'),
      new ChatChannel('ww')
    ];
    this.players = [];
  }

  userList(connection, params) {
    connection.sendUTF(JSON.stringify({ type: 'userList', userList: this.clients.map(it => it.userData.login) }));
  }

  channelList(connection, params) {
    connection.sendUTF(JSON.stringify(new ChannelListResponse(this.channels)));
  }

  playerList(connection, params) {
    connection.sendUTF(JSON.stringify({ type: 'playerList', playerList: this.clients.map(it => it.userData.login) }));
  }

  joinUser(connection, params) {
    authService.getUserBySessionId(params.sessionId).then(sessionData => {
      if(sessionData == null) {
        throw new Error()
      } 
      connection.sendUTF(JSON.stringify({ type: 'channelList', channelList: this.channels.map(it => ({ name: it.name })) }));
      return dbService.db.collection('users').findOne({ login: sessionData.login });
    }).then(userData => {
      if (this.clients.find((client) => {
        return client.userData.login == userData.login
      }
      )) {
        throw new Error();
      }
      if (userData) {
        console.log(userData)
        this.clients.push({ connection, userData });
        this.clients.forEach(it => {
          it.connection.sendUTF(JSON.stringify({ type: 'userList', userList: this.clients.map(it => it.userData.login) }));
        });
      }
    }).catch((error)=>{
      connection.sendUTF(JSON.stringify({type:'error', description : error}))
    });
  }

  joinPlayer(connection, params) {
    const currentClient = this.clients.find(it => it.connection == connection);
    if (currentClient) {
      let currentUser = currentClient.userData;
      if (currentUser) {
        crossGame.setPlayers(currentUser.login);
        chessGame.setPlayers(currentUser.login);
        this.clients.forEach(it => it.connection.sendUTF(JSON.stringify({ type: 'player', senderNick: currentUser.login, time: Date.now() })));
      }
    }
  }

  leaveUser(connection, params) {
    authService.getUserBySessionId(params.sessionId).then(sessionData => {
      if(sessionData == null) {
        throw new Error()
      } 
      return dbService.db.collection('users').findOne({ login: sessionData.login });
    }).then(userData => {
      if (userData) {
        console.log(userData,'userdata')
        this.clients = this.clients.filter((client => client.userData.login !== userData.login));
        const response = JSON.stringify({ type: 'userList', userList: this.clients.map(it => it.userData.login) })
        console.log(response,'response')
        this.clients.forEach(it => {
          it.connection.sendUTF(response);
        });

      }
    }).catch((error)=>{
      connection.sendUTF(JSON.stringify({type:'error', description : error}))
    });
    // this.clients = this.clients.filter(it => it.connection != connection);
    // this.clients.forEach(it => {
    //   it.connection.sendUTF(JSON.stringify({ type: 'userList', userList: this.clients.map(it => it.userData.login) }));
    // });
  };

  sendMessage(connection, params) {
    const currentClient = this.clients.find(it => it.connection == connection);
    if (currentClient) {
      let currentUser = currentClient.userData;
      if (currentUser) {
        this.clients.forEach(it => it.connection.sendUTF(JSON.stringify({ type: 'message', senderNick: currentUser.login, messageText: params.messageText })));
      }
    }
  }
  renameUser(connection, params) {
    const currentClient = this.clients.find(it => it.connection == connection);
    if (currentClient) {
      let currentUser = currentClient.userData;
      if (currentUser) {
        dbService.db.collection('users').updateOne({login:currentUser.login},{$set : {login:params.messageText}})
        this.clients.forEach(it => it.connection.sendUTF(JSON.stringify({ type: 'renameUser', senderNick: currentUser.login, messageText: params.messageText })));
        
      }
    }
  }

  closeConnection(connection) {
    this.clients = this.clients.filter(it => it.connection != connection);
    this.clients.forEach(it => {
      it.connection.sendUTF(JSON.stringify({ type: 'userList', userList: this.clients.map(it => it.userData.login) }));
    });
  }

  joinChannel(connection, params) {

    authService.getUserBySessionId(params.sessionId).then(sessionData => {
      return dbService.db.collection('users').findOne({ login: sessionData.login });
    }).then(userData => {
      const channel = this.channels.find(el => params.channelName === el.name)

      const lastChannel = this.channels.find((channel) => {
        const client = channel.clients.find((client) => client.userData.login === userData.login);
        if (client) {
          return true
        }
      });
      if (lastChannel) {
        lastChannel.leaveUser(connection, params)
      }
      if (channel) {
        channel.joinUser(connection, params);
      }
    })
  }

  crossMove(connection, params) {
    const currentClient = this.clients.find(it => it.connection == connection);
    if (currentClient) {
      let currentUser = currentClient.userData;
      if (currentUser) {
        if (crossGame.getCurrentPlayer() === currentUser.login) {
          crossGame.writeSignToField(currentUser.login, JSON.parse(params.messageText));
          this.clients.forEach(it => it.connection.sendUTF(JSON.stringify({ type: 'crossMove', senderNick: currentUser.login, messageText: params.messageText, field: crossGame.getField(), winner: crossGame.getWinner(), sign: crossGame.getCurrentSign() })));
          if (crossGame.getWinner()) {
            crossGame.clearData();
          }
        }

      }
    }
  }
  chessMove(connection, params) {
    const currentClient = this.clients.find(it => it.connection == connection);
    if (currentClient) {
      let currentUser = currentClient.userData;
      if (currentUser) {
        console.log(chessGame.getCurrentPlayer(), currentUser.login);
        if (chessGame.getCurrentPlayer() === currentUser.login) {
          const coords = JSON.parse(params.messageText);
          console.log('coords', coords);
          chessGame.model.move(coords[0].y, coords[0].x, coords[1].y, coords[1].x)
          console.log('move', chessGame.model.toFEN());
          // console.log('state', chessGame.model.state);
          chessGame.changePlayer(currentUser.login, params.messageText);
          this.clients.forEach(it => it.connection.sendUTF(JSON.stringify({ type: 'chess-events', method: "chessMove", senderNick: currentUser.login, messageText: params.messageText, field: chessGame.model.toFEN(), winner: '', sign: '' })));
        }
      }
    }
  }
  chessFigureGrab(connection, params) {
    const currentClient = this.clients.find(it => it.connection == connection);
    if (currentClient) {
      let currentUser = currentClient.userData;
      if (currentUser) {
        if (chessGame.getCurrentPlayer() === currentUser.login) {
          const coord = JSON.parse(params.messageText);
          // console.log('coord', coord);
          const arr = chessGame.model.getAllowed(chessGame.model.state, coord.y, coord.x).map(it => new Vector(it.y, it.x));
          // console.log('state', chessGame.model.state);
          // console.log('allowed', arr);
          this.clients.forEach(it => it.connection.sendUTF(JSON.stringify({ type: 'chess-events', method: "chessFigureGrab", moves: arr })));
        }
      }
    }
  }

  chessStartGame(connection, params) {
    const currentClient = this.clients.find(it => it.connection == connection);
    if (currentClient) {
      let currentUser = currentClient.userData;
      if (currentUser.login === params.messageText) {
        console.log(chessGame.getField());
        this.clients.forEach(it => it.connection.sendUTF(JSON.stringify({ type: 'chess-events', method: "startGame", start: true, field: chessGame.getField() })));
      }
    }
  }

  chessStopGame(connection, params) {
    const currentClient = this.clients.find(it => it.connection == connection);
    if (currentClient) {
      let currentUser = currentClient.userData;
      if (currentUser.login) {
        chessGame.clearData();
        console.log(params.messageText);
        this.clients.forEach(it => it.connection.sendUTF(JSON.stringify({ type: 'chess-events', method: "stopGame", stop: true })));
      }
    }
  }

  chessRemoveGame(connection, params) {
    const currentClient = this.clients.find(it => it.connection == connection);
    if (currentClient) {
      let currentUser = currentClient.userData;
      if (currentUser.login) {
        chessGame.clearData();
        this.clients.forEach(it => it.connection.sendUTF(JSON.stringify({ type: 'chess-events', method: "removeGame", remove: true, field: chessGame.getField() })));
      }
    }
  }
}

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

class ChannelListResponse {
  /**
   * 
   * @param {Array<ChatChannel>*} channels 
   */
  constructor(channels) {
    this.type = 'channelList';
    this.channelList - channels.map(channel => ({ name: channel.name }))
  }
}

class ChatChannel {
  /**
   * 
   * @param {string} name 
   */
  constructor(name) {
    this.name = name;
    this.clients = [];
  }
  joinUser(connection, params) {
    authService.getUserBySessionId(params.sessionId).then(sessionData => {
      return dbService.db.collection('users').findOne({ login: sessionData.login });
    }).then(userData => {
      if (userData) {
        console.log(userData)
        this.clients.push({ connection, userData });
        this.clients.forEach(it => {
          it.connection.sendUTF(JSON.stringify({ type: 'userList', userList: this.clients.map(it => it.userData.login) }));
        });
      }
    });
  }
  leaveUser(connection, params) {
    this.clients = this.clients.filter(it => it.connection != connection);
    this.clients.forEach(it => {
      it.connection.sendUTF(JSON.stringify({ type: 'userList', userList: this.clients.map(it => it.userData.login) }));
    });
  };

  sendMessage(connection, params) {
    const currentClient = this.clients.find(it => it.connection == connection);
    if (currentClient) {
      let currentUser = currentClient.userData;
      if (currentUser) {
        this.clients.forEach(it => it.connection.sendUTF(JSON.stringify({ type: 'message', senderNick: currentUser.login, messageText: params.messageText })));
      }
    }
  }
}




module.exports = {
  SocketServer
}


