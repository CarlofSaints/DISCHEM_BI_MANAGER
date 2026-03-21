import ClientForm from '@/components/ClientForm';

export default function NewClientPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-800">Add Client</h1>
      <ClientForm />
    </div>
  );
}
