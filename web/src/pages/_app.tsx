import '~/styles/main.css'
import Head from 'next/head'
import { AppProps } from 'next/app'
import { DefaultSeo } from 'next-seo'
import { SessionProvider } from 'next-auth/react'
import SEO from '~/../next-seo.config'
import EmojiFavicon from '~/components/primitives/EmojiFavicon'

function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#fd015d" />
      </Head>
      <DefaultSeo {...SEO} />
      <Component {...pageProps} />
      <EmojiFavicon emoji="🤖" />
    </SessionProvider>
  )
}

export default App
