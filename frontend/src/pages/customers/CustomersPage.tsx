import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, BookOpen, Phone, Mail, SlidersHorizontal, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { customersApi } from '@/api/customersApi';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { Badge } from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { formatCurrency, formatDateLong } from '@/utils/format';
import type { CustomerFilters } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  address: z.string().min(1, 'Address is required').max(500),
  phone: z.string().min(1, 'Phone is required').max(20),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
});

type CustomerForm = z.infer<typeof customerSchema>;

const CustomersPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<CustomerFilters>({ pageIndex: 1, pageSize: 10 });
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState<any>(null);

  const debouncedSearch = useDebounce(search, 400);

  const queryFilters = { ...filters, search: debouncedSearch || undefined };

  const { data: response, isLoading } = useQuery({
    queryKey: ['customers', queryFilters],
    queryFn: () => customersApi.getAll(queryFilters),
  });

  const customers = response?.data?.results ?? [];
  const metaData = response?.data?.metaData;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
  });

  const createMutation = useMutation({
    mutationFn: customersApi.create,
    onSuccess: (res) => {
      if (res.data.status) {
        toast.success('Customer created successfully!');
        queryClient.invalidateQueries({ queryKey: ['customers'] });
        setShowModal(false);
        reset();
      } else {
        toast.error(res.data.errorMessage);
      }
    },
    onError: (error: any) => toast.error(error.response?.data?.errorMessage || 'Failed to create customer'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CustomerForm }) =>
      customersApi.update(id, data),
    onSuccess: (res) => {
      if (res.data.status) {
        toast.success('Customer updated successfully!');
        queryClient.invalidateQueries({ queryKey: ['customers'] });
        setShowModal(false);
        setEditCustomer(null);
        reset();
      } else {
        toast.error(res.data.errorMessage);
      }
    },
    onError: (error: any) => toast.error(error.response?.data?.errorMessage || 'Failed to update customer'),
  });

  const onSubmit = (data: CustomerForm) => {
    const payload = { ...data, email: data.email || undefined };
    if (editCustomer) {
      updateMutation.mutate({ id: editCustomer.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const openCreate = () => {
    setEditCustomer(null);
    reset({ name: '', address: '', phone: '', email: '' });
    setShowModal(true);
  };

  const openEdit = (customer: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditCustomer(customer);
    reset({ name: customer.name, address: customer.address, phone: customer.phone, email: customer.email || '' });
    setShowModal(true);
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Customers</h1>
          <p className="text-sm text-surface-500 mt-0.5">
            {metaData ? `${metaData.totalCount} total customers` : 'Manage your customer accounts'}
          </p>
        </div>
        <Button onClick={openCreate} leftIcon={<Plus size={16} />}>
          Create Customer
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl shadow-card border border-surface-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by name, phone, or email..."
              leftElement={<Search size={15} />}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setFilters(f => ({ ...f, pageIndex: 1 })); }}
              rightElement={search ? (
                <button onClick={() => setSearch('')} className="text-surface-400 hover:text-surface-600">
                  <X size={14} />
                </button>
              ) : undefined}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-card border border-surface-100 overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={5} cols={5} />
          </div>
        ) : customers.length === 0 ? (
          <EmptyState
            icon={<Search size={28} />}
            title={search ? 'No customers found' : 'No customers yet'}
            description={search ? 'Try adjusting your search terms' : 'Create your first customer to get started'}
            action={!search ? { label: 'Create Customer', onClick: openCreate } : undefined}
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-50 border-b border-surface-100">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Customer</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Phone</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Email</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Balance</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Joined</th>
                    <th className="py-3 px-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-50">
                  {customers.map((customer, i) => (
                    <motion.tr
                      key={customer.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-surface-50 cursor-pointer group transition-colors"
                      onClick={() => navigate(`/customers/${customer.id}/ledger`)}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-primary-700 text-sm font-semibold">{customer.name[0].toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-surface-800">{customer.name}</p>
                            <p className="text-xs text-surface-400 truncate max-w-[180px]">{customer.address}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-sm text-surface-600">{customer.phone}</td>
                      <td className="py-3.5 px-4 text-sm text-surface-600">{customer.email || <span className="text-surface-300">—</span>}</td>
                      <td className="py-3.5 px-4">
                        <span className={`text-sm font-semibold ${customer.currentBalance > 0 ? 'text-danger-600' : customer.currentBalance < 0 ? 'text-success-600' : 'text-surface-500'}`}>
                          ₦{formatCurrency(Math.abs(customer.currentBalance))}
                        </span>
                        {customer.currentBalance > 0 && <Badge variant="danger" className="ml-2 text-xs">Owes</Badge>}
                        {customer.currentBalance < 0 && <Badge variant="success" className="ml-2 text-xs">Credit</Badge>}
                      </td>
                      <td className="py-3.5 px-4 text-sm text-surface-400">{formatDateLong(customer.createdAt)}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => openEdit(customer, e)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            leftIcon={<BookOpen size={13} />}
                            onClick={() => navigate(`/customers/${customer.id}/ledger`)}
                          >
                            Ledger
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-surface-50">
              {customers.map((customer) => (
                <div
                  key={customer.id}
                  className="p-4 hover:bg-surface-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/customers/${customer.id}/ledger`)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-primary-700 text-xs font-semibold">{customer.name[0]}</span>
                      </div>
                      <span className="font-medium text-surface-800 text-sm">{customer.name}</span>
                    </div>
                    <span className={`text-sm font-semibold ${customer.currentBalance > 0 ? 'text-danger-600' : 'text-success-600'}`}>
                      ₦{formatCurrency(Math.abs(customer.currentBalance))}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-surface-400">
                    <span className="flex items-center gap-1"><Phone size={11} />{customer.phone}</span>
                    {customer.email && <span className="flex items-center gap-1"><Mail size={11} />{customer.email}</span>}
                  </div>
                </div>
              ))}
            </div>

            {metaData && (
              <div className="px-4 border-t border-surface-100">
                <Pagination
                  metaData={metaData}
                  onPageChange={(page) => setFilters(f => ({ ...f, pageIndex: page }))}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditCustomer(null); reset(); }}
        title={editCustomer ? 'Edit Customer' : 'Create Customer'}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => { setShowModal(false); reset(); }}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              isLoading={isSubmitting}
            >
              {editCustomer ? 'Save changes' : 'Create customer'}
            </Button>
          </div>
        }
      >
        <form className="space-y-4">
          <Input
            label="Customer Name"
            placeholder="Full name or company name"
            error={errors.name?.message}
            required
            {...register('name')}
          />
          <Input
            label="Address"
            placeholder="Street address, city, state"
            error={errors.address?.message}
            required
            {...register('address')}
          />
          <Input
            label="Phone Number"
            placeholder="+234 800 000 0000"
            type="tel"
            error={errors.phone?.message}
            required
            {...register('phone')}
          />
          <Input
            label="Email Address"
            placeholder="customer@example.com"
            type="email"
            error={errors.email?.message}
            {...register('email')}
          />
        </form>
      </Modal>
    </div>
  );
};

export default CustomersPage;
