async function readCard() {
  const btn = document.getElementById('readBtn');
  const loading = document.getElementById('loading');
  const result = document.getElementById('result');
  
  // แสดงสถานะกำลังอ่าน
  btn.disabled = true;
  btn.textContent = '⏳ กำลังอ่าน...';
  loading.style.display = 'block';
  result.style.display = 'none';
  
  try {
    // เรียก API อ่านบัตร
    const response = await fetch('http://localhost:3000/api/read-card');
    const data = await response.json();
    
    if (data.success) {
      // เติมข้อมูลลงในฟอร์ม
      document.getElementById('idCardNumber').value = data.data.idCardNumber || '';
      document.getElementById('firstName').value = data.data.firstName || '';
      document.getElementById('lastName').value = data.data.lastName || '';
      document.getElementById('birthDate').value = data.data.birthDate || '';
      document.getElementById('gender').value = data.data.gender || '';
      document.getElementById('expiryDate').value = data.data.expiryDate || '';
      document.getElementById('address').value = data.data.address || '';
      
      // แสดงฟอร์ม
      result.style.display = 'block';
      console.log('✅ อ่านข้อมูลสำเร็จ');
    } else {
      alert('❌ อ่านบัตรไม่สำเร็จ: ' + (data.error || 'ไม่ทราบสาเหตุ'));
    }
  } catch (error) {
    console.error('❌ Error:', error);
    alert('❌ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์\n' + error.message);
  } finally {
    // คืนสถานะปุ่ม
    btn.disabled = false;
    btn.textContent = '📖 อ่านบัตร';
    loading.style.display = 'none';
  }
}