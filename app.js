async function readCard() {
  const btn = document.getElementById('readBtn');
  const loading = document.getElementById('loading');
  const result = document.getElementById('result');

  btn.disabled = true;
  loading.style.display = 'block';
  result.style.display = 'none';

  try {
    const response = await fetch('http://localhost:3000/api/read-card');
    const data = await response.json();

    if (data.success) {
      document.getElementById('idCardNumber').textContent = data.data.idCardNumber || '-';
      document.getElementById('firstName').textContent = data.data.firstName || '-';
      document.getElementById('lastName').textContent = data.data.lastName || '-';
      document.getElementById('birthDate').textContent = data.data.birthDate || '-';
      result.style.display = 'block';
    } else {
      alert('เกิดข้อผิดพลาด: ' + data.error);
    }
  } catch (error) {
    alert('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์: ' + error.message);
  } finally {
    btn.disabled = false;
    loading.style.display = 'none';
  }
}