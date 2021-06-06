const crypto = require('crypto');

/**
 * @description Return message hash with salt key.
 * @param {string} message 
 * @param {string} key 
 */
function digestMessage(message, key){
  hash = crypto.createHash('sha256');
  let result = hash.update(message+key).digest('hex');
  result = result;
}

module.exports = {
  digestMessage
}
