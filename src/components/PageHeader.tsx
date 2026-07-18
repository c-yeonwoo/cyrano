import { Icon, type IconName } from "./Icon";

export function PageHeader({
  icon,
  title,
  desc,
}: {
  icon: IconName;
  title: string;
  desc?: string;
}) {
  return (
    <header className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <Icon name={icon} size={20} />
      </span>
      <div>
        <h1 className="text-xl font-extrabold text-ink-800">{title}</h1>
        {desc && <p className="text-sm text-ink-500">{desc}</p>}
      </div>
    </header>
  );
}
