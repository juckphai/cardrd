// ตัวแปรสถานะ
let isReading = false;

// ฟังก์ชันอ่านบัตร
async function readCard() {
  if (isReading) return;
  
  const btn = document.getElementById('readBtn');
  const loading = document.getElementById('loading');
  const result = document.getElementById('result');
  const statusText = document.getElementById('statusText');
  
  // เปลี่ยนสถานะ
  isReading = true;
  btn.disabled = true;
  btn.textContent = '⏳ กำลังอ่าน...';
  loading.style.display = 'block';
  result.style.display = 'none';
  statusText.textContent = '⏳ กำลังอ่านบัตร...';
  statusText.style.color = '#f59e0b';
  
  try {
    console.log('📖 เรียก API อ่านบัตร...');
    
    const response = await fetch('http://localhost:3000/api/read-card');
    const data = await response.json();
    
    console.log('📨 Response:', data);
    
    if (data.success) {
      // เติมข้อมูลลงในฟอร์ม
      document.getElementById('idCardNumber').value = data.data.idCardNumber || '';
      document.getElementById('firstName').value = data.data.firstName || '';
      document.getElementById('lastName').value = data.data.lastName || '';
      document.getElementById('birthDate').value = data.data.birthDate || '';
      document.getElementById('gender').value = data.data.gender || '';
      document.getElementById('expiryDate').value = data.data.expiryDate || '';
      
      // แสดงฟอร์ม
      result.style.display = 'block';
      statusText.textContent = '✅ อ่านข้อมูลสำเร็จ';
      statusText.style.color = '#10b981';
      
      console.log('✅ อ่านข้อมูลสำเร็จ');
    } else {
      throw new Error(data.error || 'อ่านบัตรไม่สำเร็จ');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    statusText.textContent = `❌ ${error.message}`;
    statusText.style.color = '#ef4444';
    alert(`❌ ${error.message}`);
  } finally {
    // คืนสถานะปุ่ม
    isReading = false;
    btn.disabled = false;
    btn.textContent = '📖 อ่านบัตร';
    loading.style.display = 'none';
  }
}

// ตรวจสอบสถานะ Server
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000/api/status');
    const data = await response.json();
    console.log('✅ Server online:', data);
    return true;
  } catch (error) {
    console.error('❌ Server offline:', error);
    return false;
  }
}

// เมื่อโหลดหน้าเว็บ
document.addEventListener('DOMContentLoaded', async () => {
  console.log('📄 หน้าเว็บโหลดเสร็จ');
  
  const statusText = document.getElementById('statusText');
  
  const isOnline = await checkServer();
  
  if (isOnline) {
    statusText.textContent = '✅ พร้อมใช้งาน';
    statusText.style.color = '#10b981';
    document.getElementById('readBtn').disabled = false;
  } else {
    statusText.textContent = '❌ ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์';
    statusText.style.color = '#ef4444';
    document.getElementById('readBtn').disabled = true;
  }
});