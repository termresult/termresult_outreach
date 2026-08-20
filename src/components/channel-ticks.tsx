import { Check, Minus } from "lucide-react";

export function ChannelTicks({
  whatsapp,
  sms,
  email,
}: {
  whatsapp: boolean;
  sms: boolean;
  email: boolean;
}) {
  const items = [
    { label: "WA", on: whatsapp },
    { label: "SMS", on: sms },
    { label: "Email", on: email },
  ];
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item.label}
          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
            item.on
              ? "border-emerald-100 bg-emerald-50 text-emerald-700"
              : "border-slate-100 bg-slate-50 text-slate-400"
          }`}
        >
          {item.on ? <Check className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
          {item.label}
        </span>
      ))}
    </div>
  );
}
