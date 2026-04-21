import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

const LEGAL_MARKDOWN_COMPONENTS: Components = {
  h1: ({ children }) => (
    <h1 className="mt-8 text-3xl font-semibold tracking-[-0.02em] text-[var(--app-text)] first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-8 text-xl font-semibold text-[var(--app-text)] first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-6 text-base font-semibold text-[var(--app-text)] first:mt-0">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="mt-4 leading-7 text-[var(--app-text-muted)] first:mt-0">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="mt-4 list-disc space-y-2.5 pl-5 text-[var(--app-text-muted)] marker:text-[var(--app-text-faint)]">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mt-4 list-decimal space-y-2.5 pl-5 text-[var(--app-text-muted)] marker:text-[var(--app-text-faint)]">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-1 leading-7">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="mt-5 rounded-[1.4rem] border border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] px-4 py-3 text-[var(--app-text)]">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-8 border-[var(--app-border)]" />,
  strong: ({ children }) => (
    <strong className="font-semibold text-[var(--app-text)]">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-[var(--app-text)]">{children}</em>,
  code: ({ children, className }) => {
    const isBlock = Boolean(className);
    if (isBlock) {
      return (
        <code className="mc-app-scrollbar block overflow-x-auto rounded-[1.35rem] bg-[var(--app-surface-soft)] px-4 py-3 text-[13px] leading-6 text-[var(--app-text)]">
          {children}
        </code>
      );
    }

    return (
      <code className="rounded-md bg-[var(--app-surface-soft)] px-1.5 py-0.5 text-[13px] text-[var(--app-text)]">
        {children}
      </code>
    );
  },
  pre: ({ children }) => <pre className="mc-app-scrollbar mt-4 overflow-x-auto">{children}</pre>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-medium text-[var(--app-accent)] underline underline-offset-2"
    >
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="mc-app-scrollbar mt-5 overflow-x-auto rounded-[1.4rem] border border-[var(--app-border)]">
      <table className="min-w-full border-collapse bg-[var(--app-surface)] text-left text-sm text-[var(--app-text-muted)]">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-[var(--app-surface-soft)] text-[var(--app-text)]">
      {children}
    </thead>
  ),
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => (
    <tr className="border-t border-[var(--app-border)] first:border-t-0">
      {children}
    </tr>
  ),
  th: ({ children }) => (
    <th className="px-4 py-3 font-medium leading-6">{children}</th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-3 align-top leading-6">{children}</td>
  ),
};

export function LegalDocument({
  markdown,
  className = "",
}: {
  markdown: string;
  className?: string;
}) {
  return (
    <div className={["text-sm", className].filter(Boolean).join(" ")}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={LEGAL_MARKDOWN_COMPONENTS}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
