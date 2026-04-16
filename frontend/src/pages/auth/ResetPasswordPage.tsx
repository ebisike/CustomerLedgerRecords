import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, CheckCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { authApi } from '@/api/authApi';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { motion } from 'framer-motion';

const schema = z.object({
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: authApi.resetPassword,
    onSuccess: (res) => {
      if (res.data.status) {
        setSuccess(true);
      } else {
        toast.error(res.data.errorMessage || 'Failed to reset password');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.errorMessage || 'Invalid or expired reset link');
    },
  });

  const onSubmit = (data: FormData) =>
    mutation.mutate({ token, newPassword: data.newPassword, confirmPassword: data.confirmPassword });

  if (!token) {
    return (
      <div className="text-center py-4">
        <p className="text-danger-600">Invalid reset link. Please request a new one.</p>
        <Link to="/auth/forgot-password" className="text-primary-700 text-sm mt-3 block">Request reset link</Link>
      </div>
    );
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-4"
      >
        <div className="w-16 h-16 rounded-2xl bg-success-50 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-success-600" />
        </div>
        <h2 className="text-xl font-bold text-surface-900 mb-2">Password reset!</h2>
        <p className="text-surface-500 text-sm mb-6">Your password has been updated successfully.</p>
        <Button onClick={() => navigate('/auth/login')} className="w-full">
          Sign in now
        </Button>
      </motion.div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-surface-900">Set new password</h2>
        <p className="text-surface-500 text-sm mt-1">Choose a strong password for your account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="New password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Minimum 8 characters"
          leftElement={<Lock size={16} />}
          rightElement={
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-surface-400 hover:text-surface-600">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
          hint="At least 8 characters, 1 uppercase, 1 number"
          error={errors.newPassword?.message}
          required
          {...register('newPassword')}
        />
        <Input
          label="Confirm password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Re-enter password"
          leftElement={<Lock size={16} />}
          error={errors.confirmPassword?.message}
          required
          {...register('confirmPassword')}
        />

        <Button type="submit" className="w-full" size="lg" isLoading={mutation.isPending}>
          Reset password
        </Button>
      </form>
    </div>
  );
};

export default ResetPasswordPage;
