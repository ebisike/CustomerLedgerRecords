import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, PlusCircle, BookOpen, TrendingUp, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { customersApi } from '@/api/customersApi';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/format';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: customersRes } = useQuery({
    queryKey: ['customers', 'summary'],
    queryFn: () => customersApi.getAll({ pageSize: 5, sortBy: 'createdAt', sortDescending: true }),
  });

  const customers = customersRes?.data?.results ?? [];
  const totalCustomers = customersRes?.data?.metaData?.totalCount ?? 0;

  const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.3 } }),
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">
            Good {getTimeOfDay()}, {user?.firstName}!
          </h1>
          <p className="text-surface-500 text-sm mt-0.5">
            Manage your customer accounts and credit ledgers
          </p>
        </div>
        <Button
          onClick={() => navigate('/customers')}
          leftIcon={<PlusCircle size={16} />}
          className="w-full sm:w-auto"
        >
          New Customer
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          {
            title: 'Total Customers',
            value: totalCustomers.toString(),
            icon: <Users size={20} />,
            color: 'text-primary-700',
            bg: 'bg-primary-50',
          },
          {
            title: 'Active Ledgers',
            value: totalCustomers.toString(),
            icon: <BookOpen size={20} />,
            color: 'text-success-700',
            bg: 'bg-success-50',
          },
          {
            title: 'Total Receivables',
            value: `₦${formatCurrency(customers.reduce((sum, c) => sum + (c.currentBalance > 0 ? c.currentBalance : 0), 0))}`,
            icon: <TrendingUp size={20} />,
            color: 'text-warning-600',
            bg: 'bg-warning-50',
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.title}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="bg-white rounded-2xl p-5 shadow-card border border-surface-100 hover:shadow-card-hover transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-surface-500 font-medium">{stat.title}</p>
                <p className="text-2xl font-bold text-surface-900 mt-1">{stat.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                {stat.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent customers */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="bg-white rounded-2xl shadow-card border border-surface-100"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
          <h2 className="font-semibold text-surface-800">Recent Customers</h2>
          <button
            onClick={() => navigate('/customers')}
            className="text-sm text-primary-700 hover:text-primary-800 font-medium flex items-center gap-1"
          >
            View all <ArrowRight size={14} />
          </button>
        </div>

        {customers.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Users size={32} className="text-surface-300 mx-auto mb-3" />
            <p className="text-surface-500 text-sm">No customers yet.</p>
            <Button
              size="sm"
              className="mt-4"
              leftIcon={<PlusCircle size={14} />}
              onClick={() => navigate('/customers')}
            >
              Add your first customer
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-surface-50">
            {customers.map((customer) => (
              <div
                key={customer.id}
                onClick={() => navigate(`/customers/${customer.id}/ledger`)}
                className="flex items-center justify-between px-6 py-3.5 hover:bg-surface-50 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-700 text-sm font-semibold">{customer.name[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-surface-800">{customer.name}</p>
                    <p className="text-xs text-surface-400">{customer.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-semibold ${customer.currentBalance >= 0 ? 'text-danger-600' : 'text-success-600'}`}>
                    ₦{formatCurrency(Math.abs(customer.currentBalance))}
                  </span>
                  <ArrowRight size={14} className="text-surface-300 group-hover:text-surface-500 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

export default DashboardPage;
