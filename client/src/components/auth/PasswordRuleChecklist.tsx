import React from "react";

export default function PasswordRuleChecklist({ password }: { password: string }) {
  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password);

  const rules = [
    { label: "Be at least 8 characters", valid: hasLength },
    { label: "Include upper and lower case letters", valid: hasUpper && hasLower },
    { label: "Include a number and a special character", valid: hasNumber && hasSpecial }
  ];

  return (
    <ul className="list-unstyled mb-0 small">
      {rules.map((rule, idx) => (
        <li key={idx} className={`d-flex align-items-center gap-2 mb-1 ${rule.valid ? "text-success" : "text-muted"}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={rule.valid ? "text-success" : "text-muted opacity-50"}>
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          {rule.label}
        </li>
      ))}
    </ul>
  );
}
