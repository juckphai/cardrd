let ws = null;
let isConnected = false;
let isReading = false;

// เชื่อมต่อ WebSocket
function connectWebSocket() {
  const statusEl = document.getElementById('connectionStatus');
  
  ws = new WebSocket('ws://localhost:3001');
  
  ws.onopen = () => {
    console.log('✅ เชื่อมต่อ WebSocket สำเร็จ');
    isConnected = true;
    statusEl.textContent = '✅ เชื่อมต่อแล้ว';
    statusEl.style.color = 'green';
    document.getElementById('readBtn').disabled = false;
  };
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('📨 รับข้อมูล:', data);
      
      if (data.type === 'card_data') {
        // รับข้อมูลบัตร
        displayCardData(data.data);
        isReading = false;
        document.getElementById('loading').style.display = 'none';
        document.getElementById('readBtn').disabled = false;
      } else if (data.status === 'connected') {
        console.log('✅ เครื่องอ่านบัตรพร้อมใช้งาน');
      }
    } catch (error) {
      console.error('❌ ข้อผิดพลาด:', error);
    }
  };
  
  ws.onerror = (error) => {
    console.error('❌ WebSocket Error:', error);
    statusEl.textContent = '❌ เกิดข้อผิดพลาด';
    statusEl.style.color = 'red';
  };
  
  ws.onclose = () => {
    console.log('🔌 WebSocket ปิดการเชื่อมต่อ');
    isConnected = false;
    statusEl.textContent = '❌ ไม่มีการเชื่อมต่อ';
    statusEl.style.color = 'red';
    document.getElementById('readBtn').disabled = true;
    
    // ลองเชื่อมต่อใหม่หลังจาก 5 วินาที
    setTimeout(connectWebSocket, 5000);
  };
}

// อ่านบัตร
async function readCard() {
  if (!isConnected || isReading) {
    return;
  }
  
  isReading = true;
  document.getElementById('readBtn').disabled = true;
  document.getElementById('loading').style.display = 'block';
  document.getElementById('result').style.display = 'none';
  
  try {
    // สั่งให้ REST API อ่านบัตร (จะส่งผ่าน WebSocket)
    const response = await fetch('http://localhost:3001/api/read-card');
    const data = await response.json();
    
    if (!data.success) {
      alert('เกิดข้อผิดพลาด: ' + data.error);
      isReading = false;
      document.getElementById('loading').style.display = 'none';
      document.getElementById('readBtn').disabled = false;
    }
    // รอข้อมูลจาก WebSocket
  } catch (error) {
    alert('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์: ' + error.message);
    isReading = false;
    document.getElementById('loading').style.display = 'none';
    document.getElementById('readBtn').disabled = false;
  }
}

// แสดงข้อมูลบัตร
function displayCardData(data) {
  document.getElementById('idCardNumber').textContent = data.idCardNumber || '-';
  document.getElementById('firstName').textContent = data.firstName || '-';
  document.getElementById('lastName').textContent = data.lastName || '-';
  document.getElementById('birthDate').textContent = data.birthDate || '-';
  document.getElementById('gender').textContent = data.gender || '-';
  document.getElementById('expiryDate').textContent = data.expiryDate || '-';
  
  document.getElementById('result').style.display = 'block';
}

// เริ่มต้นเมื่อโหลดหน้า
document.addEventListener('DOMContentLoaded', () => {
  connectWebSocket();
});