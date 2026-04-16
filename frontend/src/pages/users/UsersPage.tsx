import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Search, Shield, User } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { usersApi } from '@/api/usersApi';
import { authApi } from '@/api/authApi';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { TableSkeleton } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { useDebounce } from '@/hooks/useDebounce';
import { formatDateLong } from '@/utils/format';

const inviteSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
});

type InviteForm = z.infer<typeof inviteSchema>;

const UsersPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  const { data: res, isLoading } = useQuery({
    queryKey: ['users', page, debouncedSearch],
    queryFn: () => usersApi.getAll({ pageIndex: page, pageSize: 15, search: debouncedSearch || undefined }),
  });

  const users = res?.data?.results ?? [];
  const metaData = res?.data?.metaData;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
  });

  const inviteMutation = useMutation({
    mutationFn: authApi.inviteUser,
    onSuccess: (res) => {
      if (res.data.status) {
        toast.success('Invitation sent successfully!');
        setShowInviteModal(false);
        reset();
      } else {
        toast.error(res.data.errorMessage || 'Failed to send invitation');
      }
    },
    onError: (error: any) =>
      toast.error(error.response?.data?.errorMessage || 'Failed to send invitation'),
  });

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Users</h1>
          <p className="text-sm text-surface-500 mt-0.5">
            {metaData ? `${metaData.totalCount} team members` : 'Manage your team'}
          </p>
        </div>
        <Button
          leftIcon={<UserPlus size={16} />}
          onClick={() => setShowInviteModal(true)}
        >
          Invite User
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-card border border-surface-100 p-4">
        <Input
          placeholder="Search users by name or email..."
          leftElement={<Search size={15} />}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {/* Users table */}
      <div className="bg-white rounded-2xl shadow-card border border-surface-100 overflow-hidden">
        {isLoading ? (
          <div className="p-6"><TableSkeleton rows={5} cols={4} /></div>
        ) : users.length === 0 ? (
          <EmptyState
            icon={<User size={28} />}
            title={search ? 'No users found' : 'No users yet'}
            description={search ? 'Try adjusting your search' : 'Invite team members to get started'}
            action={!search ? { label: 'Invite User', onClick: () => setShowInviteModal(true) } : undefined}
          />
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-50 border-b border-surface-100">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">User</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Email</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Role</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-50">
                  {users.map((user, i) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className="hover:bg-surface-50 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-primary-700 text-sm font-semibold">
                              {user.firstName[0]}{user.lastName[0]}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-surface-800">{user.fullName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="flex items-center gap-1.5 text-sm text-surface-600">
                          <Mail size={13} className="text-surface-400" />
                          {user.email}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={user.role === 'Admin' ? 'info' : 'default'}
                        >
                          {user.role === 'Admin' ? (
                            <span className="flex items-center gap-1"><Shield size={10} /> Admin</span>
                          ) : (
                            <span className="flex items-center gap-1"><User size={10} /> User</span>
                          )}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="success">Active</Badge>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden divide-y divide-surface-50">
              {users.map(user => (
                <div key={user.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-700 text-sm font-semibold">{user.firstName[0]}{user.lastName[0]}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-surface-800">{user.fullName}</p>
                      <p className="text-xs text-surface-400">{user.email}</p>
                    </div>
                  </div>
                  <Badge variant={user.role === 'Admin' ? 'info' : 'default'}>{user.role}</Badge>
                </div>
              ))}
            </div>

            {metaData && (
              <div className="px-4 border-t border-surface-100">
                <Pagination metaData={metaData} onPageChange={setPage} />
              </div>
            )}
          </>
        )}
      </div>

      {/* Invite Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => { setShowInviteModal(false); reset(); }}
        title="Invite Team Member"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => { setShowInviteModal(false); reset(); }}>Cancel</Button>
            <Button
              onClick={handleSubmit(data => inviteMutation.mutate(data))}
              isLoading={inviteMutation.isPending}
              leftIcon={<Mail size={15} />}
            >
              Send Invitation
            </Button>
          </div>
        }
      >
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              placeholder="John"
              error={errors.firstName?.message}
              required
              {...register('firstName')}
            />
            <Input
              label="Last Name"
              placeholder="Doe"
              error={errors.lastName?.message}
              required
              {...register('lastName')}
            />
          </div>
          <Input
            label="Email Address"
            type="email"
            placeholder="john.doe@example.com"
            error={errors.email?.message}
            required
            {...register('email')}
          />
          <div className="rounded-xl bg-primary-50 border border-primary-100 p-3 text-xs text-primary-700">
            An invitation email will be sent with a link to create their account. The link expires in 7 days.
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UsersPage;
