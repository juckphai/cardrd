const express = require('express');
const cors = require('cors');
const { readThaiIDCard } = require('./cardReader');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('frontend'));

// API endpoint สำหรับอ่านบัตร
app.get('/api/read-card', async (req, res) => {
  try {
    const cardData = await readThaiIDCard();
    res.json({ success: true, data: cardData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});