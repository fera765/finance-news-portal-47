
import { useState } from 'react';
import { subscribeToNewsletter } from '@/services/newsletterService';
import { toast } from 'sonner';

export function useNewsletter() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubscribe = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Por favor, informe um email válido');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await subscribeToNewsletter(email);
      toast.success('Inscrição realizada com sucesso!');
      setEmail('');
    } catch (error: any) {
      if (error.message === 'Este email já está inscrito na newsletter') {
        toast.info(error.message);
      } else {
        toast.error('Ocorreu um erro ao realizar a inscrição. Tente novamente.');
        console.error('Newsletter subscription error:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    email,
    setEmail,
    isLoading,
    handleSubscribe
  };
}
