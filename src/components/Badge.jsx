import { STATUS_SIGNAL, TOOLS } from "../data/astriaConfig.js";

export default function Badge({ level }) {
  const { text, tone } = TOOLS[level];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-[3px] border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${tone}`}>
      <span aria-hidden="true" className={`size-1.5 rounded-[1px] ${STATUS_SIGNAL[level].marker}`} />
      {text}
    </span>
  );
}
