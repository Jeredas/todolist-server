/*
let hmac = crypto.createHmac('sha256', '');
let bf1 = str2ab('12345678');
console.log(bf1);
let hs = hmac.update(bf1).digest('hex');
console.log(hs);

const {
  publicKey,
  privateKey,
} = crypto.generateKeyPairSync('rsa', {
  modulusLength: 4096,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem',
    cipher: 'aes-256-cbc',
    passphrase: ''
  }
});

console.log(publicKey);

function str2ab(str) {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return bufView;
}

function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}


let crp = crypto.publicEncrypt(publicKey, str2ab('message'));
console.log(encodeBase64(ab2str(crp)))
let bf = new Uint8Array(crp);
let dcr = crypto.privateDecrypt(privateKey, bf);
console.log(ab2str(dcr));*/

/*
    this.addEndpoint('getPublicKey', (params) => {
      console.log(params);
      return Promise.resolve(publicKey/*.split('\n').join('')*///);
 /*   });

    this.addEndpoint('sendCrypted', (params) => {
      console.log(params);
      let st = str2ab(decodeBase64(params.msg));
      let dcr = crypto.privateDecrypt(privateKey, st);
      console.log('dec ',ab2str(dcr));
      return Promise.resolve('ok');
    });

*/