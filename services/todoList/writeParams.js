const {decodeBase64} = require('../../utils/base64');

/**
 * @typedef IWriteParamsDto
 * @property {string} record
 */

class WriteParams{

  /**
   * 
   * @param {IWriteParamsDto} params 
   */
  constructor(params){

    /**
     * @type {import('./ITodoListRecord').ITodoListRecord}
     * @description Record of todo list item.
     */
    this.record = JSON.parse(decodeBase64(params.record));
  }
}

module.exports = {
  WriteParams
}