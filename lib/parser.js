const request = require('request-promise-native');
const moment = require('moment');
const { stringBetween, tdValue, removeHtml, toNumber } = require('./helper');

const j = request.jar();
const rp = request.defaults({
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Linux; U; Android 2.3.7; en-us; Nexus One Build/GRK39F) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1'
  },
  jar: j
});

module.exports = {
  getIP: async () => {
    const ipify = await request({
      uri: 'https://api.ipify.org/?format=json',
      json: true
    });
    return ipify.ip;
  },

  login: (username, password, ip) => {
    const options = {
      method: 'POST',
      uri: 'https://m.klikbca.com/authentication.do',
      form: {
        'value(user_id)': username,
        'value(pswd)': password,
        'value(Submit)': 'LOGIN',
        'value(actions)': 'login',
        'value(user_ip)': ip,
        user_ip: ip,
        'value(mobile)': true,
        mobile: true
      },
      headers: {
        Referer: 'https://m.klikbca.com/login.jsp'
      }
    };
    return rp(options)
      .then(result => {
        const success = result.includes('MENU UTAMA');
        if (!success) {
          let err = stringBetween(result, "var err='", "';");
          err = err || '';
          throw Error(err);
        }
        return true;
      })
      .catch(err => {
        throw err.message;
      });
  },

  openSettlementMenu: () => {
    const options = {
      method: 'POST',
      uri: 'https://m.klikbca.com/accountstmt.do?value(actions)=menu',
      headers: {
        Referer: 'https://m.klikbca.com/authentication.do'
      }
    };
    return rp(options);
  },

  balance: () => {
    const options = {
      method: 'POST',
      uri: 'https://m.klikbca.com/balanceinquiry.do',
      headers: {
        Referer: 'https://m.klikbca.com/accountstmt.do?value(actions)=menu'
      }
    };
    return rp(options)
      .then(result => {
        return {
          rekening: stringBetween(result, "<td><font size='1' color='#0000a7'><b>", '</td>'),
          saldo: toNumber(
            stringBetween(result, "<td align='right'><font size='1' color='#0000a7'><b>", '</td>')
          )
        };
      })
      .catch(err => {
        throw err.message;
      });
  },

  settlement: async () => {
    const options = {
      method: 'POST',
      uri: 'https://m.klikbca.com/accountstmt.do?value(actions)=acct_stmt',
      headers: {
        Referer: 'https://m.klikbca.com/accountstmt.do?value(actions)=menu'
      }
    };
    try {
      const now = moment();
      const date = now.format('DD');
      const month = now.format('MM');
      const year = now.format('YYYY');

      await rp(options);
      options.uri = 'https://m.klikbca.com/accountstmt.do?value(actions)=acctstmtview';
      options.headers.Referer = 'https://m.klikbca.com/accountstmt.do?value(actions)=acct_stmt';
      options.form = {
        r1: 1,
        'value(D1)': 0,
        'value(startDt)': date,
        'value(startMt)': month,
        'value(startYr)': year,
        'value(endDt)': date,
        'value(endMt)': month,
        'value(endYr)': year
      };
      const result = await rp(options);
      const cleanStmt = [];
      if (!result.includes('TIDAK ADA TRANSAKSI')) {
        let stmt = stringBetween(result, 'KETERANGAN', '<!--<tr>');
        stmt = tdValue(stmt);

        for (let i = 1; i <= stmt.length; i += 2) {
          const keteranganRaw = removeHtml(stmt[i].split('<br>').join('\n'));
          let keterangan = keteranganRaw.substring(0, keteranganRaw.length - 2);
          const nominal = toNumber(keterangan.split(/\r?\n/).pop());

          keterangan = keterangan.replace(/\r?\n?[^\r\n]*$/, '');
          const cab = keterangan.split(/\r?\n/).pop();
          keterangan = keterangan.replace(/\r?\n?[^\r\n]*$/, '');

          cleanStmt.push({
            tanggal: removeHtml(stmt[i - 1].split('<br>').join('\n')),
            keterangan,
            cab,
            nominal,
            mutasi: keteranganRaw.slice(-2)
          });
        }
      }

      return cleanStmt;
    } catch (err) {
      throw err.message;
    }
  },

  logout: () => {
    const options = {
      method: 'GET',
      uri: 'https://m.klikbca.com/authentication.do?value(actions)=logout',
      headers: {
        Referer: 'https://m.klikbca.com/authentication.do?value(actions)=menu'
      }
    };
    return rp(options);
  }
};
