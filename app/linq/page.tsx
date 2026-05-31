export const metadata = { title: 'Magpie × Linq' };

type Row = {
  time?: string;
  from?: 'user' | 'magpie';
  text?: string;
  reaction?: string;
  delivered?: boolean;
};

// The sandbox demo thread (Magpie's side is blue, the texter's side is gray).
const THREAD: Row[] = [
  { time: '5:59 PM' },
  { from: 'user', text: 'You working?' },
  { time: '6:06 PM' },
  { from: 'magpie', text: 'Hello World' },
  { from: 'user', text: 'Hello world', reaction: '👍' },
  { time: '6:15 PM' },
  { from: 'user', text: "Let's goooo!" },
  { time: '6:22 PM' },
  { from: 'user', text: 'Add a topic about how magpies collect shiny things' },
  { from: 'magpie', text: "Added to your magpie. Can't wait to chat about it.", delivered: true },
];

export default function LinqPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center gap-5 bg-bg px-4 py-8">
      <div className="w-full max-w-md">
        <h1 className="font-display text-xl font-semibold tracking-tight text-text">
          Magpie
          <span
            aria-hidden
            className="ml-1 inline-block h-2 w-2 rounded-full bg-teal align-middle"
          />
          <span className="ml-2 font-sans text-sm font-normal text-text-dim">× Linq</span>
        </h1>
        <p className="mt-1 text-sm text-text-dim">
          The iMessage front door: text Magpie at her Linq number and the thought lands in your wiki.
        </p>
      </div>

      <div className="w-full max-w-md rounded-3xl border border-border bg-bg-card p-3 shadow-xl">
        <div className="border-b border-border pb-2 text-center text-xs text-text-dim">
          Magpie · +1 (404) 384-5892
        </div>
        <div className="flex flex-col gap-1.5 px-1 py-3">
          {THREAD.map((row, i) => {
            if (row.time) {
              return (
                <div key={i} className="py-1 text-center text-[11px] text-text-dim">
                  {row.time}
                </div>
              );
            }
            const mine = row.from === 'magpie';
            return (
              <div key={i} className={mine ? 'flex justify-end' : 'flex justify-start'}>
                <div className="relative max-w-[80%]">
                  <div
                    className={
                      mine
                        ? 'rounded-2xl rounded-br-md bg-[#0b84ff] px-3.5 py-2 text-sm text-white'
                        : 'rounded-2xl rounded-bl-md bg-bg-card-2 px-3.5 py-2 text-sm text-text'
                    }
                  >
                    {row.text}
                  </div>
                  {row.reaction && (
                    <span className="absolute -top-2.5 -right-1 rounded-full border border-border bg-bg px-1 text-[10px]">
                      {row.reaction}
                    </span>
                  )}
                  {row.delivered && (
                    <div className="mt-0.5 text-right text-[10px] text-text-dim">Delivered</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
