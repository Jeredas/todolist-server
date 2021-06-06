const { ObjectID} = require('mongodb');
const {decodeBase64} = require('../../utils/base64');

/**
 * @typedef IUpdateParamsDto
 * @property {string} record 
 * @property {string} id 
 */

class UpdateParams{

  /**
   * 
   * @param {IUpdateParamsDto} params 
   * @throws {Error} If params invalid.
   */
  constructor(params){
    if (typeof params.id !== 'string'){
      throw new Error ('Update endpoint params invalid');
    }

    /**
     * @type {import('./ITodoListRecord').ITodoListRecord}
     */
    this.record = JSON.parse(decodeBase64(params.record));

    /**
     * @type {ObjectID}
     * @description Database id.
     */
    this.id = new ObjectID(params.id);
  }
}

module.exports = {
  UpdateParams
}