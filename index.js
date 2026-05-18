const express = require('express');
const rateLimiter = require('./rateLimiter');

const app = express();
const PORT = process.env.PORT || 3000;


app.use(express.json());

const handler = (req, res) => {
  res.status(200).json({ ok: true });
};

app.post('/ai/generate', rateLimiter('ai'), handler);
app.post('/ai/summarise', rateLimiter('ai'), handler);

app.get('/data/list', rateLimiter('read'), handler);
app.get('/data/export', rateLimiter('read'), handler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
