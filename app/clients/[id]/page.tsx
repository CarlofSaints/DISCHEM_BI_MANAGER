import { getClient } from '@/lib/kv';
import ClientForm from '@/components/ClientForm';
import { notFound } from 'next/navigation';

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-800">Edit Client — {client.name}</h1>
      <ClientForm client={client} />
    </div>
  );
}
