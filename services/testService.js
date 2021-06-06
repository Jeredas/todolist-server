const router = require('../router');
const base = require('../dbService');

const serviceName = 'testService';

class TestService{
  start(){
    this.addEndpoint('test', (params) => {
      return {
        testParams: params,
        testNumber: Math.random(),
        testString: 'gfdsgfdgfsd',
        testNull: null,
        testObject: {obf:123, obd:'ffdsg'},
        testUndefined: undefined
      }
    });
  }

  addEndpoint(name, func){
    router.addRoute(serviceName+'/'+name, func);
  }
}

module.exports = new TestService();