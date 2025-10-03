import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportAttendanceToPDF = (activityWithAttendance: any) => {
  if (!activityWithAttendance) return;

  const doc = new jsPDF();
  
  // Calculate activity duration
  const calculateDuration = (startTime: string, endTime: string) => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    const durationMinutes = endMinutes - startMinutes;
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    if (hours === 0) {
      return `${minutes} min`;
    } else if (minutes === 0) {
      return `${hours} uur`;
    } else {
      return `${hours}u ${minutes}min`;
    }
  };

  const duration = calculateDuration(activityWithAttendance.startTijd, activityWithAttendance.eindTijd);
  
  // Modern color scheme
  const primaryColor: [number, number, number] = [59, 130, 246]; // Blue-500
  const secondaryColor: [number, number, number] = [243, 244, 246]; // Gray-100
  const textColor: [number, number, number] = [31, 41, 55]; // Gray-800
  const successColor: [number, number, number] = [34, 197, 94]; // Green-500
  const errorColor: [number, number, number] = [239, 68, 68]; // Red-500
  
  // Sleek header with minimal styling
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 28, 'F');
  
  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Aanwezigheidslijst', 20, 18);
  
  // Activity name - smaller and more subtle
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(activityWithAttendance.naam, 20, 25);
  
  // Compact activity details section
  let currentY = 40;
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Activiteit Details', 20, currentY);
  
  // Minimal details box
  doc.setFillColor(248, 250, 252); // Very light gray
  doc.rect(20, currentY + 3, 170, 28, 'F');
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.rect(20, currentY + 3, 170, 28, 'S');
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  
  const activityDate = new Date(activityWithAttendance.datum).toLocaleDateString('nl-NL', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Compact layout - two columns
  doc.text(`Datum: ${activityDate}`, 25, currentY + 12);
  doc.text(`Tijd: ${activityWithAttendance.startTijd} - ${activityWithAttendance.eindTijd}`, 25, currentY + 19);
  doc.text(`Duur: ${duration}`, 25, currentY + 26);
  
  if (activityWithAttendance.locatie) {
    doc.text(`Locatie: ${activityWithAttendance.locatie}`, 110, currentY + 12);
  }
  
  currentY += 40;
  
  // Compact summary statistics
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Samenvatting', 20, currentY);
  
  currentY += 8;
  
  // Sleek statistics cards - smaller and more refined
  const cardWidth = 45;
  const cardHeight = 20;
  const cardSpacing = 8;
  
  // Total members card - refined
  doc.setFillColor(250, 250, 250);
  doc.rect(20, currentY, cardWidth, cardHeight, 'F');
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.rect(20, currentY, cardWidth, cardHeight, 'S');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(activityWithAttendance.attendanceCount.total.toString(), 20 + cardWidth/2, currentY + 10, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Totaal', 20 + cardWidth/2, currentY + 15, { align: 'center' });
  
  // Present card - refined
  doc.setFillColor(236, 253, 245); // Lighter green
  doc.rect(20 + cardWidth + cardSpacing, currentY, cardWidth, cardHeight, 'F');
  doc.setDrawColor(successColor[0], successColor[1], successColor[2]);
  doc.setLineWidth(0.3);
  doc.rect(20 + cardWidth + cardSpacing, currentY, cardWidth, cardHeight, 'S');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(successColor[0], successColor[1], successColor[2]);
  doc.text(activityWithAttendance.attendanceCount.aanwezig.toString(), 20 + cardWidth + cardSpacing + cardWidth/2, currentY + 10, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text('Aanwezig', 20 + cardWidth + cardSpacing + cardWidth/2, currentY + 15, { align: 'center' });
  
  // Absent card - refined
  doc.setFillColor(254, 242, 242); // Lighter red
  doc.rect(20 + 2 * (cardWidth + cardSpacing), currentY, cardWidth, cardHeight, 'F');
  doc.setDrawColor(errorColor[0], errorColor[1], errorColor[2]);
  doc.setLineWidth(0.3);
  doc.rect(20 + 2 * (cardWidth + cardSpacing), currentY, cardWidth, cardHeight, 'S');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(errorColor[0], errorColor[1], errorColor[2]);
  doc.text(activityWithAttendance.attendanceCount.afwezig.toString(), 20 + 2 * (cardWidth + cardSpacing) + cardWidth/2, currentY + 10, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text('Afwezig', 20 + 2 * (cardWidth + cardSpacing) + cardWidth/2, currentY + 15, { align: 'center' });
  
  currentY += 30;
  
  // Sleek members table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text('Deelnemers', 20, currentY);
  
  // Prepare table data (removed email and note columns)
  const tableData = activityWithAttendance.members.map((member: any) => {
    const attendance = activityWithAttendance.attendance.find((a: any) => a.memberId === member._id);
    return [
      `${member.voornaam} ${member.naam}`,
      attendance?.status === 'aanwezig' ? 'Aanwezig' : 
      attendance?.status === 'afwezig' ? 'Afwezig' : 'Niet gemarkeerd'
    ];
  });

  // Add ultra-compact table
  autoTable(doc, {
    head: [['Naam', 'Status']],
    body: tableData,
    startY: currentY + 8,
    styles: {
      fontSize: 8,
      cellPadding: 3,
      lineColor: [245, 245, 245],
      lineWidth: 0.2,
      minCellHeight: 12,
    },
    headStyles: {
      fillColor: [primaryColor[0], primaryColor[1], primaryColor[2]],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: 5,
      minCellHeight: 16,
    },
    columnStyles: {
      0: { cellWidth: 130 },
      1: { cellWidth: 40, halign: 'center' },
    },
    alternateRowStyles: {
      fillColor: [254, 254, 254], // Ultra light gray
    },
    didParseCell: function(data: any) {
      if (data.column.index === 1) {
        data.cell.styles.minCellHeight = 12;
        if (data.cell.raw === 'Aanwezig') {
          data.cell.styles.textColor = [successColor[0], successColor[1], successColor[2]];
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [245, 254, 248]; // Ultra light green
        } else if (data.cell.raw === 'Afwezig') {
          data.cell.styles.textColor = [errorColor[0], errorColor[1], errorColor[2]];
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [254, 245, 245]; // Ultra light red
        } else {
          data.cell.styles.textColor = [107, 114, 128]; // Gray-500
          data.cell.styles.fillColor = [250, 251, 252]; // Ultra light gray
        }
      } else {
        data.cell.styles.minCellHeight = 12;
      }
    }
  });

  // Minimal footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(7);
  doc.setTextColor(156, 163, 175); // Gray-400
  doc.text(`Gegenereerd ${new Date().toLocaleDateString('nl-NL')}`, 20, pageHeight - 8);
  doc.text(`1`, 190, pageHeight - 8, { align: 'right' });

  // Save the PDF
  const fileName = `aanwezigheid_${activityWithAttendance.naam.replace(/[^a-z0-9]/gi, '_')}_${new Date(activityWithAttendance.datum).toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
