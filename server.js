const express = require('express');
const cors = require('cors');
const { readRealCard } = require('./cardReader');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('frontend'));

// API อ่านบัตร
app.get('/api/read-card', async (req, res) => {
  console.log('📖 รับคำขออ่านบัตร');
  
  try {
    const cardData = await readRealCard();
    
    res.json({
      success: true,
      data: cardData
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API ตรวจสอบสถานะ
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

// เริ่มต้น Server
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('🚀 SERVER STARTED');
  console.log('='.repeat(50));
  console.log(`📡 HTTP: http://localhost:${PORT}`);
  console.log('='.repeat(50));
  console.log('📌 คำแนะนำ:');
  console.log('1. เสียบเครื่องอ่านบัตร ACR39U');
  console.log('2. เสียบบัตรประชาชน');
  console.log('3. กดปุ่มอ่านบัตรในเว็บ');
  console.log('='.repeat(50));
});