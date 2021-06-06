/**
 * 
 * @param {string} base64String 
 */
const decodeBase64 = (base64String)=>{
  return Buffer.from(base64String, 'base64').toString('ascii');
}

const encodeBase64 = (base64String)=>{
  return Buffer.from(base64String, 'ascii').toString('base64');
}

module.exports = {
  decodeBase64,
  encodeBase64
}