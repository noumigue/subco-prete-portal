import { clearPortalJwt } from '@/lib/portal-auth';
import { redirect } from 'next/navigation';

export default async function LogoutPage() {
  await clearPortalJwt();
  redirect('/connexion');
}
