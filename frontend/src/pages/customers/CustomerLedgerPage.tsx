import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus, Download, Filter, X, FileText, FileSpreadsheet,
  ChevronUp, ChevronDown, TrendingUp, TrendingDown, Wallet
} from 'lucide-react';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { customersApi } from '@/api/customersApi';
import { ledgerApi } from '@/api/ledgerApi';
import { usersApi } from '@/api/usersApi';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { EmptyState } from '@/components/common/EmptyState';
import { TableSkeleton, PageLoader } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate, formatDateTime, downloadBlob } from '@/utils/format';
import { useAuth } from '@/hooks/useAuth';

const entrySchema = z.object({
  date: z.date({ required_error: 'Date is required' }),
  description: z.string().min(1, 'Description is required').max(500),
  invoiceReceiptNumber: z.string().min(1, 'Invoice/Receipt number is required').max(100),
  amount: z.number({ invalid_type_error: 'Amount is required' }).positive('Amount must be greater than zero'),
});

type EntryForm = z.infer<typeof entrySchema>;
type EntryType = 'debit' | 'credit';

const CustomerLedgerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();

  const [showEntryModal, setShowEntryModal] = useState(false);
  const [entryType, setEntryType] = useState<EntryType | null>(null);
  const [amountDisplay, setAmountDisplay] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const pageSize = 20;
  const [filterForm, setFilterForm] = useState({
    startDate: '',
    endDate: '',
    invoiceReceiptNumber: '',
    updatedById: '',
  });
  const [sortBy, setSortBy] = useState('date');
  const [sortDescending, setSortDescending] = useState(false);
  const [exportLoading, setExportLoading] = useState<'pdf' | 'excel' | null>(null);

  const { data: customerRes, isLoading: customerLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customersApi.getById(id!),
    enabled: !!id,
  });

  const customer = customerRes?.data?.results;

  const { data: usersRes } = useQuery({
    queryKey: ['users-dropdown'],
    queryFn: () => usersApi.getAll({ pageSize: 100 }),
    enabled: isAdmin,
  });
  const users = usersRes?.data?.results ?? [];

  const queryFilters = {
    pageSize,
    sortBy,
    sortDescending,
    startDate: filterForm.startDate || undefined,
    endDate: filterForm.endDate || undefined,
    invoiceReceiptNumber: filterForm.invoiceReceiptNumber || undefined,
    updatedById: filterForm.updatedById || undefined,
  };

  const {
    data: ledgerData,
    isLoading: ledgerLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ['ledger', id, queryFilters],
    queryFn: ({ pageParam }) => ledgerApi.getEntries(id!, { ...queryFilters, pageIndex: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const meta = lastPage.data?.metaData;
      if (!meta || meta.pageIndex >= meta.totalPages) return undefined;
      return meta.pageIndex + 1;
    },
    enabled: !!id,
  });

  const entries = ledgerData?.pages.flatMap(p => p.data?.results ?? []) ?? [];
  const lastMeta = ledgerData?.pages[ledgerData.pages.length - 1]?.data?.metaData;

  const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm<EntryForm>({
    resolver: zodResolver(entrySchema),
    defaultValues: { date: new Date(), amount: undefined },
  });

  const addEntryMutation = useMutation({
    mutationFn: (data: EntryForm) =>
      ledgerApi.addEntry(id!, {
        date: data.date.toISOString(),
        description: data.description,
        invoiceReceiptNumber: data.invoiceReceiptNumber,
        debit: entryType === 'debit' ? data.amount : 0,
        credit: entryType === 'credit' ? data.amount : 0,
      }),
    onSuccess: (res) => {
      if (res.data.status) {
        toast.success('Ledger entry added!');
        queryClient.invalidateQueries({ queryKey: ['ledger', id] });
        queryClient.invalidateQueries({ queryKey: ['customer', id] });
        setShowEntryModal(false);
        setEntryType(null);
        setAmountDisplay('');
        reset({ date: new Date(), amount: undefined, description: '', invoiceReceiptNumber: '' });
      } else {
        toast.error(res.data.errorMessage);
      }
    },
    onError: (error: any) => toast.error(error.response?.data?.errorMessage || 'Failed to add entry'),
  });

  const handleExport = async (format: 'pdf' | 'excel') => {
    setExportLoading(format);
    try {
      const res = await ledgerApi.exportLedger(id!, {
        format,
        startDate: filterForm.startDate || undefined,
        endDate: filterForm.endDate || undefined,
        invoiceReceiptNumber: filterForm.invoiceReceiptNumber || undefined,
        updatedById: filterForm.updatedById || undefined,
      });
      const ext = format === 'pdf' ? 'pdf' : 'xlsx';
      const filename = `ledger_${customer?.name?.replace(/\s+/g, '_') ?? 'export'}_${new Date().toISOString().slice(0, 10)}.${ext}`;
      downloadBlob(res.data as Blob, filename);
      toast.success(`Exported as ${ext.toUpperCase()}`);
    } catch {
      toast.error('Export failed. Please try again.');
    } finally {
      setExportLoading(null);
    }
  };

  const handleSort = (col: string) => {
    if (sortBy === col) setSortDescending(!sortDescending);
    else { setSortBy(col); setSortDescending(false); }
  };

  const SortIcon = ({ col }: { col: string }) => (
    sortBy === col
      ? sortDescending
        ? <ChevronDown size={13} className="text-primary-700" />
        : <ChevronUp size={13} className="text-primary-700" />
      : <ChevronUp size={13} className="text-surface-300" />
  );

  const hasActiveFilters = Object.values(filterForm).some(Boolean);

  const clearFilters = () => {
    setFilterForm({ startDate: '', endDate: '', invoiceReceiptNumber: '', updatedById: '' });
  };

  if (customerLoading) return <PageLoader />;
  if (!customer) return (
    <div className="text-center py-20">
      <p className="text-surface-500">Customer not found.</p>
      <Button className="mt-4" onClick={() => navigate('/customers')}>Back to customers</Button>
    </div>
  );

  // Summary stats from visible entries
  const totalDebits = entries.reduce((s, e) => s + e.debit, 0);
  const totalCredits = entries.reduce((s, e) => s + e.credit, 0);
  const closingBalance = entries.length > 0 ? entries[entries.length - 1].balance : customer.currentBalance;

  return (
    <div className="space-y-5 animate-fade-in">
      <Breadcrumb items={[
        { label: 'Customers', href: '/customers' },
        { label: customer.name },
      ]} />

      {/* Customer Header */}
      <div className="bg-white rounded-2xl shadow-card border border-surface-100 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center flex-shrink-0">
              <span className="text-primary-700 text-xl font-bold">{customer.name[0]}</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-surface-900">{customer.name}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-surface-500">
                <span>{customer.phone}</span>
                {customer.email && <span>{customer.email}</span>}
                <span className="hidden sm:block text-surface-300">•</span>
                <span className="hidden sm:block truncate max-w-[200px]">{customer.address}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<FileText size={14} />}
              isLoading={exportLoading === 'pdf'}
              onClick={() => handleExport('pdf')}
            >
              PDF
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<FileSpreadsheet size={14} />}
              isLoading={exportLoading === 'excel'}
              onClick={() => handleExport('excel')}
            >
              Excel
            </Button>
            <Button
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={() => setShowEntryModal(true)}
            >
              Update Ledger
            </Button>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-surface-100">
          {[
            { label: 'Total Debits', value: `₦${formatCurrency(totalDebits)}`, icon: <TrendingUp size={16} />, color: 'text-danger-600', bg: 'bg-danger-50' },
            { label: 'Total Credits', value: `₦${formatCurrency(totalCredits)}`, icon: <TrendingDown size={16} />, color: 'text-success-600', bg: 'bg-success-50' },
            { label: 'Balance', value: `₦${formatCurrency(Math.abs(closingBalance))}`, icon: <Wallet size={16} />, color: closingBalance >= 0 ? 'text-danger-600' : 'text-success-600', bg: closingBalance >= 0 ? 'bg-danger-50' : 'bg-success-50' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className={`w-8 h-8 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center mx-auto mb-1.5`}>
                {stat.icon}
              </div>
              <p className={`text-base font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-surface-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl shadow-card border border-surface-100 p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant={showFilterPanel ? 'primary' : 'secondary'}
            size="sm"
            leftIcon={<Filter size={14} />}
            onClick={() => setShowFilterPanel(!showFilterPanel)}
          >
            Filters {hasActiveFilters && <Badge variant="info" className="ml-1 py-0 px-1.5">ON</Badge>}
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" leftIcon={<X size={13} />} onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>

        {showFilterPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-surface-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
          >
            <Input
              label="Start Date"
              type="date"
              value={filterForm.startDate}
              onChange={(e) => setFilterForm(f => ({ ...f, startDate: e.target.value }))}
            />
            <Input
              label="End Date"
              type="date"
              value={filterForm.endDate}
              onChange={(e) => setFilterForm(f => ({ ...f, endDate: e.target.value }))}
            />
            <Input
              label="Invoice/Receipt #"
              placeholder="Search invoice..."
              value={filterForm.invoiceReceiptNumber}
              onChange={(e) => setFilterForm(f => ({ ...f, invoiceReceiptNumber: e.target.value }))}
            />
            {isAdmin && (
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Updated By</label>
                <select
                  value={filterForm.updatedById}
                  onChange={(e) => setFilterForm(f => ({ ...f, updatedById: e.target.value }))}
                  className="block w-full rounded-lg border border-surface-200 bg-white text-surface-900 text-sm px-3 py-2.5 h-10 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All users</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.fullName}</option>
                  ))}
                </select>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl shadow-card border border-surface-100 overflow-hidden">
        {ledgerLoading ? (
          <div className="p-6"><TableSkeleton rows={8} cols={7} /></div>
        ) : entries.length === 0 ? (
          <EmptyState
            icon={<FileText size={28} />}
            title="No ledger entries"
            description={hasActiveFilters ? 'No entries match your current filters' : 'Add the first transaction for this customer'}
            action={!hasActiveFilters ? { label: 'Add Entry', onClick: () => setShowEntryModal(true) } : undefined}
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-50 border-b border-surface-100">
                    {[
                      { key: 'date', label: 'Date', right: false },
                      { key: 'description', label: 'Description / Narration', right: false },
                      { key: 'invoiceReceiptNumber', label: 'Invoice/Receipt #', right: false },
                      { key: 'updatedBy', label: 'Updated By', right: false },
                      { key: 'debit', label: 'Debit (₦)', right: true },
                      { key: 'credit', label: 'Credit (₦)', right: true },
                      { key: 'balance', label: 'Balance (₦)', right: true },
                    ].map(col => (
                      <th
                        key={col.key}
                        onClick={() => handleSort(col.key)}
                        className={`py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider cursor-pointer hover:text-surface-700 select-none ${col.right ? 'text-right' : 'text-left'}`}
                      >
                        <span className={`flex items-center gap-1 ${col.right ? 'justify-end' : ''}`}>
                          {col.label} <SortIcon col={col.key} />
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-50">
                  {entries.map((entry, i) => (
                    <motion.tr
                      key={entry.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="hover:bg-surface-50/60 transition-colors"
                    >
                      <td className="py-3 px-4 text-surface-700 whitespace-nowrap">{formatDate(entry.date)}</td>
                      <td className="py-3 px-4 text-surface-800 max-w-[240px]">
                        <p className="truncate">{entry.description}</p>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="default">{entry.invoiceReceiptNumber}</Badge>
                      </td>
                      <td className="py-3 px-4 text-surface-600 whitespace-nowrap">{entry.updatedByName}</td>
                      <td className="py-3 px-4 text-right">
                        {entry.debit > 0
                          ? <span className="font-semibold text-danger-600">{formatCurrency(entry.debit)}</span>
                          : <span className="text-surface-300">—</span>}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {entry.credit > 0
                          ? <span className="font-semibold text-success-600">{formatCurrency(entry.credit)}</span>
                          : <span className="text-surface-300">—</span>}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-bold ${entry.balance > 0 ? 'text-danger-600' : entry.balance < 0 ? 'text-success-600' : 'text-surface-500'}`}>
                          {formatCurrency(Math.abs(entry.balance))}
                          {entry.balance > 0 && <span className="text-xs font-normal ml-0.5">Dr</span>}
                          {entry.balance < 0 && <span className="text-xs font-normal ml-0.5">Cr</span>}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-surface-50">
              {entries.map(entry => (
                <div key={entry.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-surface-800">{entry.description}</p>
                      <p className="text-xs text-surface-400 mt-0.5">{formatDate(entry.date)} · {entry.invoiceReceiptNumber}</p>
                    </div>
                    <span className={`text-sm font-bold flex-shrink-0 ml-3 ${entry.balance > 0 ? 'text-danger-600' : 'text-success-600'}`}>
                      ₦{formatCurrency(Math.abs(entry.balance))}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-surface-500">
                    {entry.debit > 0 && <span className="text-danger-600">Dr: ₦{formatCurrency(entry.debit)}</span>}
                    {entry.credit > 0 && <span className="text-success-600">Cr: ₦{formatCurrency(entry.credit)}</span>}
                    <span className="text-surface-400 ml-auto">{entry.updatedByName}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-4 py-3 border-t border-surface-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              {lastMeta && (
                <p className="text-sm text-surface-500">{lastMeta.showing}</p>
              )}
              {hasNextPage && (
                <Button
                  variant="secondary"
                  size="sm"
                  isLoading={isFetchingNextPage}
                  onClick={() => fetchNextPage()}
                >
                  See More
                </Button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Add Ledger Entry Modal */}
      <Modal
        isOpen={showEntryModal}
        onClose={() => { setShowEntryModal(false); setEntryType(null); setAmountDisplay(''); reset(); }}
        title={entryType === null ? 'Update Ledger — Select Type' : `Update Ledger — ${entryType === 'debit' ? 'Debit Entry' : 'Credit Entry'}`}
        size="lg"
        footer={
          entryType === null ? (
            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => { setShowEntryModal(false); setAmountDisplay(''); reset(); }}>
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex justify-between gap-3">
              <Button variant="secondary" onClick={() => { setEntryType(null); setAmountDisplay(''); reset({ date: new Date(), amount: undefined, description: '', invoiceReceiptNumber: '' }); }}>
                Back
              </Button>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => { setShowEntryModal(false); setEntryType(null); setAmountDisplay(''); reset(); }}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit(data => addEntryMutation.mutate(data))} isLoading={addEntryMutation.isPending}>
                  Save Entry
                </Button>
              </div>
            </div>
          )
        }
      >
        {entryType === null ? (
          /* Step 1 — pick entry type */
          <div className="grid grid-cols-2 gap-4 py-2">
            <button
              type="button"
              onClick={() => setEntryType('debit')}
              className="flex flex-col items-center gap-3 rounded-2xl border-2 border-danger-200 bg-danger-50 hover:bg-danger-100 hover:border-danger-400 transition-all p-6 text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-danger-100 flex items-center justify-center">
                <TrendingUp size={24} className="text-danger-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-danger-700">Debit</p>
                <p className="text-xs text-danger-500 mt-0.5 leading-snug">Customer owes money — goods or services supplied on credit</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setEntryType('credit')}
              className="flex flex-col items-center gap-3 rounded-2xl border-2 border-success-200 bg-success-50 hover:bg-success-100 hover:border-success-400 transition-all p-6 text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-success-100 flex items-center justify-center">
                <TrendingDown size={24} className="text-success-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-success-700">Credit</p>
                <p className="text-xs text-success-500 mt-0.5 leading-snug">Customer made a payment — reducing their outstanding balance</p>
              </div>
            </button>
          </div>
        ) : (
          /* Step 2 — entry form */
          <form className="space-y-4">
            <div className={`rounded-xl border px-4 py-2.5 text-xs font-medium flex items-center gap-2 ${entryType === 'debit' ? 'bg-danger-50 border-danger-200 text-danger-700' : 'bg-success-50 border-success-200 text-success-700'}`}>
              {entryType === 'debit'
                ? <><TrendingUp size={14} /> Debit entry — amount the customer owes</>
                : <><TrendingDown size={14} /> Credit entry — payment received from customer</>}
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">
                Date <span className="text-danger-600">*</span>
              </label>
              <Controller
                control={control}
                name="date"
                render={({ field }) => (
                  <DatePicker
                    selected={field.value}
                    onChange={field.onChange}
                    dateFormat="dd/MM/yyyy"
                    maxDate={new Date()}
                    className="block w-full rounded-lg border border-surface-200 bg-white text-surface-900 text-sm px-3 py-2.5 h-10 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholderText="Select date"
                    wrapperClassName="w-full"
                  />
                )}
              />
              {errors.date && <p className="mt-1.5 text-xs text-danger-600">{errors.date.message}</p>}
            </div>

            <Input
              label="Description / Narration"
              placeholder={entryType === 'debit' ? 'e.g., Goods supplied on credit...' : 'e.g., Payment received via transfer...'}
              error={errors.description?.message}
              required
              {...register('description')}
            />

            <Input
              label="Invoice / Receipt Number"
              placeholder={entryType === 'debit' ? 'e.g., INV-2024-001' : 'e.g., RCP-0023'}
              error={errors.invoiceReceiptNumber?.message}
              required
              {...register('invoiceReceiptNumber')}
            />

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">
                {entryType === 'debit' ? 'Debit Amount (₦)' : 'Credit Amount (₦)'}
                <span className={`text-xs ml-1 ${entryType === 'debit' ? 'text-danger-500' : 'text-success-500'}`}>
                  {entryType === 'debit' ? '(Amount owed by customer)' : '(Payment received from customer)'}
                </span>
                <span className="text-danger-600 ml-0.5">*</span>
              </label>
              <Controller
                control={control}
                name="amount"
                render={({ field }) => (
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={amountDisplay}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/,/g, '');
                      if (raw !== '' && !/^\d*\.?\d{0,2}$/.test(raw)) return;
                      const [intPart, decPart] = raw.split('.');
                      const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (raw.includes('.') ? '.' + (decPart ?? '') : '');
                      setAmountDisplay(formatted);
                      field.onChange(raw === '' || raw === '.' ? undefined : parseFloat(raw));
                    }}
                    className={`block w-full rounded-lg border bg-white text-surface-900 text-sm px-3 py-2.5 h-10 focus:outline-none focus:ring-2 focus:border-transparent ${
                      entryType === 'debit'
                        ? 'border-danger-300 focus:ring-danger-400'
                        : 'border-success-300 focus:ring-success-400'
                    }`}
                  />
                )}
              />
              {errors.amount && <p className="mt-1 text-xs text-danger-600">{errors.amount.message}</p>}
            </div>

            {/* Live balance preview */}
            {watch('amount') > 0 && (
              <div className="rounded-xl bg-primary-50 border border-primary-100 p-3">
                <p className="text-xs font-medium text-primary-700">Balance preview</p>
                <p className="text-sm text-primary-800 mt-0.5">
                  Previous: ₦{formatCurrency(customer.currentBalance)}{' '}
                  {entryType === 'debit' ? `+ Debit ₦${formatCurrency(watch('amount') || 0)}` : `- Credit ₦${formatCurrency(watch('amount') || 0)}`} ={' '}
                  <strong>₦{formatCurrency(
                    entryType === 'debit'
                      ? customer.currentBalance + (watch('amount') || 0)
                      : customer.currentBalance - (watch('amount') || 0)
                  )}</strong>
                </p>
              </div>
            )}

            <div className="rounded-xl bg-surface-50 border border-surface-200 p-3 text-xs text-surface-500">
              <strong>Updated By</strong> will be automatically set to your account.
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default CustomerLedgerPage;
