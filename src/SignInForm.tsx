"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="w-full">
      <form
        className="flex flex-col gap-form-field"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitting(true);
          const formData = new FormData(e.target as HTMLFormElement);
          formData.set("flow", flow);
          void signIn("password", formData).catch((error) => {
            let toastTitle = "";
            if (error.message.includes("Invalid password")) {
              toastTitle = "Ongeldig wachtwoord. Probeer het opnieuw.";
            } else {
              toastTitle =
                flow === "signIn"
                  ? "Kon niet inloggen, bedoelde je je aan te melden?"
                  : "Kon niet aanmelden, bedoelde je in te loggen?";
            }
            toast.error(toastTitle);
            setSubmitting(false);
          });
        }}
      >
        <input
          className="auth-input-field"
          type="email"
          name="email"
          placeholder="E-mail"
          required
        />
        <input
          className="auth-input-field"
          type="password"
          name="password"
          placeholder="Wachtwoord"
          required
        />
        <button className="auth-button" type="submit" disabled={submitting}>
          {flow === "signIn" ? "Inloggen" : "Aanmelden"}
        </button>

      </form>
      
      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          className="text-sm text-orange-600 hover:text-orange-800 font-medium"
        >
          {flow === "signIn" 
            ? "Nog geen account? Meld je aan" 
            : "Al een account? Log in"
          }
        </button>
      </div>
    </div>
  );
}
