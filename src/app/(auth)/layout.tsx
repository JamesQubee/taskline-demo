import { Brand } from "@/components/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
      <div className="mb-6">
        <Brand />
      </div>
      <div className="w-full max-w-sm rounded-card border border-line bg-surface p-6 shadow-card">
        {children}
      </div>
    </div>
  );
}
