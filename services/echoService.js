const router = require('../router');
const base = require('../dbService');

const serviceName = 'echoService';

class EchoService{
  start(){
    this.addEndpoint('write', (params) => {
      return base.db.collection('cl1').insertOne({ fd: 4 }, {}).then(() => {
        return 'written';
      });
    });

    this.addEndpoint('read', (params) => {
      return base.db.collection('cl1').find({}).toArray().then((arr) => {
        return arr;
      });
    });

    this.addEndpoint('parm', (params) => {
      return new Promise((resolve, reject) => {
        resolve(params);
      });
    });
  }

  addEndpoint(name, func){
    router.addRoute(serviceName+'/'+name, func);
  }
}

module.exports = new EchoService();
