import { useState } from "react";
import { ChevronDown, MessageSquare, Plus, Trash2 } from "lucide-react";
import { BUTTON, INPUT, LABEL, PANEL, TASKS } from "../data/astriaConfig.js";
import { CREW } from "../data/crew.js";
import { PageHeading } from "./MissionPages.jsx";

export function activitiesFor(log, memberId, day) {
  const assigned = [
    ...TASKS.map(([id, title]) => ({ id, title })),
    ...log.activities.filter(({ members }) => members.includes(memberId)),
  ];
  const removed = log.removed[memberId] ?? [];
  const completed = log.completed[day]?.[memberId] ?? [];
  return assigned.filter(({ id }) => !removed.includes(id)).map((item) => ({
    ...item, done: completed.includes(item.id),
  }));
}

export function ActivityForm({ onAdd, member }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [chosen, setChosen] = useState([]);
  const [message, setMessage] = useState("");
  const members = member ? [member.id] : chosen;
  return (
    <form className={PANEL} onSubmit={(event) => {
      event.preventDefault();
      if (!title.trim() || !description.trim() || !members.length) {
        setMessage("Completa el nombre, la descripción y los destinatarios.");
        return;
      }
      onAdd({ type: "add", activity: { id: crypto.randomUUID(), title: title.trim(), description: description.trim(), members } });
      setTitle("");
      setDescription("");
      if (!member) setChosen([]);
      setMessage("Actividad asignada.");
    }}>
      <h3 className="flex items-center gap-2 text-lg font-semibold"><Plus size={19} aria-hidden="true" /> Nueva actividad</h3>
      <label className={`mt-4 ${LABEL}`}>Nombre de la actividad
        <input className={INPUT} value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} required />
      </label>
      <label className={`mt-3 ${LABEL}`}>Descripción breve
        <textarea className={INPUT} value={description} onChange={(event) => setDescription(event.target.value)} maxLength={300} rows={2} required />
      </label>
      {member ? <p className="mt-3 text-sm text-slate-600">Se asignará a {member.name}.</p> : (
        <fieldset className="mt-3">
          <legend className={LABEL}>Asignar a</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {CREW.map(({ id, name }) => (
              <label key={id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <input type="checkbox" className="accent-blue-600" checked={chosen.includes(id)}
                  onChange={(event) => setChosen(event.target.checked ? [...chosen, id] : chosen.filter((item) => item !== id))} />
                {name}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <button className={`mt-4 ${BUTTON}`}>Guardar actividad</button>
      <p className="mt-2 text-sm text-slate-700" role="status">{message}</p>
    </form>
  );
}

export function RoutineList({ member, log, day, onAction }) {
  const routines = activitiesFor(log, member.id, day);
  const [notice, setNotice] = useState(null);

  return (
    <div>
      <p className="text-sm text-slate-600">{routines.filter(({ done }) => done).length} de {routines.length} completadas hoy</p>
      {routines.length === 0 ? <p className="mt-3 text-sm">Este integrante no tiene actividades asignadas.</p> : (
        <ul className="mt-3 grid gap-2">
          {routines.map(({ id, title, description, done }) => (
            <li key={id} className="flex items-start justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <label className="flex min-w-0 items-start gap-2">
                <input type="checkbox" className="mt-1 accent-blue-600" checked={done}
                  onChange={(event) => onAction({ type: "check", member: member.id, day, id, done: event.target.checked })} />
                <span className="min-w-0 break-words text-sm">
                  <span className="font-semibold">{title}</span>
                  {description && <span className="mt-1 block text-slate-600">{description}</span>}
                  <span className={`mt-1 block text-xs font-medium ${done ? "text-emerald-800" : "text-slate-600"}`}>
                    {done ? "Completada" : "Pendiente"}
                  </span>
                </span>
              </label>
              <button type="button" className={`shrink-0 ${BUTTON}`} aria-label={`Eliminar ${title}`}
                onClick={() => {
                  onAction({ type: "remove", member: member.id, id });
                  setNotice({ member: member.id, text: `Se quitó «${title}» para ${member.name}.` });
                }}>
                <Trash2 size={15} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <p role="status" className="mt-2 text-sm text-slate-600">{notice?.member === member.id ? notice.text : ""}</p>
    </div>
  );
}

export function MemberRoutines({ member, log, day, onAction }) {
  return (
    <div className="mt-5 grid items-start gap-5 lg:grid-cols-2">
      <section className={PANEL} aria-label="Rutinas diarias">
        <h3 className="mb-1 text-lg font-semibold">Rutinas diarias</h3>
        <RoutineList member={member} log={log} day={day} onAction={onAction} />
      </section>
      <ActivityForm member={member} onAdd={onAction} />
    </div>
  );
}

function CrewComments({ comments, onAction }) {
  const [author, setAuthor] = useState("");
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const names = Object.fromEntries(CREW.map(({ id, name }) => [id, name]));
  const opts = CREW.map(({ id, name }) => <option key={id} value={id}>{name}</option>);
  return (
    <section className={PANEL}>
      <h3 className="flex items-center gap-2 text-lg font-semibold"><MessageSquare size={19} aria-hidden="true" /> Retroalimentación</h3>
      <form onSubmit={(event) => {
        event.preventDefault();
        if (!author || !text.trim()) return;
        onAction({ type: "comment", comment: { id: crypto.randomUUID(), author, subject, text: text.trim(), created: new Date().toISOString() } });
        setText("");
      }}>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className={LABEL}>Autor
            <select className={INPUT} value={author} required onChange={(event) => setAuthor(event.target.value)}>
              <option value="">Selecciona un integrante</option>{opts}
            </select>
          </label>
          <label className={LABEL}>Sobre
            <select className={INPUT} value={subject} onChange={(event) => setSubject(event.target.value)}>
              <option value="">Toda la tripulación</option>{opts}
            </select>
          </label>
        </div>
        <label className={`mt-3 ${LABEL}`}>Comentario
          <textarea className={INPUT} rows={3} maxLength={500} required value={text} onChange={(event) => setText(event.target.value)} />
        </label>
        <button className={`mt-3 ${BUTTON}`} disabled={!text.trim()}>Publicar en la bitácora</button>
      </form>
      <h4 className="mt-5 border-t border-slate-200 pt-4 text-sm font-semibold">Historial de comentarios</h4>
      {comments.length ? (
        <ol className="mt-3 grid gap-3">
          {comments.map((comment) => (
            <li key={comment.id} className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <span className="text-sm font-semibold">{names[comment.author]}</span>
                <time className="text-xs text-slate-600" dateTime={comment.created}>{new Date(comment.created).toLocaleString("es", { dateStyle: "medium", timeStyle: "short" })}</time>
              </div>
              <p className="mt-1 text-xs text-slate-600">Sobre {names[comment.subject] ?? "toda la tripulación"}</p>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm">{comment.text}</p>
            </li>
          ))}
        </ol>
      ) : <p className="mt-2 text-sm text-slate-600">Todavía no hay comentarios.</p>}
    </section>
  );
}

export function ActivitiesPage({ log, day, onAction, pending, publicSite }) {
  return (
    <>
      <PageHeading title="Actividades y retroalimentación" description="Asigna actividades y consulta las observaciones de la tripulación." />
      {publicSite && <p className="mb-4 text-sm text-slate-600">Las actividades y los comentarios de esta sesión se guardan en este navegador.</p>}
      {pending > 0 && <p role="status" className="mb-4 text-sm text-amber-800">{pending} cambios de la bitácora pendientes de sincronizar.</p>}
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <div className="grid gap-5">
          <ActivityForm onAdd={onAction} />
          <section className={PANEL}>
            <h3 className="text-lg font-semibold">Actividades programadas</h3>
            <ul className="mt-3 grid gap-2">
              {CREW.map((member) => (
                <li key={member.id}>
                  <details className="group rounded-lg border border-slate-200">
                    <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600 [&::-webkit-details-marker]:hidden">
                      <span className="mr-auto">{member.name}</span>
                      <span className="font-normal text-slate-600">{activitiesFor(log, member.id, day).length} asignadas</span>
                      <ChevronDown size={16} className="text-blue-700 transition group-open:rotate-180" aria-hidden="true" />
                    </summary>
                    <div className="border-t border-slate-200 px-3 py-3">
                      <RoutineList member={member} log={log} day={day} onAction={onAction} />
                      <a className="mt-2 inline-flex rounded text-sm font-semibold text-blue-800 hover:underline focus-visible:outline-2 focus-visible:outline-blue-600" href={`#/integrantes/${member.id}`}>
                        Ver perfil de {member.name}
                      </a>
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          </section>
        </div>
        <CrewComments comments={log.comments} onAction={onAction} />
      </div>
    </>
  );
}
