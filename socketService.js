
const WebSocketServer = require('websocket').server;
const authService = require('./authService');
const dbService = require('./dbService');
const http = require('http');
const { ObjectID } = require('mongodb');

class SocketRequest {
  constructor (rawData){
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
      connection.on('message',  (message) => {
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

class SocketRouter{
  
  constructor(){
    this.services = {chat: new ChatService()};
  }

  route(serviceName, endpointName, connection, params){
    this.services[serviceName][endpointName](connection, params);
  }

  closeConnection(connection){
    Object.keys(this.services).forEach(it=>{
      this.services[it].closeConnection(connection);
    })
  }
}

class ChatService{
  constructor(){
    this.serviceName = 'chat';
    this.clients = [];
  }

  userList(connection, params){
    connection.sendUTF(JSON.stringify({type:'userList', userList:this.clients.map(it=>it.userData.login)}));
  }

  joinUser(connection, params){
    authService.getUserBySessionId(params.sessionId).then(sessionData=>{
      return dbService.db.collection('users').findOne({login: sessionData.login});
    }).then(userData=>{
      if (userData){
        console.log(userData)
        this.clients.push({connection, userData});
        this.clients.forEach(it=>{
          it.connection.sendUTF(JSON.stringify({type:'userList', userList:this.clients.map(it=>it.userData.login)}));
        });
      }
    });
  }

  leaveUser(connection, params){
    this.clients = this.clients.filter(it => it.connection != connection);  
    this.clients.forEach(it=>{
      it.connection.sendUTF(JSON.stringify({type:'userList', userList:this.clients.map(it=>it.userData.login)}));
    });
  };

  sendMessage(connection, params){
    const currentClient = this.clients.find(it => it.connection == connection);  
    if (currentClient){
      let currentUser = currentClient.userData;
      if (currentUser){
        this.clients.forEach(it => it.connection.sendUTF(JSON.stringify({type:'message',senderNick:currentUser.login, messageText:params.messageText})));  
      }
    }
  }

  closeConnection(connection){
    this.clients = this.clients.filter(it => it.connection != connection); 
    this.clients.forEach(it=>{
      it.connection.sendUTF(JSON.stringify({type:'userList', userList:this.clients.map(it=>it.userData.login)}));
    });
  }
}

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

module.exports = {
  SocketServer
}
