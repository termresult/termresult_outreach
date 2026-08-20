import { FormSelect } from "@/components/ui/form-select";
import type { ContactQuery } from "@/lib/contacts/query";

export function ContactsFilters({
  query,
  areas,
}: {
  query: ContactQuery;
  areas: string[];
}) {
  return (
    <form method="get" className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <input
        name="q"
        defaultValue={query.q}
        placeholder="Search school name"
        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
      />
      <FormSelect name="phone" defaultValue={query.phone}>
        <option value="">Any phone</option>
        <option value="yes">Has phone</option>
        <option value="no">No phone</option>
      </FormSelect>
      <FormSelect name="email" defaultValue={query.email}>
        <option value="">Any email</option>
        <option value="yes">Has email</option>
        <option value="no">No email</option>
      </FormSelect>
      <FormSelect name="source" defaultValue={query.source}>
        <option value="">Any source</option>
        <option value="maps">Google Maps</option>
        <option value="directory">Directory</option>
      </FormSelect>
      <FormSelect name="area" defaultValue={query.area}>
        <option value="">Any area</option>
        {areas.map((area) => (
          <option key={area} value={area}>
            {area}
          </option>
        ))}
      </FormSelect>
      <button
        type="submit"
        className="h-10 rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm sm:col-span-2 lg:col-span-5"
      >
        Apply filters
      </button>
    </form>
  );
}
