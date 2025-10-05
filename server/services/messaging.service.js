const https = require('https');

class MessagingService {
  constructor() {
    this.apiUrl = process.env.TIMS_API || 'https://ms.tims.gov.az/v1/bot/sendBotMessage';
  }

  async sendBotMessage({ users, corporationIds = [], message, notification = true }, { uuid, accessToken }) {
    const payload = JSON.stringify({
      users,
      corporation: { id: corporationIds },
      message,
      notification
    });

    const url = new URL(this.apiUrl);
    const options = {
      method: 'POST',
      hostname: url.hostname,
      path: url.pathname,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'accessToken': accessToken || process.env.accessToken,
        'uuid': uuid || process.env.UUID,
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            const json = data ? JSON.parse(data) : {};
            resolve({ statusCode: res.statusCode, data: json });
          } catch (e) {
            resolve({ statusCode: res.statusCode, data: { raw: data } });
          }
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.write(payload);
      req.end();
    });
  }
}

module.exports = new MessagingService();