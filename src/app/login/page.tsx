import { Suspense } from "react";
import { Playfair_Display } from "next/font/google";
import { LoginButton } from "./login-button";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "800"],
});

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-md rounded-xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          TermResult
        </p>
        <h1
          className={`${playfair.className} mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl`}
        >
          Outreach
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Sign in with the official TermResult Google account. Only allow-listed emails can message
          schools.
        </p>
        <div className="mt-8">
          <Suspense fallback={<div className="h-11 rounded-full bg-slate-100" />}>
            <LoginButton />
          </Suspense>
        </div>
        <p className="mt-6 text-xs leading-relaxed text-slate-500">
          WhatsApp, SMS, and email stay off until later phases. This login only opens the empty
          workspace.
        </p>
      </div>
    </div>
  );
}
