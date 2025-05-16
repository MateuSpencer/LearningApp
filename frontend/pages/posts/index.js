import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function PostsIndexRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/community-posts');
  }, [router]);

  return null;
}
