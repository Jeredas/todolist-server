class WriteResponse {

  /**
   * 
   * @param {string} status 
   * @param {string | null} error 
   */
  constructor(status, error) {
    
    /**
     * @type {string}
     */
    this.status = status;

    /**
     * @type {string | null}
     */
    this.error = error;
  }
}

module.exports = {
  WriteResponse
}