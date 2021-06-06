const base64 = require('./utils/base64').encodeBase64;
const router = require('./router');
const database = require('./dbService');

const serviceName = 'authService';

class AuthService{

  getUserBySessionId(sessionId){
    console.log(sessionId);
    return database.db.collection('sessions').findOne({ session: sessionId }, {}).then((res) => {
      console.log(res);
      return res;
    });  
  }

  start(){

    this.addEndpoint('testAccess', (params, userData) => {
      return Promise.resolve({params, userData});
    });

    this.addEndpoint('session', (params) => {
      console.log(params);
      return database.db.collection('sessions').findOne({ session: params.sessionHash }, {}).then((res) => {
        console.log(res)
        if (res && params.sessionHash){
          return {status: 'ok'};
        } else {
          return {status: 'error'}
        }
        
      });
    });

    this.addEndpoint('auth', (params) => {
      console.log(params);
      return database.db.collection('users').findOne({ login: params.login, password: params.password }, {}).then((res) => {
        if (res){
          let sessionData = {login: params.login, session: params.login+(Math.random()*1000).toFixed(0)};
          console.log(sessionData);
          return database.db.collection('sessions').insertOne(sessionData ).then(() => {
            return {status: 'ok', session: sessionData.session};
          });
        } else {
          return {status: 'error'}
        }
      });
    });

    this.addEndpoint('register', (params) => {
      return database.db.collection('users').insertOne({ login: params.login, password: params.password }).then(() => {
        return {status: 'ok' };
      });
    });

  }

  addEndpoint(name, func){
    router.addRoute(serviceName+'/'+name, func);
  }
}

module.exports = new AuthService();
