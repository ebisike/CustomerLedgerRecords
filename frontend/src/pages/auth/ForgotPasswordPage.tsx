import React from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { authApi } from '@/api/authApi';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { motion } from 'framer-motion';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
});

type FormData = z.infer<typeof schema>;

const ForgotPasswordPage: React.FC = () => {
  const [submitted, setSubmitted] = React.useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: authApi.forgotPassword,
    onSuccess: () => setSubmitted(true),
    onError: () => setSubmitted(true), // Don't reveal if email exists
  });

  const onSubmit = (data: FormData) => mutation.mutate(data);

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-4"
      >
        <div className="w-16 h-16 rounded-2xl bg-success-50 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-success-600" />
        </div>
        <h2 className="text-xl font-bold text-surface-900 mb-2">Check your email</h2>
        <p className="text-surface-500 text-sm mb-6">
          If an account with that email exists, we've sent a password reset link. Please check your inbox.
        </p>
        <Link to="/auth/login" className="text-primary-700 hover:text-primary-800 text-sm font-medium flex items-center justify-center gap-2">
          <ArrowLeft size={16} />
          Back to sign in
        </Link>
      </motion.div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-surface-900">Reset password</h2>
        <p className="text-surface-500 text-sm mt-1">
          Enter your email and we'll send you a reset link
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          leftElement={<Mail size={16} />}
          error={errors.email?.message}
          required
          {...register('email')}
        />

        <Button type="submit" className="w-full" size="lg" isLoading={mutation.isPending}>
          Send reset link
        </Button>
      </form>

      <div className="mt-5 text-center">
        <Link to="/auth/login" className="text-sm text-surface-500 hover:text-surface-700 flex items-center justify-center gap-1.5">
          <ArrowLeft size={14} />
          Back to sign in
        </Link>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
