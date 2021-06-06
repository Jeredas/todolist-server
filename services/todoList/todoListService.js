const router = require('../../router');
const base = require('../../dbService');
const { ObjectID} = require('mongodb');
const {UpdateParams} = require('./updateParams');
const {WriteResponse} = require('./writeResponse');
const {WriteParams} = require('./writeParams');
const serviceName = 'todoListService';
const collectionName = 'todos';
const getCollection = ()=>{
  return base.db.collection(collectionName);
}

class TodoListService{
  start(){

    this.addEndpoint('update', (params) => {
      const parsedParams = new UpdateParams(params);
      return getCollection().updateOne({_id: parsedParams.id}, {$set: parsedParams.record}, {}).then(() => {
        return 'updated';
      });
    });

    this.addEndpoint('write', (_params) => {
      const params = new WriteParams(_params);
      try {
        if (params.record.title.length<5){
          throw new Error('title length shoud be longer 3 characters');
        }
        return getCollection().insertOne(params.record, {}).then(() => {
          return new WriteResponse('ok', null);
        });
      } catch (err){
        return new WriteResponse('ok', err.toString());
      }
    });

    this.addEndpoint('read', (params) => {
      return getCollection().find({}).toArray().then((arr) => {
        return arr;
      });
    });

    this.addEndpoint('delete', (params) => {
      console.log(params.id);
      return getCollection().deleteOne({_id: new ObjectID(params.id)}).then((res) => {
        return res;
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

module.exports = new TodoListService();