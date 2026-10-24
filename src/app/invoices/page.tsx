import { InvoiceUpload } from "@/features/invoices";

export default function InvoicesPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold">Đọc hóa đơn tự động</h1>
      <p className="mt-2 text-slate-300">
        Tải ảnh chụp hoặc file PDF, hệ thống sẽ trích xuất thông tin để bạn kiểm
        tra và lưu lại.
      </p>
      <div className="mt-8">
        <InvoiceUpload />
      </div>
    </main>
  );
}
