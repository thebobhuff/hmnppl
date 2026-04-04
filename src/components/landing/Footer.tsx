import Link from "next/link";
import Image from "next/image";

const footerLinks = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Contact", href: "/contact" },
] as const;

const currentYear = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="border-t border-border bg-brand-dark-slate">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
        {/* Brand + copyright */}
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="HMN/PPL"
            width={20}
            height={20}
            className="h-5 w-auto"
          />
          <span className="text-xs text-text-tertiary">
            © {currentYear} HMN/PPL. All rights reserved.
          </span>
        </div>

        {/* Links */}
        <nav aria-label="Footer navigation">
          <ul className="flex items-center gap-6" role="list">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-xs text-text-tertiary transition-colors hover:text-text-secondary"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
