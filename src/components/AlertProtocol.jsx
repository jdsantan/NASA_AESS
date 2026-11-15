import { INSTRUMENT_LABEL } from "../data/astriaConfig.js";

export default function AlertProtocol({ protocol }) {
  if (!protocol) return null;
  const { whatHappens, immediateAction } = protocol;

  return (
    <dl className="mt-2 grid gap-3 text-sm leading-relaxed text-slate-800">
      <div>
        <dt className={INSTRUMENT_LABEL}>Qué ocurre</dt>
        <dd className="mt-1">{whatHappens}</dd>
      </div>
      <div>
        <dt className={INSTRUMENT_LABEL}>Acción inmediata · Protocolo autónomo</dt>
        <dd className="mt-1 font-medium text-slate-950">{immediateAction}</dd>
      </div>
    </dl>
  );
}
