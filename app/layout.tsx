import type { Metadata } from 'next';
import './globals.css';
import { getAdminSupabase } from '@/lib/supabase';
import PwaRegister from '@/components/PwaRegister';

export const revalidate = 0; // Disable caching so it always fetches fresh DB values

export async function generateMetadata(): Promise<Metadata> {
  const supabase = getAdminSupabase();
  const { data } = await supabase
    .from('page_config')
    .select('sections')
    .eq('key', 'default')
    .single();

  const heroSection = data?.sections?.find((s: any) => s.type === 'hero');
  const title = heroSection?.title || 'صفحة الهبوط الاحترافية';
  const description = heroSection?.subtitle || 'موقع تسوق احترافي';

  return {
    title,
    description,
    manifest: '/manifest.json',
    themeColor: '#0f172a',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: title,
    },
    viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = getAdminSupabase();
  const { data } = await supabase
    .from('page_config')
    .select('pixel_id')
    .eq('key', 'default')
    .single();

  const pixelId = data?.pixel_id || '';

  return (
    <html lang="ar" dir="rtl">
      <head>
        {/* Meta Pixel Code */}
        {pixelId && (
          <>
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  !function(f,b,e,v,n,t,s)
                  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                  n.queue=[];t=b.createElement(e);t.async=!0;
                  t.src=v;s=b.getElementsByTagName(e)[0];
                  s.parentNode.insertBefore(t,s)}(window, document,'script',
                  'https://connect.facebook.net/en_US/fbevents.js');
                  fbq('init', '${pixelId}');
                  fbq('track', 'PageView');
                `,
              }}
            />
            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: 'none' }}
                src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
                alt="fb-pixel"
              />
            </noscript>
          </>
        )}
      </head>
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
