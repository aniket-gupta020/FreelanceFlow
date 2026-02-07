// src/utils/pdfGenerator.js
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from '../utils/formatCurrency';

export const generateInvoicePDF = (invoice) => {
    if (!invoice) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Data Extraction (Safety Checks)
    const client = invoice.client || { name: "Client", email: "N/A" };
    const freelancer = invoice.freelancer || { name: "Freelancer", email: "N/A" };
    const project = invoice.project || { title: "Project" };
    const logs = invoice.logs || [];
    const invoiceNum = invoice.invoiceNumber || `INV-${String(invoice._id).slice(-6).toUpperCase()}`;
    const dateStr = new Date(invoice.createdAt || Date.now()).toLocaleDateString().toUpperCase();

    // Colors
    const violetDark = [46, 16, 101];
    const violetPrimary = [124, 58, 237];
    const slateText = [30, 41, 59];
    const slateLight = [148, 163, 184];

    // --- 1. TOP BRANDING BAR ---
    doc.setFillColor(139, 92, 246);
    doc.rect(0, 0, pageWidth / 3, 6, 'F');
    doc.setFillColor(168, 85, 247);
    doc.rect(pageWidth / 3, 0, pageWidth / 3, 6, 'F');
    doc.setFillColor(236, 72, 153);
    doc.rect((pageWidth / 3) * 2, 0, pageWidth / 3, 6, 'F');

    // --- 2. HEADER ---
    doc.setFontSize(26);
    doc.setTextColor(...violetDark);
    doc.setFont("helvetica", "bold");
    doc.text("FreelanceFlow", 14, 25);

    doc.setFontSize(10);
    doc.setTextColor(...violetPrimary);
    doc.text("MODERN WORKFORCE SOLUTIONS", 14, 30);

    doc.setFontSize(22);
    doc.setTextColor(...slateText);
    doc.text("PAYOUT STATEMENT", pageWidth - 14, 25, { align: 'right' });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    doc.text(`DATE: ${dateStr}`, pageWidth - 14, 32, { align: 'right' });
    doc.text(`REF: #${invoiceNum}`, pageWidth - 14, 37, { align: 'right' });

    // --- 3. DETAILS GRID ---
    const startY = 55;

    // Left: FROM (Client)
    doc.setDrawColor(200);
    doc.line(14, startY - 5, 14, startY + 25);
    doc.setLineWidth(1);
    doc.setDrawColor(...violetPrimary);
    doc.line(14, startY - 5, 14, startY + 10);

    doc.setFontSize(8);
    doc.setTextColor(...slateLight);
    doc.text("BILL FROM (PROJECT OWNER)", 18, startY);

    doc.setFontSize(11);
    doc.setTextColor(...slateText);
    doc.setFont("helvetica", "bold");
    doc.text((client.name || "").toUpperCase(), 18, startY + 6);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);
    doc.text(client.email || "", 18, startY + 11);
    doc.text(client.mobile || "", 18, startY + 16);

    // Right: TO (Freelancer)
    const rightColX = pageWidth / 2 + 10;
    doc.setLineWidth(0.5);
    doc.setDrawColor(200);
    doc.line(rightColX, startY - 5, rightColX, startY + 25);
    doc.setLineWidth(1);
    doc.setDrawColor(236, 72, 153); // Pink Accent
    doc.line(rightColX, startY - 5, rightColX, startY + 10);

    doc.setFontSize(8);
    doc.setTextColor(...slateLight);
    doc.text("BILL TO (FREELANCER)", rightColX + 4, startY);

    doc.setFontSize(11);
    doc.setTextColor(...slateText);
    doc.setFont("helvetica", "bold");
    doc.text((freelancer.name || "").toUpperCase(), rightColX + 4, startY + 6);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);
    doc.text(freelancer.email || "", rightColX + 4, startY + 11);
    doc.text(freelancer.mobile || "", rightColX + 4, startY + 16);

    // Project Badge
    doc.setFillColor(245, 243, 255);
    doc.roundedRect(14, startY + 30, pageWidth - 28, 12, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setTextColor(...violetPrimary);
    doc.setFont("helvetica", "bold");
    doc.text(`PROJECT: ${(project.title || "").toUpperCase()}`, 18, startY + 37.5);

    // --- 4. DATA TABLE ---
    // If logs are populated, map them. If not (flat invoice), create a generic row.
    let tableBody = [];
    if (logs && logs.length > 0) {
        tableBody = logs.map(log => [
            new Date(log.startTime || Date.now()).toLocaleDateString(),
            log.description || 'System Log',
            `${(log.durationHours || 0).toFixed(2)} hrs`,
            `${(log.durationHours || 0).toFixed(2)} hrs`,
            formatCurrency(invoice.totalAmount / (invoice.totalHours || 1)), // Approx rate if not saved
            formatCurrency((log.durationHours || 0) * (invoice.totalAmount / (invoice.totalHours || 1)))
        ]);
    } else {
        // Fallback for flat invoices without logs
        tableBody = [[
            dateStr,
            "Consolidated Project Payment",
            `${(invoice.totalHours || 0).toFixed(2)} hrs`,
            "-",
            formatCurrency(invoice.totalAmount)
        ]];
    }

    autoTable(doc, {
        startY: startY + 48,
        head: [['DATE', 'DESCRIPTION', 'HOURS', 'RATE', 'TOTAL']],
        body: tableBody,
        theme: 'grid',
        headStyles: {
            fillColor: [15, 23, 42],
            textColor: 255,
            fontStyle: 'bold',
            halign: 'left',
            cellPadding: 4
        },
        bodyStyles: { textColor: [51, 65, 85], cellPadding: 4 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
            0: { cellWidth: 30 },
            2: { halign: 'right', fontStyle: 'bold' },
            3: { halign: 'right' },
            4: { halign: 'right', fontStyle: 'bold', textColor: [124, 58, 237] }
        },
        styles: { fontSize: 9, lineColor: [226, 232, 240] }
    });

    // --- 5. FLOATING TOTAL CARD ---
    const finalY = doc.lastAutoTable.finalY + 10;
    const boxWidth = 80;
    const boxX = pageWidth - 14 - boxWidth;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(139, 92, 246);
    doc.setLineWidth(0.5);
    doc.roundedRect(boxX, finalY, boxWidth, 25, 2, 2, 'FD');

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Total Hours:", boxX + 5, finalY + 8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text(`${(invoice.totalHours || 0).toFixed(2)} hrs`, pageWidth - 19, finalY + 8, { align: 'right' });

    doc.setDrawColor(240);
    doc.line(boxX + 5, finalY + 12, pageWidth - 19, finalY + 12);

    doc.setFontSize(12);
    doc.setTextColor(...violetPrimary);
    doc.text("Total Amount:", boxX + 5, finalY + 19);
    doc.setFontSize(14);
    doc.text(formatCurrency(invoice.totalAmount || 0), pageWidth - 19, finalY + 19, { align: 'right' });

    // --- 6. FOOTER ---
    const footerY = pageHeight - 15;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Generated by FreelanceFlow System", 14, footerY);
    doc.text("Secure Payment Verified", pageWidth - 14, footerY, { align: 'right' });

    doc.setDrawColor(...violetPrimary);
    doc.setLineWidth(1);
    doc.line(14, footerY + 3, pageWidth - 14, footerY + 3);

    doc.save(`${invoiceNum}_${Date.now()}.pdf`);
};