// cardReader.js - อ่านบัตรด้วย Node.js + pcsclite
const pcsclite = require('pcsclite');

function readRealCard() {
  return new Promise((resolve, reject) => {
    console.log('🔍 กำลังค้นหาเครื่องอ่านบัตร...');
    
    const pcsc = pcsclite();
    let isDone = false;
    let readerFound = false;

    // Timeout 10 วินาที
    const timeout = setTimeout(() => {
      if (!isDone) {
        isDone = true;
        pcsc.close();
        reject(new Error('⏰ ไม่พบเครื่องอ่านบัตร กรุณาตรวจสอบการเชื่อมต่อ'));
      }
    }, 10000);

    // เมื่อพบเครื่องอ่านบัตร
    pcsc.on('reader', (reader) => {
      if (isDone) return;
      
      readerFound = true;
      console.log(`✅ พบเครื่องอ่าน: ${reader.name}`);

      reader.on('error', (err) => {
        if (!isDone) {
          isDone = true;
          clearTimeout(timeout);
          pcsc.close();
          reject(new Error(`เครื่องอ่านบัตร error: ${err.message}`));
        }
      });

      // ตรวจสอบสถานะบัตร
      reader.on('status', (status) => {
        if (isDone) return;
        
        // status.state === 0x0004 = มีบัตรอยู่ในเครื่องอ่าน
        if (status.state === 0x0004) {
          console.log('📇 ตรวจพบบัตร กำลังอ่านข้อมูล...');
          
          // เชื่อมต่อกับบัตร
          reader.connect({ share_mode: 1 }, (err, protocol) => {
            if (err) {
              isDone = true;
              clearTimeout(timeout);
              pcsc.close();
              reject(new Error(`เชื่อมต่อบัตรไม่ได้: ${err.message}`));
              return;
            }

            // APDU สำหรับอ่านข้อมูลบัตรประชาชนไทย
            // 0x00, 0xB0 = READ BINARY
            // 0x00, 0x01 = offset
            // 0x5A = อ่าน 90 ไบต์ (ข้อมูลส่วนตัว)
            const APDU_READ = Buffer.from([
              0x00, 0xB0, 0x00, 0x01, 0x5A
            ]);

            // ส่งคำสั่งอ่านข้อมูล
            reader.transmit(APDU_READ, 256, protocol, (err, data) => {
              // ตัดการเชื่อมต่อ
              reader.disconnect(() => {});
              pcsc.close();
              
              if (err) {
                isDone = true;
                clearTimeout(timeout);
                reject(new Error(`อ่านข้อมูลไม่สำเร็จ: ${err.message}`));
                return;
              }

              try {
                // แปลงข้อมูลที่ได้เป็นข้อความ
                const rawData = data.toString('ascii').trim();
                console.log('📄 ข้อมูลดิบ:', rawData);
                console.log(`📊 ความยาวข้อมูล: ${rawData.length} ตัวอักษร`);

                // ตรวจสอบว่ามีข้อมูลหรือไม่
                if (rawData.length < 140) {
                  throw new Error(`ข้อมูลไม่สมบูรณ์ (ได้ ${rawData.length} ตัวอักษร)`);
                }

                // แยกข้อมูลตามตำแหน่ง (โครงสร้างบัตรประชาชนไทย)
                // อ้างอิง: มาตรฐานข้อมูลบัตรประชาชนไทย
                const cardInfo = {
                  // เลขบัตร 13 หลัก (ตำแหน่ง 0-12)
                  idCardNumber: rawData.substring(0, 13).trim() || 'ไม่พบข้อมูล',
                  
                  // คำนำหน้า (ตำแหน่ง 13-16) - ไม่ใช้
                  // title: rawData.substring(13, 16).trim(),
                  
                  // ชื่อ (ตำแหน่ง 56-89) - 34 ตัวอักษร
                  firstName: rawData.substring(56, 90).trim() || 'ไม่พบข้อมูล',
                  
                  // นามสกุล (ตำแหน่ง 90-129) - 40 ตัวอักษร
                  lastName: rawData.substring(90, 130).trim() || 'ไม่พบข้อมูล',
                  
                  // วันเกิด (ตำแหน่ง 130-139) - 10 ตัวอักษร (DDMMYYYY)
                  birthDate: rawData.substring(130, 140).trim() || 'ไม่พบข้อมูล',
                  
                  // เพศ (ตำแหน่ง 140) - 1 = ชาย, 2 = หญิง
                  gender: rawData.substring(140, 141).trim() === '1' ? 'ชาย' : 'หญิง',
                  
                  // วันหมดอายุ (ตำแหน่ง 141-150) - 10 ตัวอักษร (DDMMYYYY)
                  expiryDate: rawData.substring(141, 151).trim() || 'ไม่พบข้อมูล',
                  
                  // ข้อมูลดิบ (เก็บไว้เผื่อ debug)
                  rawData: rawData
                };

                isDone = true;
                clearTimeout(timeout);
                console.log('✅ อ่านข้อมูลสำเร็จ');
                console.log('📋 ข้อมูล:', cardInfo);
                
                resolve(cardInfo);

              } catch (parseError) {
                isDone = true;
                clearTimeout(timeout);
                reject(new Error(`แยกข้อมูลไม่สำเร็จ: ${parseError.message}`));
              }
            });
          });
        } else {
          // ไม่มีบัตร
          console.log('⏳ ยังไม่มีบัตรในเครื่องอ่าน กรุณาเสียบบัตร...');
        }
      });
    });

    // Error จาก PC/SC
    pcsc.on('error', (err) => {
      if (!isDone) {
        isDone = true;
        clearTimeout(timeout);
        pcsc.close();
        
        // จัดการ error แบบต่างๆ
        let errorMessage = err.message;
        if (err.message.includes('SCARD_E_NO_READERS_AVAILABLE')) {
          errorMessage = 'ไม่พบเครื่องอ่านบัตร กรุณาเสียบเครื่องอ่าน ACR39U';
        } else if (err.message.includes('SCARD_E_SERVICE_STOPPED')) {
          errorMessage = 'PC/SC Service ไม่ทำงาน กรุณารีสตาร์ทคอมพิวเตอร์';
        }
        
        reject(new Error(`PC/SC Error: ${errorMessage}`));
      }
    });

    // ถ้าไม่พบเครื่องอ่านเลย
    setTimeout(() => {
      if (!readerFound && !isDone) {
        isDone = true;
        clearTimeout(timeout);
        pcsc.close();
        reject(new Error('❌ ไม่พบเครื่องอ่านบัตร ACR39U กรุณาตรวจสอบการเชื่อมต่อ'));
      }
    }, 3000);
  });
}

module.exports = { readRealCard };