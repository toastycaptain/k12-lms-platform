export interface PresencePerson {
  id: string;
  name: string;
}

interface PresenceStackProps {
  people: PresencePerson[];
}

export function PresenceStack({ people }: PresenceStackProps) {
  return (
    <div className="flex -space-x-3">
      {people.map((person) => (
        <span
          key={person.id}
          title={person.name}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-xs font-semibold text-slate-700"
        >
          {person.name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join("")
            .toUpperCase()}
        </span>
      ))}
    </div>
  );
}
