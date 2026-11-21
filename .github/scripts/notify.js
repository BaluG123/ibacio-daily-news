const fs = require('fs');
const {GoogleAuth} = require('google-auth-library');

const creds = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
const file = process.env.EDITION_FILE;
const edition = JSON.parse(fs.readFileSync(file, 'utf8'));
const date = file.replace('.json', '');
const first = (edition.articles || [])[0] || {};
const count = (edition.articles || []).length;

async function send(topic, title, body) {
  const auth = new GoogleAuth({credentials: creds, scopes: ['https://www.googleapis.com/auth/firebase.messaging']});
  const token = await (await auth.getClient()).getAccessToken();
  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${creds.project_id}/messages:send`, {
    method: 'POST',
    headers: {Authorization: `Bearer ${token.token}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({
      message: {
        topic,
        notification: {title, body},
        data: {screen: 'news', date},
        android: {priority: 'high', notification: {channel_id: 'daily_news'}},
        apns: {payload: {aps: {sound: 'default'}}},
      },
    }),
  });
  console.log(topic, res.status, await res.text());
  if (!res.ok) process.exit(1);
}

(async () => {
  await send('daily_news', `Today's current affairs are here (${count} stories)`, first.title || 'Read today\'s briefing for IB ACIO');
  await send('daily_news_hi', `आज के करेंट अफेयर्स आ गए (${count} खबरें)`, first.title_hi || first.title || 'IB ACIO के लिए आज की खबरें पढ़ें');
})();
