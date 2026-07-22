// cardReader.js - Mock Version (ใช้ทดสอบก่อนมีเครื่องอ่านจริง)
function readRealCard() {
  return new Promise((resolve) => {
    console.log('📇 ใช้ Mock Data (จำลอง)');
    
    // จำลองการอ่านบัตร ใช้เวลา 1 วินาที
    setTimeout(() => {
      resolve({
        idCardNumber: '1103400123456',
        firstName: 'สมชาย',
        lastName: 'ใจดี',
        birthDate: '15052533',
        gender: 'ชาย',
        expiryDate: '14052573',
        rawData: '1103400123456...'
      });
    }, 1000);
  });
}

module.exports = { readRealCard };
