// app/(main)/learning-path/page.tsx
import { redirect } from 'next/navigation';

export default function LearningPathRedirectPage() {
  redirect('/jobs');
}
