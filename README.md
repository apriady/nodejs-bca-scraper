# nodejs-bca-scraper

Plugin untuk membantu anda mendapatkan informasi saldo terakhir rekening BCA anda serta mutasi rekening BCA anda pada hari itu melalui KlikBCA.

## Cara Install

```bash
npm install --save nodejs-bca-scraper
```

atau

```bash
yarn add nodejs-bca-scraper
```

## Penggunaan

```javascript
const bca = require('nodejs-bca-scraper');
```

### Cek Saldo Terakhir

```javascript
bca
  .getBalance(USERNAME, PASSWORD)
  .then(res => {
    console.log('saldo ', res);
  })
  .catch(err => {
    console.log('error ', err);
  });
```

### Cek Settlement Pada Hari Itu

```javascript
bca
  .getSettlement(USERNAME, PASSWORD)
  .then(res => {
    console.log('settlement ', res);
  })
  .catch(err => {
    console.log('error ', err);
  });
```

# License

MIT

# Author

[Achmad Apriady](mailto:achmad.apriady@gmail.com)
