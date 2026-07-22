const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');

const app = express();
const WS_PORT = 3001;
const HTTP_PORT = 3000;

// CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Static files - ใช้ path.join ให้ถูกต้อง
app.use(express.static(path.join(__dirname, '../frontend')));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let cardReaderClient = null;
let webClients = new Set();

wss.on('connection', (ws, req) => {
  console.log('🟢 ใหม่เชื่อมต่อ WebSocket');
  webClients.add(ws);
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('📨 รับข้อความ:', data);
      
      if (data.type === 'reader_info') {
        cardReaderClient = ws;
        console.log('✅ เชื่อมต่อกับเครื่องอ่านบัตรแล้ว');
        
        ws.send(JSON.stringify({
          status: 'connected',
          message: 'เชื่อมต่อสำเร็จ'
        }));
      } else if (data.status === 'success' && data.data) {
        webClients.forEach(client => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'card_data',
              data: data.data
            }));
          }
        });
      }
    } catch (error) {
      console.error('❌ ข้อผิดพลาด:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('🔴 ตัดการเชื่อมต่อ');
    webClients.delete(ws);
    if (cardReaderClient === ws) {
      cardReaderClient = null;
    }
  });
});

// REST API - สั่งอ่านบัตร (Mock Mode)
app.get('/api/read-card', (req, res) => {
  console.log('📖 รับคำขออ่านบัตร');
  
  // ใช้ Mock Data ทันที (ไม่ต้องรอ Python)
  const mockData = {
    idCardNumber: '1103400123456',
    firstName: 'สมชาย',
    lastName: 'ใจดี',
    birthDate: '15/05/2533',
    gender: 'ชาย',
    expiryDate: '14/05/2573',
    address: '123/45 หมู่ 10 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110'
  };
  
  // ส่งข้อมูลผ่าน WebSocket ไปยัง client
  webClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'card_data',
        data: mockData
      }));
    }
  });
  
  res.json({
    success: true,
    message: 'กำลังอ่านบัตร... (Mock Mode)'
  });
});

// REST API - ตรวจสอบสถานะ
app.get('/api/status', (req, res) => {
  res.json({
    readerConnected: cardReaderClient !== null,
    webClients: webClients.size,
    port: HTTP_PORT,
    mode: 'Mock'
  });
});

// หน้าแรก
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

server.listen(HTTP_PORT, () => {
  console.log(`🚀 HTTP Server: http://localhost:${HTTP_PORT}`);
  console.log(`🔌 WebSocket Server: ws://localhost:${WS_PORT}`);
  console.log(`📁 Serving files from: ${path.join(__dirname, '../frontend')}`);
  console.log(`📝 Mode: Mock (ใช้ข้อมูลจำลอง)`);
});