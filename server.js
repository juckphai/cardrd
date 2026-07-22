// แทนที่ Mock Data ด้วยการอ่านจากบัตรจริง
app.get('/api/read-card', async (req, res) => {
  try {
    // เรียกใช้ฟังก์ชันอ่านบัตร
    const cardData = await readRealCard(); // ฟังก์ชันที่อ่านจากบัตรจริง
    
    res.json({
      success: true,
      data: cardData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});