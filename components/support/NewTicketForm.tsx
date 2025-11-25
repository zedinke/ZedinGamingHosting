'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

const ticketSchema = z.object({
  subject: z.string().min(5, 'A tárgynak legalább 5 karakter hosszúnak kell lennie'),
  category: z.enum(['TECHNICAL', 'BILLING', 'GENERAL', 'SERVER_ISSUE']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  message: z.string().min(10, 'Az üzenetnek legalább 10 karakter hosszúnak kell lennie'),
});

type TicketFormData = z.infer<typeof ticketSchema>;

interface NewTicketFormProps {
  locale: string;
}

export function NewTicketForm({ locale }: NewTicketFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      category: 'GENERAL',
      priority: 'MEDIUM',
    },
  });

  const onSubmit = async (data: TicketFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/support/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Hiba történt a ticket létrehozása során');
        return;
      }

      toast.success('Ticket sikeresen létrehozva!');
      router.push(`/${locale}/dashboard/support/${result.ticketId}`);
    } catch (error) {
      toast.error('Hiba történt');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card space-y-6">
      <div>
        <label htmlFor="subject" className="block text-sm font-medium mb-1">
          Tárgy *
        </label>
        <input
          {...register('subject')}
          type="text"
          id="subject"
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
          placeholder="Rövid leírás a problémáról"
        />
        {errors.subject && (
          <p className="text-red-500 text-sm mt-1">{errors.subject.message}</p>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="category" className="block text-sm font-medium mb-1">
            Kategória *
          </label>
          <select
            {...register('category')}
            id="category"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="GENERAL">Általános</option>
            <option value="TECHNICAL">Technikai</option>
            <option value="BILLING">Számlázás</option>
            <option value="SERVER_ISSUE">Szerver probléma</option>
          </select>
          {errors.category && (
            <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="priority" className="block text-sm font-medium mb-1">
            Prioritás *
          </label>
          <select
            {...register('priority')}
            id="priority"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="LOW">Alacsony</option>
            <option value="MEDIUM">Közepes</option>
            <option value="HIGH">Magas</option>
            <option value="URGENT">Sürgős</option>
          </select>
          {errors.priority && (
            <p className="text-red-500 text-sm mt-1">{errors.priority.message}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium mb-1">
          Üzenet *
        </label>
        <textarea
          {...register('message')}
          id="message"
          rows={8}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
          placeholder="Részletes leírás a problémáról..."
        />
        {errors.message && (
          <p className="text-red-500 text-sm mt-1">{errors.message.message}</p>
        )}
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          {isLoading ? 'Küldés...' : 'Ticket létrehozása'}
        </button>
        <a
          href={`/${locale}/dashboard/support`}
          className="px-6 py-3 border rounded-lg hover:bg-gray-50 text-center"
        >
          Mégse
        </a>
      </div>
    </form>
  );
}

