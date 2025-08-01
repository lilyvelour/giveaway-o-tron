const title = 'Giveaway-o-tron | A Twitch giveaway tool'
const description = 'A free Twitch giveaway tool packed with features'
const url = ''

export default {
  title,
  description,
  canonical: url,
  openGraph: {
    title,
    description,
    url,
    site_name: title,
    type: 'website',
    locale: 'en_GB',
    images: [
      {
        url: `${url}/images/preview.png`,
        width: 1200,
        height: 627,
        alt: 'Giveaway-o-tron',
      },
    ],
  },
}
