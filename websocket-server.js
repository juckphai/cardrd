const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const WS_PORT = 3001;    // WebSocket Port
const HTTP_PORT = 3000;  // HTTP Server Port

app.use(cors());
app.use(express.json());
app.use(express.static('frontend'));

// HTTP Server
const server = http.createServer(app);

// WebSocket Server
const wss = new WebSocket.Server({ server });

// เก็บ client ที่เชื่อมต่อ
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
        // เป็นเครื่องอ่านบัตร
        cardReaderClient = ws;
        console.log('✅ เชื่อมต่อกับเครื่องอ่านบัตรแล้ว');
        
        ws.send(JSON.stringify({
          status: 'connected',
          message: 'เชื่อมต่อสำเร็จ'
        }));
      } else if (data.status === 'success' && data.data) {
        // ข้อมูลจากเครื่องอ่านบัตร -> ส่งต่อให้เว็บ client
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

// REST API - สั่งอ่านบัตร
app.get('/api/read-card', (req, res) => {
  console.log('📖 รับคำขออ่านบัตร');
  
  if (!cardReaderClient) {
    return res.status(503).json({
      success: false,
      error: 'ไม่พบเครื่องอ่านบัตร'
    });
  }
  
  // สั่งให้เครื่องอ่านบัตรทำงาน
  cardReaderClient.send(JSON.stringify({
    command: 'read_card'
  }));
  
  res.json({
    success: true,
    message: 'กำลังอ่านบัตร... โปรดรอ'
  });
});

// REST API - ตรวจสอบสถานะ
app.get('/api/status', (req, res) => {
  res.json({
    readerConnected: cardReaderClient !== null,
    webClients: webClients.size,
    port: HTTP_PORT
  });
});

// หน้าแรก
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/frontend/index.html');
});

server.listen(HTTP_PORT, () => {
  console.log(`🚀 HTTP Server: http://localhost:${HTTP_PORT}`);
  console.log(`🔌 WebSocket Server: ws://localhost:${WS_PORT}`);
  console.log(`📁 Serving files from: ${__dirname}/frontend`);
});