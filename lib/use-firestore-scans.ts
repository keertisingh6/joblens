"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  setDoc,
  doc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { CyberThreatReport } from "@/lib/security/types";
import { DEMO_PRESET_SCANS } from "@/lib/security/history-store";

export function useFirestoreScans() {
  const { user } = useAuth();
  const [scans, setScans] = useState<CyberThreatReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      // Fallback to local storage presets if unauthenticated
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("joblens_security_scans_v2");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setScans(parsed);
              setLoading(false);
              return;
            }
          }
        } catch {
          // ignore
        }
      }
      setScans(DEMO_PRESET_SCANS);
      setLoading(false);
      return;
    }

    setLoading(true);
    const scansRef = collection(db, "scans");
    const q = query(
      scansRef,
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched: CyberThreatReport[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          fetched.push({
            ...(data.report as CyberThreatReport),
            id: d.id,
          });
        });

        if (fetched.length === 0) {
          // If fresh user has 0 saved scans, provide starting presets
          setScans(DEMO_PRESET_SCANS);
        } else {
          setScans(fetched);
        }
        setLoading(false);
      },
      (error) => {
        console.warn("Firestore scans subscription fallback:", error);
        // Fallback to presets on error
        setScans(DEMO_PRESET_SCANS);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const saveScan = async (report: CyberThreatReport) => {
    // 1. Always save to local storage as safety backup
    if (typeof window !== "undefined") {
      try {
        const current = [...scans.filter((s) => s.id !== report.id)];
        localStorage.setItem("joblens_security_scans_v2", JSON.stringify([report, ...current]));
      } catch (e) {
        console.warn("Local storage write error:", e);
      }
    }

    // 2. Persist to Firestore if user authenticated
    if (user) {
      try {
        const scanRef = doc(db, "scans", report.id);
        await setDoc(scanRef, {
          userId: user.uid,
          userEmail: user.email,
          report,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.error("Failed to save scan to Firestore:", err);
      }
    }

    setScans((prev) => [report, ...prev.filter((s) => s.id !== report.id)]);
  };

  const deleteScan = async (reportId: string) => {
    if (typeof window !== "undefined") {
      try {
        const filtered = scans.filter((s) => s.id !== reportId);
        localStorage.setItem("joblens_security_scans_v2", JSON.stringify(filtered));
      } catch (e) {
        console.warn("Local storage delete error:", e);
      }
    }

    if (user) {
      try {
        await deleteDoc(doc(db, "scans", reportId));
      } catch (err) {
        console.error("Failed to delete scan from Firestore:", err);
      }
    }

    setScans((prev) => prev.filter((s) => s.id !== reportId));
  };

  return {
    scans,
    loading,
    saveScan,
    deleteScan,
  };
}
