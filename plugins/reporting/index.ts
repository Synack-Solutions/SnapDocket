// Reporting adapter plugin interface — implement for PDF, CSV, Excel, etc.

export interface ReportOptions {
  tenantId: string;
  dateFrom?: string;
  dateTo?: string;
  format: "pdf" | "csv" | "xlsx";
}

export interface ReportResult {
  buffer: Buffer;
  mimeType: string;
  filename: string;
}

export interface ReportingPlugin {
  readonly name: string;
  generateInvoicePdf(invoiceId: string): Promise<ReportResult>;
  generateRevenueReport(options: ReportOptions): Promise<ReportResult>;
}

// TODO: Implement PdfReportingPlugin using @react-pdf/renderer in plugins/reporting/pdf.ts
