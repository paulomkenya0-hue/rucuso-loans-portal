import * as XLSX from "xlsx";
import type { Submission } from "./types";

function toExportRows(submissions: Submission[]) {
  return submissions.map((s) => ({
    Timestamp: new Date(s.submitted_at).toLocaleString("en-GB", {
      timeZone: "Africa/Dar_es_Salaam",
    }),
    "Google Email": s.google_email,
    "Full Name": s.full_name,
    "Registration Number": s.registration_number,
    "Phone Number": s.phone_number,
    "Form Four Index Number": s.form_four_index_number,
    "Declaration Accepted": s.declaration_accepted ? "Yes" : "No",
    Status: s.status,
  }));
}

export function exportToExcel(submissions: Submission[], filename = "rucuso-submissions.xlsx") {
  const rows = toExportRows(submissions);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = [
    { wch: 20 },
    { wch: 28 },
    { wch: 26 },
    { wch: 24 },
    { wch: 16 },
    { wch: 22 },
    { wch: 18 },
    { wch: 12 },
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions");
  XLSX.writeFile(workbook, filename);
}

export function exportToCsv(submissions: Submission[], filename = "rucuso-submissions.csv") {
  const rows = toExportRows(submissions);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
