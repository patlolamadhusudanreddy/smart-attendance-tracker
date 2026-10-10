const PDFDocument = require('pdfkit');

/**
 * Builds a formatted institutional PDF attendance report
 * @param {Object} reportInfo - Meta details like subjectName, teacherName, dateRange, etc.
 * @param {Array} records - List of records { studentName, rollNumber, date, status }
 * @returns {Promise<Buffer>}
 */
const generateAttendancePdfBuffer = (reportInfo, records) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Header Banner
      doc.rect(40, 40, 515, 60).fill('#4338ca');
      doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold').text('SMART STUDENT ATTENDANCE SYSTEM', 55, 52);
      doc.fontSize(10).font('Helvetica').text('Official Departmental Attendance Record & Audit Sheet', 55, 75);

      doc.moveDown(2);
      doc.fillColor('#1f2937');

      // Meta info table / box
      const startY = 120;
      doc.rect(40, startY, 515, 60).stroke('#e5e7eb');
      doc.fontSize(10).font('Helvetica-Bold').text(`Subject: ${reportInfo.subjectName || 'All Subjects'}`, 55, startY + 12);
      doc.font('Helvetica').text(`Faculty: ${reportInfo.teacherName || 'All Faculty'}`, 55, startY + 28);
      doc.text(`Generated On: ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}`, 55, startY + 44);

      doc.font('Helvetica-Bold').text(`Period: ${reportInfo.period || 'Comprehensive'}`, 320, startY + 12);
      doc.font('Helvetica').text(`Total Logs: ${records.length}`, 320, startY + 28);
      const presentCount = records.filter((r) => r.status === 'Present').length;
      const rate = records.length > 0 ? ((presentCount / records.length) * 100).toFixed(1) : '0';
      doc.text(`Attendance Rate: ${rate}%`, 320, startY + 44);

      // Table Header
      let tableY = 195;
      doc.rect(40, tableY, 515, 24).fill('#f3f4f6');
      doc.fillColor('#374151').font('Helvetica-Bold').fontSize(9);
      doc.text('ROLL NO', 50, tableY + 7);
      doc.text('STUDENT NAME', 140, tableY + 7);
      doc.text('DATE', 310, tableY + 7);
      doc.text('STATUS', 410, tableY + 7);
      doc.text('METHOD', 480, tableY + 7);

      tableY += 24;
      doc.font('Helvetica').fontSize(9);

      // Table Rows
      records.forEach((item, index) => {
        // Page break if near bottom
        if (tableY > 750) {
          doc.addPage();
          tableY = 50;

          // Repeat header
          doc.rect(40, tableY, 515, 24).fill('#f3f4f6');
          doc.fillColor('#374151').font('Helvetica-Bold').fontSize(9);
          doc.text('ROLL NO', 50, tableY + 7);
          doc.text('STUDENT NAME', 140, tableY + 7);
          doc.text('DATE', 310, tableY + 7);
          doc.text('STATUS', 410, tableY + 7);
          doc.text('METHOD', 480, tableY + 7);
          tableY += 24;
          doc.font('Helvetica').fontSize(9);
        }

        // Alternating row background
        if (index % 2 === 0) {
          doc.rect(40, tableY, 515, 20).fill('#fafafa');
        }

        doc.fillColor('#1f2937');
        doc.text(item.rollNumber || '-', 50, tableY + 5);
        doc.text((item.studentName || 'Student').substring(0, 24), 140, tableY + 5);
        doc.text(new Date(item.date).toISOString().split('T')[0], 310, tableY + 5);

        // Status badge color
        if (item.status === 'Present') {
          doc.fillColor('#059669').font('Helvetica-Bold').text('Present', 410, tableY + 5);
        } else if (item.status === 'Late') {
          doc.fillColor('#d97706').font('Helvetica-Bold').text('Late', 410, tableY + 5);
        } else {
          doc.fillColor('#dc2626').font('Helvetica-Bold').text('Absent', 410, tableY + 5);
        }

        doc.fillColor('#6b7280').font('Helvetica').text(item.method || 'Manual', 480, tableY + 5);

        tableY += 20;
      });

      // Footer
      doc.fontSize(8).fillColor('#9ca3af').text(
        'Generated automatically by Smart Student Attendance System. Institutional confidential document.',
        40,
        790,
        { align: 'center', width: 515 }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  generateAttendancePdfBuffer,
};
