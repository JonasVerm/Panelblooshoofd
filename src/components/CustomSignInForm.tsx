"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";

export function CustomSignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.set("email", email.toLowerCase());
      formData.set("password", password);
      formData.set("flow", flow);

      await signIn("password", formData);
    } catch (error: any) {
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
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <form className="flex flex-col gap-form-field" onSubmit={handleSubmit}>
        <input
          className="auth-input-field"
          type="email"
          name="email"
          placeholder="E-mail"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="auth-input-field"
          type="password"
          name="password"
          placeholder="Wachtwoord"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button 
          className="auth-button" 
          type="submit" 
          disabled={submitting}
        >
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
