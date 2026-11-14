import { TOOLS } from "../data/astriaConfig.js";

export default function Badge({ level }) {
  const style = TOOLS[level];
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${style.tone}`}>{style.text}</span>;
}
