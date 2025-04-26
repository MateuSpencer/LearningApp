import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useUser, useConfig } from '../../auth';
import { getEmailAddresses, logout } from '../../lib/allauth';

export default function Profile() {
  const user = useUser();
  const config = useConfig();
  const router = useRouter();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user) {
      router.push('/account/login');
      return;
    }

    // Fetch email addresses
    const fetchEmails = async () => {
      try {
        const response = await getEmailAddresses();
        if (response.status === 200) {
          setEmails(response.data);
        }
      } catch (error) {
        console.error('Error fetching email addresses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmails();
  }, [user, router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div>
      <h1>Your Profile</h1>
      
      <section>
        <h2>Account Information</h2>
        <p><strong>Username:</strong> {user.username}</p>
        
        {loading ? (
          <p>Loading email information...</p>
        ) : (
          <div>
            <h3>Email Addresses</h3>
            <ul>
              {emails.map(email => (
                <li key={email.email}>
                  {email.email} 
                  {email.verified ? ' (Verified)' : ' (Unverified)'} 
                  {email.primary ? ' (Primary)' : ''}
                </li>
              ))}
            </ul>
            <Link href="/account/email">Manage Email Addresses</Link>
          </div>
        )}
      </section>

      <section>
        <h2>Account Management</h2>
        <ul>
          <li><Link href="/account/password/change">Change Password</Link></li>
          {config?.data?.mfa && (
            <li><Link href="/account/2fa">Manage Two-Factor Authentication</Link></li>
          )}
          {config?.data?.usersessions && (
            <li><Link href="/account/sessions">Manage Active Sessions</Link></li>
          )}
        </ul>
      </section>

      <button onClick={handleLogout}>Log Out</button>
    </div>
  );
}