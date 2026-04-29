const axios = require('axios');
const jwt = require('jsonwebtoken');

const token = jwt.sign({ id: '1e6e32ed-5e39-4455-8ec5-5bdae5077462' }, 'codeverify_super_secret_access_123', { expiresIn: '15m' });

axios.post('http://localhost:5000/api/explain/generate', {
  code: 'print("hello")',
  language: 'python'
}, {
  headers: { Authorization: `Bearer ${token}` }
}).then(res => {
  console.log('SUCCESS:', res.data);
}).catch(err => {
  console.log('ERROR:', err.response ? err.response.data : err.message);
});
