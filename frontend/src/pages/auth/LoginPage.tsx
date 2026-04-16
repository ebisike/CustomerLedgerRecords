import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { authApi } from '@/api/authApi';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (res) => {
      const data = res.data;
      if (data.status && data.results) {
        const { user, accessToken, refreshToken, expiresAt } = data.results;
        setAuth(user, accessToken, refreshToken, expiresAt ? new Date(expiresAt).getTime() : undefined);
        navigate('/dashboard', { replace: true });
      } else {
        toast.error(data.errorMessage || 'Login failed');
      }
    },
    onError: (error: any) => {
      const msg = error.response?.data?.errorMessage || 'Invalid email or password';
      toast.error(msg);
    },
  });

  const onSubmit = (data: FormData) => mutation.mutate(data);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-surface-900">Welcome back</h2>
        <p className="text-surface-500 text-sm mt-1">Sign in to your account to continue</p>
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
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Enter your password"
          leftElement={<Lock size={16} />}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-surface-400 hover:text-surface-600 transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
          error={errors.password?.message}
          required
          {...register('password')}
        />

        <div className="flex items-center justify-end">
          <Link to="/auth/forgot-password" className="text-sm text-primary-700 hover:text-primary-800 font-medium">
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={mutation.isPending}
        >
          Sign in
        </Button>
      </form>
    </div>
  );
};

export default LoginPage;
