"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ApiService } from "@/lib/api";
import VehicleForm from "@/components/vehicles/VehicleForm";
import { Vehicle } from "@/lib/vehicles";

export default function EditVehiclePage() {
  const params = useParams();
  const id = params?.id as string;

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        setVehicle(await ApiService.getVehicle(id));
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "গাড়ির তথ্য লোড করা যায়নি");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  return (
    <div className="page page-narrow space-y-4">
      <div className="page-head">
        <div>
          <Link
            href={`/dashboard/vehicles/${id}`}
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            বাইকের বিস্তারিত
          </Link>
          <h1 className="page-title mt-1">বাইক এডিট</h1>
          {vehicle && (
            <p className="page-sub">
              {vehicle.product_name} · চেসিস {vehicle.chassis_number}
            </p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="plane">
          <div className="plane-section">
            <div className="empty">বাইকের তথ্য লোড হচ্ছে…</div>
          </div>
        </div>
      ) : error || !vehicle ? (
        <div className="plane">
          <div className="plane-section">
            <div className="empty">{error || "বাইকটা পাওয়া যায়নি"}</div>
          </div>
        </div>
      ) : (
        <>
          {vehicle.status === "sold" && (
            <div className="plane">
              <div className="plane-section">
                <p className="text-sm text-slate-600">
                  এই বাইকটা বিক্রি হয়ে গেছে। রেজিস্ট্রেশন নম্বর বা অন্য তথ্য পরে
                  এলে এখানে ঠিক করে নিতে পারবেন — তবে বিক্রির দাম, কাস্টমার আর
                  ইনভয়েস বদলাবে না।
                </p>
              </div>
            </div>
          )}
          <VehicleForm vehicle={vehicle} />
        </>
      )}
    </div>
  );
}
