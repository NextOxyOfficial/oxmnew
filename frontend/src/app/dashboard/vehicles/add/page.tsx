"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import VehicleForm from "@/components/vehicles/VehicleForm";

export default function AddVehiclePage() {
  return (
    <div className="page page-narrow space-y-4">
      <div className="page-head">
        <div>
          <Link
            href="/dashboard/vehicles"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            বাইকের লিস্ট
          </Link>
          <h1 className="page-title mt-1">নতুন বাইক</h1>
          <p className="page-sub">
            বাইকের নাম লিখে স্টকে যোগ করুন — ইঞ্জিন আর চেসিস নম্বর পরে দিলেও চলবে
          </p>
        </div>
      </div>

      <VehicleForm />
    </div>
  );
}
