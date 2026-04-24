import { useForm } from 'react-hook-form';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/auth';
import { Button, Input } from '../../components/ui';

export default function RegisterPage() {
  const { user, register: registerUser } = useAuth();
  const { register, handleSubmit } = useForm();

  if (user) {
    return <Navigate to="/" />;
  }

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  const handleMicrosoftLogin = () => {
    window.location.href = '/api/auth/microsoft';
  };

  return (
    <div className="enterprise-auth-layout">
      <div className="enterprise-auth-form-container">
        <h1 className="enterprise-auth-title">Create an Account</h1>
        <p className="enterprise-auth-subtitle">Join the Real Estate CRM</p>

        <form onSubmit={handleSubmit(registerUser)} className="enterprise-auth-form">
          <Input label="Name" {...register('name', { required: true })} />
          <Input type="email" label="Email" {...register('email', { required: true })} />
          <Input type="password" label="Password" {...register('password', { required: true })} />
          <Button type="submit" className="w-full">Register</Button>
        </form>

        <div className="enterprise-auth-divider">
          <span>OR</span>
        </div>

        <div className="enterprise-auth-social-logins">
          <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>Sign up with Google</Button>
          <Button variant="outline" className="w-full" onClick={handleMicrosoftLogin}>Sign up with Microsoft</Button>
        </div>

        <p className="enterprise-auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
