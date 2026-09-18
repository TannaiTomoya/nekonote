"use client";
import Link from "next/link";
import { Icon } from "./icons";
import type { ReactNode } from "react";
export function PageTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-title">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p className="muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function BackLink({
  href = "/today",
  children = "きょうへ戻る",
}: {
  href?: string;
  children?: ReactNode;
}) {
  return (
    <Link className="back-link" href={href}>
      <Icon name="back" size={17} />
      {children}
    </Link>
  );
}
export function Empty({
  icon = "leaf",
  children,
}: {
  icon?: string;
  children: ReactNode;
}) {
  return (
    <div className="empty">
      <Icon name={icon} size={30} />
      <p>{children}</p>
    </div>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function SafetyLink() {
  return (
    <div className="notice">
      <Icon name="heart" size={20} />
      <div>
        相談先をひらけます。
        <br />
        <a
          href="https://www.mhlw.go.jp/mamorouyokokoro/soudan/"
          target="_blank"
          rel="noopener noreferrer"
        >
          厚生労働省の相談窓口一覧 <Icon name="external" size={14} />
        </a>
      </div>
    </div>
  );
}
