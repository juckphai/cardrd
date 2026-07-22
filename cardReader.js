const pcsclite = require('pcsclite');
const pcsc = pcsclite();

// ฟังก์ชันอ่านข้อมูลบัตรประชาชนไทย
function readThaiIDCard() {
  return new Promise((resolve, reject) => {
    pcsc.on('reader', (reader) => {
      console.log('พบเครื่องอ่านบัตร:', reader.name);

      reader.on('error', (err) => {
        reject(new Error('เกิดข้อผิดพลาดกับเครื่องอ่านบัตร: ' + err.message));
      });

      reader.on('status', (status) => {
        if (status.state === 0x0004) { // มีบัตรอยู่
          console.log('ตรวจพบบัตร, กำลังอ่านข้อมูล...');

          // คำสั่ง APDU สำหรับอ่านข้อมูลหน้า 1 (บัตรประชาชน)
          const APDU_READ_BINARY = Buffer.from([
            0x00, 0xB0, 0x00, 0x01, 0x5A  // อ่านข้อมูล 90 ไบต์แรก
          ]);

          reader.connect({ share_mode: 1 }, (err, protocol) => {
            if (err) {
              reject(new Error('ไม่สามารถเชื่อมต่อกับบัตรได้: ' + err.message));
              return;
            }

            reader.transmit(APDU_READ_BINARY, 256, protocol, (err, data) => {
              reader.disconnect(() => {});

              if (err) {
                reject(new Error('อ่านข้อมูลบัตรไม่สำเร็จ: ' + err.message));
                return;
              }

              try {
                // แปลงข้อมูลจาก Buffer เป็นข้อความ
                const rawData = data.toString('ascii').trim();

                // แยกข้อมูลตามตำแหน่ง (บัตรประชาชนไทย)
                const cardInfo = {
                  idCardNumber: rawData.substring(0, 13).trim(),      // เลขบัตร 13 หลัก
                  firstName: rawData.substring(56, 90).trim(),        // ชื่อ
                  lastName: rawData.substring(90, 130).trim(),        // นามสกุล
                  birthDate: rawData.substring(130, 140).trim(),      // วันเกิด
                  // ... เพิ่มฟิลด์อื่น ๆ ตามต้องการ
                };

                resolve(cardInfo);
              } catch (parseError) {
                reject(new Error('ไม่สามารถแยกข้อมูลจากบัตรได้: ' + parseError.message));
              }
            });
          });
        }
      });
    });

    pcsc.on('error', (err) => {
      reject(new Error('PC/SC error: ' + err.message));
    });
  });
}

module.exports = { readThaiIDCard };