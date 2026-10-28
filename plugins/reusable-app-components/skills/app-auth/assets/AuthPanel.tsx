"use client";

import { useId, type ReactNode } from "react";
import "./auth-panel.css";

export function AuthPanel({ brand, title, description, children, footer }: {
  brand: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const titleId = useId();
  return <section className="app-auth-panel" aria-labelledby={titleId}>
    <header>
      <div className="app-auth-panel__brand">{brand}</div>
      <h2 id={titleId}>{title}</h2>
      {description ? <p>{description}</p> : null}
    </header>
    <div className="app-auth-panel__body">{children}</div>
    {footer ? <footer>{footer}</footer> : null}
  </section>;
}
