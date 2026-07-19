"use client";

import { useState, useRef } from "react";
import { FileText, Upload, CheckCircle2, AlertTriangle, Lightbulb, Award, Target, Star, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { EmptyState } from "@/components/dashboard/EmptyState";

interface GeminiAnalysis {
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  keywordMatch: string[];
}

export default function ResumePage() {
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [analysis, setAnalysis] = useState<GeminiAnalysis | null>(null);
  const [targetRole, setTargetRole] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Helper to extract text from a PDF file using pdf.js via CDN
  async function extractTextFromPDF(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      script.onload = async () => {
        try {
          const pdfjsLib = (window as any).pdfjsLib;
          pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
          
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
          let fullText = "";
          
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(" ");
            fullText += pageText + "\n";
          }
          resolve(fullText);
        } catch (err) {
          reject(err);
        } finally {
          document.body.removeChild(script);
        }
      };
      script.onerror = () => {
        document.body.removeChild(script);
        reject(new Error("Failed to load PDF.js"));
      };
      document.body.appendChild(script);
    });
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && file.type !== "text/plain") {
      setUploadError("Please upload a .pdf or .txt file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File must be smaller than 5 MB.");
      return;
    }

    setAnalyzing(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      let resumeText = "";

      // 1. Extract Text
      if (file.type === "application/pdf") {
        resumeText = await extractTextFromPDF(file);
      } else {
        resumeText = await file.text();
      }

      // 2. Upload File to Supabase (Optional, just keeping it in sync)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const filePath = `${user.id}/${Date.now()}_${file.name}`;
        await supabase.storage.from("resumes").upload(filePath, file, { upsert: true });
        const { data: urlData } = supabase.storage.from("resumes").getPublicUrl(filePath);
        await supabase
          .from("profiles")
          .update({ resume_url: urlData.publicUrl, resume_updated_at: new Date().toISOString() })
          .eq("user_id", user.id);
      }

      // 3. Call Gemini API
      const response = await fetch("/api/analyze-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, targetRole }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze resume");
      }

      const result: GeminiAnalysis = await response.json();
      setAnalysis(result);
      setUploadSuccess(true);
      
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "An unexpected error occurred during analysis.");
    } finally {
      setAnalyzing(false);
      if (fileRef.current) fileRef.current.value = ""; // Reset input
    }
  }

  function getScoreColor(score: number): string {
    if (score >= 80) return "var(--text-success)";
    if (score >= 60) return "var(--text-accent)";
    if (score >= 40) return "var(--text-warning)";
    return "var(--text-danger)";
  }

  function getScoreLabel(score: number): string {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs improvement";
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[18px] font-semibold text-[var(--text-primary)] mb-1">Resume Analyzer (Powered by Gemini)</h2>
        <p className="text-[13px] text-[var(--text-muted)]">Upload your resume (.pdf or .txt) to get AI-powered insights tailored to your target role.</p>
      </div>

      {/* Target Role & Upload section */}
      <div className="flex flex-col gap-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] p-6">
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-[var(--text-primary)]">Target Role (Optional)</label>
          <input
            type="text"
            placeholder="e.g. Frontend Developer, Data Scientist..."
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-0)] px-3 py-2 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--fill-accent)] placeholder:text-[var(--text-muted)]"
          />
        </div>

        <div
          className="flex flex-col items-center justify-center rounded-[var(--radius)] border-2 border-dashed border-[var(--border)] bg-[var(--surface-0)] p-8 transition-colors hover:border-[var(--fill-accent)] cursor-pointer"
          onClick={() => !analyzing && fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.txt"
            onChange={handleUpload}
            className="hidden"
            disabled={analyzing}
          />
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--bg-accent)] mb-3">
            <Upload size={22} className="text-[var(--text-accent)]" />
          </div>
          <p className="text-[14px] font-medium text-[var(--text-primary)] mb-1">
            {analyzing ? "Gemini is analyzing your resume..." : "Drop your resume here or click to upload"}
          </p>
          <p className="text-[12px] text-[var(--text-muted)]">.PDF or .TXT only, max 5 MB</p>

          {uploadError && (
            <div className="mt-3 flex items-center gap-1.5 text-[12px] text-[var(--text-danger)]">
              <AlertTriangle size={13} />
              {uploadError}
            </div>
          )}
          {uploadSuccess && (
            <div className="mt-3 flex items-center gap-1.5 text-[12px] text-[var(--text-success)]">
              <CheckCircle2 size={13} />
              Resume analyzed successfully!
            </div>
          )}
        </div>
      </div>

      {analyzing && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--fill-accent)] border-t-transparent" />
          <p className="text-[13px] text-[var(--text-accent)] font-medium animate-pulse">Running AI analysis...</p>
        </div>
      )}

      {!analyzing && !analysis && (
        <EmptyState
          icon={FileText}
          title="No analysis yet"
          description="Enter your target role and upload your resume to get started."
        />
      )}

      {/* Analysis results */}
      {!analyzing && analysis && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Left Column: Score & Summary */}
          <div className="flex flex-col gap-4 lg:col-span-1">
            {/* Score card */}
            <div className="flex flex-col items-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] p-6 text-center">
              <Award size={24} className="text-[var(--text-accent)] mb-3" />
              <div
                className="text-[48px] font-bold leading-none mb-1"
                style={{ color: getScoreColor(analysis.score ?? 0) }}
              >
                {analysis.score != null ? Math.round(analysis.score) : "—"}
              </div>
              <div className="text-[13px] text-[var(--text-muted)] mb-3">Overall Match Score</div>
              <span
                className="rounded-full px-3 py-1 text-[12px] font-medium"
                style={{
                  background: analysis.score != null && analysis.score >= 60 ? "var(--bg-success)" : "var(--bg-warning)",
                  color: analysis.score != null && analysis.score >= 60 ? "var(--text-success)" : "var(--text-warning)",
                }}
              >
                {getScoreLabel(analysis.score ?? 0)}
              </span>
            </div>

            {/* Summary */}
            <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] p-5">
              <div className="flex items-center gap-2 mb-3">
                <Target size={16} className="text-[var(--text-primary)]" />
                <h3 className="text-[14px] font-medium text-[var(--text-primary)]">Profile Summary</h3>
              </div>
              <p className="text-[13px] leading-relaxed text-[var(--text-secondary)]">
                {analysis.summary}
              </p>
            </div>
          </div>

          {/* Right Column: Strengths, Improvements, Keywords */}
          <div className="flex flex-col gap-4 lg:col-span-2">
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
               {/* Strengths */}
              <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Star size={16} className="text-[var(--text-success)]" />
                  <h3 className="text-[14px] font-medium text-[var(--text-primary)]">Core Strengths</h3>
                </div>
                {analysis.strengths && analysis.strengths.length > 0 ? (
                  <ul className="flex flex-col gap-2.5">
                    {analysis.strengths.map((str, i) => (
                      <li key={i} className="flex items-start gap-2 text-[13px] text-[var(--text-secondary)]">
                        <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[var(--text-success)]" />
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[13px] text-[var(--text-muted)]">No distinct strengths identified.</p>
                )}
              </div>

              {/* Improvements */}
              <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb size={16} className="text-[var(--text-warning)]" />
                  <h3 className="text-[14px] font-medium text-[var(--text-primary)]">Areas for Improvement</h3>
                </div>
                {analysis.improvements && analysis.improvements.length > 0 ? (
                  <ul className="flex flex-col gap-2.5">
                    {analysis.improvements.map((imp, i) => (
                      <li key={i} className="flex items-start gap-2 text-[13px] text-[var(--text-secondary)]">
                        <AlertTriangle size={14} className="mt-0.5 shrink-0 text-[var(--text-warning)]" />
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[13px] text-[var(--text-muted)]">No major improvements needed.</p>
                )}
              </div>
            </div>

            {/* Keyword Match */}
            <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] p-5">
              <div className="flex items-center gap-2 mb-3">
                <Search size={16} className="text-[var(--text-accent)]" />
                <h3 className="text-[14px] font-medium text-[var(--text-primary)]">Keyword Match</h3>
              </div>
              {analysis.keywordMatch && analysis.keywordMatch.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {analysis.keywordMatch.map((kw) => (
                    <span
                      key={kw}
                      className="rounded-md bg-[var(--bg-accent)] px-3 py-1.5 text-[12px] font-medium text-[var(--text-accent)]"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-[var(--text-muted)]">No relevant keywords identified.</p>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
