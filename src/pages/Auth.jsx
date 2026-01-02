
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Mail, Lock, Loader2, ArrowRight, UserPlus, LogIn, KeyRound } from 'lucide-react';

const Auth = () => {
  const [view, setView] = useState('login'); // 'login', 'register', 'forgot-password'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (view === 'login') {
        const { error } = await signIn(email, password);
        if (!error) {
          toast({
            title: "Welcome back",
            description: "You have successfully logged in.",
          });
          navigate('/dashboard');
        }
      } else if (view === 'register') {
        const { error } = await signUp(email, password);
        if (!error) {
          const { error: signInError } = await signIn(email, password);
          if (!signInError) {
             navigate('/dashboard');
          } else {
             toast({
               title: "Account Created",
               description: "Please log in with your credentials.",
             });
             setView('login');
          }
        }
      } else if (view === 'forgot-password') {
        await resetPassword(email);
        setView('login');
      }
    } catch (error) {
       console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    if (view === 'login') return 'Welcome Back';
    if (view === 'register') return 'Create Account';
    return 'Reset Password';
  };

  const getDescription = () => {
    if (view === 'login') return 'Enter your credentials to continue';
    if (view === 'register') return 'Join thousands of professionals today';
    return 'Enter your email to receive a reset link';
  };

  const getIcon = () => {
    if (view === 'login') return <LogIn className="w-6 h-6" />;
    if (view === 'register') return <UserPlus className="w-6 h-6" />;
    return <KeyRound className="w-6 h-6" />;
  };

  return (
    <div className="min-h-screen pt-16 flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      <motion.div
        key={view}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-[450px]"
      >
        <Card className="border-none shadow-xl bg-white/80 backdrop-blur-lg overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-indigo-600" />
          
          <CardHeader className="space-y-1 text-center pb-8 pt-8">
             <div className="mx-auto w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 text-primary">
               {getIcon()}
             </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
              {getTitle()}
            </CardTitle>
            <CardDescription className="text-slate-500 text-base">
              {getDescription()}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium">Email Address</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>
              
              {view !== 'forgot-password' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" classname="text-slate-700 font-medium">Password</Label>
                    {view === 'login' && (
                      <button 
                        type="button"
                        onClick={() => setView('forgot-password')}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Your secure password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                      required
                    />
                  </div>
                </div>
              )}

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-11 font-semibold text-base shadow-md bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {view === 'login' ? 'Sign In' : view === 'register' ? 'Create Account' : 'Send Reset Link'} 
                    {view !== 'forgot-password' && <ArrowRight className="w-4 h-4" />}
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="justify-center border-t border-slate-100 py-6 bg-slate-50/50 flex-col gap-2">
            <p className="text-sm text-slate-600">
              {view === 'login' && "Don't have an account? "}
              {view === 'register' && "Already have an account? "}
              {view === 'forgot-password' && "Remember your password? "}
              
              <button
                type="button"
                onClick={() => {
                  if (view === 'login') setView('register');
                  else setView('login');
                }}
                className="font-semibold text-primary hover:underline focus:outline-none"
              >
                {view === 'login' && "Sign up"}
                {view === 'register' && "Sign in"}
                {view === 'forgot-password' && "Sign in"}
              </button>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default Auth;
