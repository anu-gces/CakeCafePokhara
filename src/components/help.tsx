import React from "react";
import { Info, CalendarDays, AlertCircle, LifeBuoy } from "lucide-react";

export function Help() {
  return (
    <div className="bg-background px-6 py-10 text-foreground">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 text-center">
          <h1 className="font-bold text-4xl tracking-tight">Help & Support</h1>
          <p className="mt-2 text-gray-600">Everything you need to know to navigate the app smoothly.</p>
        </header>

        <div className="gap-8 grid md:grid-cols-2">
          <Section
            icon={<Info className="w-6 h-6 text-blue-500" />}
            title="Overview"
            content="This app helps manage customer orders and receipts, tracks transaction history, and allows you to search based on time ranges. Use the main navigation to access core features."
          />

          <Section
            icon={<CalendarDays className="w-6 h-6 text-green-500" />}
            title="Orders by Date Range"
            content="Use the date picker to filter orders between two dates. This is useful for reviewing activity or resolving customer inquiries from a specific time period."
          />

          <Section
            icon={<AlertCircle className="w-6 h-6 text-red-500" />}
            title="Troubleshooting"
            content={
              <ul className="space-y-1 ml-5 text-sm list-disc">
                <li>Ensure your internet connection is stable.</li>
                <li>Use valid date formats (YYYY-MM-DD).</li>
                <li>If data seems missing, check the Firebase console directly.</li>
              </ul>
            }
          />

          <Section
            icon={<LifeBuoy className="w-6 h-6 text-purple-500" />}
            title="Still need help?"
            content={
              <p className="text-sm">
                For technical support, please contact <strong>anuvette</strong> at{" "}
                <a href="mailto:anuvette.dev@gmail.com" className="text-blue-600 hover:text-blue-800 underline">
                  anuvette.dev@gmail.com
                </a>
                .
              </p>
            }
          />
        </div>

        <footer className="bottom-4 left-1/2 absolute m-0 p-0 border-t text-foreground text-sm text-center -translate-x-1/2">
          &copy; {new Date().getFullYear()} anuvette. All rights reserved.
        </footer>
      </div>
    </div>
  );
}

function Section({ icon, title, content }: { icon: React.ReactNode; title: string; content: React.ReactNode }) {
  return (
    <div className="bg-card shadow-md hover:shadow-lg p-6 rounded-2xl transition-shadow duration-300">
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <h3 className="font-semibold text-lg">{title}</h3>
      </div>
      <div className="text-foreground text-sm">{content}</div>
    </div>
  );
}
